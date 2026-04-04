from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import uuid

from app.database import get_db
from app.models import User, Hospital, Document, Patient, RoleEnum
from app.schemas import SuperAdminStatsResponse, UserResponse, HospitalResponse, HospitalTwilioSettingsUpdate, SuperAdminProfileUpdate
from app.routers.auth import get_current_user_from_token

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])

async def get_current_superadmin(
    current_user: User = Depends(get_current_user_from_token)
):
    """Dependency that ensures the current user is a SUPERADMIN."""
    if current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have super admin privileges."
        )
    return current_user


@router.get("/dashboard-stats", response_model=SuperAdminStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superadmin)
):
    """Get platform-wide statistics for the super admin dashboard."""
    
    # Total counts
    hospitals_count = await db.scalar(select(func.count(Hospital.id)))
    users_count = await db.scalar(select(func.count(User.id)))
    patients_count = await db.scalar(select(func.count(Patient.id)))
    docs_count = await db.scalar(select(func.count(Document.id)))
    
    # Active hospitals
    active_hospitals = await db.scalar(
        select(func.count(Hospital.id)).where(Hospital.status == "ACTIVE")
    )
    
    # Documents by status
    docs_by_status_query = await db.execute(
        select(Document.status, func.count(Document.id)).group_by(Document.status)
    )
    docs_by_status = {status.value: count for status, count in docs_by_status_query.all()}
    
    return SuperAdminStatsResponse(
        total_hospitals=hospitals_count or 0,
        total_users=users_count or 0,
        total_patients=patients_count or 0,
        total_documents=docs_count or 0,
        documents_by_status=docs_by_status,
        active_hospitals=active_hospitals or 0
    )


@router.get("/hospitals", response_model=List[HospitalResponse])
async def list_hospitals(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superadmin)
):
    """List all tenant hospitals."""
    result = await db.execute(select(Hospital).offset(skip).limit(limit).order_by(Hospital.created_at.desc()))
    return result.scalars().all()


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superadmin)
):
    """List all users across the platform."""
    result = await db.execute(select(User).offset(skip).limit(limit).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/hospitals/{hospital_id}", response_model=HospitalResponse)
async def get_hospital_detail(
    hospital_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superadmin)
):
    """Get a single hospital's details including config."""
    try:
        h_uuid = uuid.UUID(hospital_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid hospital ID")

    result = await db.execute(select(Hospital).where(Hospital.id == h_uuid))
    hospital = result.scalar_one_or_none()

    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    return hospital


@router.patch("/hospitals/{hospital_id}/twilio-config", response_model=HospitalResponse)
async def update_hospital_twilio_config(
    hospital_id: str,
    payload: HospitalTwilioSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superadmin)
):
    """Update Twilio config for a hospital (SuperAdmin only)."""
    try:
        h_uuid = uuid.UUID(hospital_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid hospital ID")

    result = await db.execute(select(Hospital).where(Hospital.id == h_uuid))
    hospital = result.scalar_one_or_none()

    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Merge with existing config (preserve fields not being updated)
    current_config = hospital.twilio_config or {}
    new_config = payload.twilio_config.model_dump(exclude_unset=True)

    # Filter out empty strings (treat as "clear this field")
    cleaned = {k: v for k, v in new_config.items() if v is not None}

    hospital.twilio_config = {**current_config, **cleaned}

    await db.commit()
    await db.refresh(hospital)
    return hospital


@router.get("/profile", response_model=UserResponse)
async def get_superadmin_profile(
    admin: User = Depends(get_current_superadmin)
):
    """Get the current super admin's profile."""
    return admin


@router.patch("/profile", response_model=UserResponse)
async def update_superadmin_profile(
    payload: SuperAdminProfileUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superadmin)
):
    """Update profile logic for the current Super Admin (with current password verification)."""
    # Import locally to avoid circular dependencies if auth uses models too
    from app.routers.auth import verify_password
    import bcrypt

    # Determine if they are trying to update password
    if payload.current_password and payload.new_password:
        if not admin.hashed_password:
            raise HTTPException(
                status_code=400,
                detail="Account does not have a typical password. Cannot update."
            )

        # verify current password
        if not verify_password(payload.current_password, admin.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect current password."
            )
        
        # update password
        hashed_pw = bcrypt.hashpw(payload.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin.hashed_password = hashed_pw

    elif (payload.current_password and not payload.new_password) or (payload.new_password and not payload.current_password):
        raise HTTPException(
            status_code=400,
            detail="Must provide both current_password and new_password to change password."
        )

    # Update basic info
    if payload.name:
        admin.name = payload.name
    
    if payload.email:
        # Check if email is already taken by another user
        if payload.email != admin.email:
            result = await db.execute(select(User).where(User.email == payload.email, User.id != admin.id))
            if result.scalar_one_or_none():
                 raise HTTPException(status_code=400, detail="Email is already in use by another account.")
            admin.email = payload.email

    await db.commit()
    await db.refresh(admin)
    return admin

