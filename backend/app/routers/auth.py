from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import User, RoleEnum, Hospital, Patient
from app.schemas import SSOTokenValidate, SSOUserData, Token, UserResponse, SSOHospitalData, SSOPatientData
from app.config import settings
from fastapi.security import OAuth2PasswordBearer
import uuid

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    return user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user



@router.post("/sso/validate", response_model=Token)
async def validate_sso_token(
    sso_data: SSOTokenValidate,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate SSO token from WizeFlow.
    1. Validate signature
    2. Sync Hospital (Tenant)
    3. Sync User (Doctor/Staff)
    4. Sync Patient (Optional Context for Deep Linking)
    5. Return Access Token + Context
    """
    
    try:
        # Decode WizeFlow token
        payload = jwt.decode(
            sso_data.token,
            settings.SECRET_KEY, # In prod, verify with WizeFlow Public Key
            algorithms=[settings.ALGORITHM]
        )
        
        user_data = payload.get("user")
        hospital_data = payload.get("hospital")
        patient_data = payload.get("patient") # Optional
        
        if not user_data or not hospital_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid SSO payload structure"
            )
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate SSO token"
        )

    # 1. Sync Hospital
    # Ideally lookup by external_id, for now using name/id mapping
    hospital_result = await db.execute(select(Hospital).where(Hospital.name == hospital_data.get("name")))
    hospital = hospital_result.scalar_one_or_none()
    
    if not hospital:
        hospital = Hospital(
            name=hospital_data.get("name"),
            status=hospital_data.get("status", "ACTIVE"),
            subscription_tier=hospital_data.get("subscription_tier", "STANDARD")
        )
        db.add(hospital)
        await db.commit()
        await db.refresh(hospital)

    # 2. Sync User
    user_result = await db.execute(select(User).where(User.email == user_data.get("email")))
    user = user_result.scalar_one_or_none()
    
    role_str = user_data.get("role", "DOCTOR").upper()
    role_enum = RoleEnum[role_str] if role_str in RoleEnum.__members__ else RoleEnum.DOCTOR

    if not user:
        user = User(
            email=user_data.get("email"),
            name=user_data.get("name"),
            hashed_password="", # Managed by WizeFlow
            role=role_enum,
            hospital_id=hospital.id,
            qualification=user_data.get("qualification"),
            position=user_data.get("position"),
            specialty=user_data.get("specialty")
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user
    else:
        # Update user details
        user.name = user_data.get("name")
        user.role = role_enum
        user.hospital_id = hospital.id # Ensure mapped to correct tenant
        user.qualification = user_data.get("qualification")
        user.position = user_data.get("position")
        user.specialty = user_data.get("specialty")
    
    await db.commit()
    await db.refresh(user)
    
    # 3. Deep Linking: Sync Patient if provided
    context_patient_id = None
    if patient_data:
        p_ext_id = patient_data.get("id")
        p_result = await db.execute(select(Patient).where(
            (Patient.external_id == p_ext_id) & (Patient.hospital_id == hospital.id)
        ))
        patient = p_result.scalar_one_or_none()
        
        if not patient:
            patient = Patient(
                external_id=p_ext_id,
                hospital_id=hospital.id,
                full_name=patient_data.get("name"),
                email=patient_data.get("email"),
                phone=patient_data.get("phone"),
                dob=patient_data.get("dob"),
                registration_number=patient_data.get("reg_no"),
                age=patient_data.get("age"),
                gender=patient_data.get("gender"),
                address=patient_data.get("address")
            )
            db.add(patient)
            await db.commit()
            await db.refresh(patient)
        
        context_patient_id = str(patient.id)

    # 4. Create Session Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "hospital_id": str(hospital.id),
        "patient_id": context_patient_id # Include deep link context
    }
    
    access_token = create_access_token(
        data=token_payload,
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/sso/wizeflow", response_model=Token)
async def wizeflow_sso_login(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Alternative SSO endpoint that accepts token in Authorization header.
    WizeFlow can call this with: Authorization: Bearer <token>
    """
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    return await validate_sso_token(
        SSOTokenValidate(token=token, source="wizeflow"),
        db
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user from JWT token.
    Used by frontend to get user details.
    """
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


# ============ DEV / TESTING ONLY ============
@router.post("/sso/generate-test-token")
async def generate_test_token(
    mock_data: Optional[dict] = None
):
    """
    Generate a valid signed SSO token for testing.
    Mocks the behavior of WizeFlow generating a token.
    """
    if not mock_data:
        # Default Mock Data (Dr. Sarah)
        mock_data = {
            "user": {
                "email": "sarah@demo.com",
                "name": "Dr. Sarah Jenkins",
                "role": "DOCTOR",
                "user_id": "ext_u_1",
                "qualification": "MBBS, MD",
                "position": "Senior Physician",
                "specialty": "General Medicine"
            },
            "hospital": {
                "name": "Demo Hospital",
                "id": "h_demo",
                "status": "ACTIVE",
                "subscription_tier": "ENTERPRISE"
            },
            # Optional Patient Context
            "patient": {
                "id": "p1", # Matches seed data external_id
                "name": "Patient 1",
                "email": "patient1@example.com",
                "phone": "555-0000",
                "reg_no": "P24-00001",
                "age": 25,
                "gender": "M",
                "address": "123 Test St"
            }
        }
        
    # Sign it with our secret key (in reality WizeFlow uses its own, but we share secrets or use public keys)
    token = jwt.encode(mock_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"token": token}
