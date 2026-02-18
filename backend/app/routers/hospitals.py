from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated, Optional
from jose import jwt, JWTError

from app.database import get_db
from app.models import User, Hospital, RoleEnum
from app.schemas import HospitalResponse, HospitalSettingsUpdate
from app.config import settings

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


async def get_current_user_from_token(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    """Extract user from JWT token - returns first available user if no token for demo"""
    
    # If no authorization header, use first doctor user for demo
    if not authorization:
        result = await db.execute(select(User).where(User.role == RoleEnum.DOCTOR).limit(1))
        demo_user = result.scalar_one_or_none()
        if demo_user:
            return demo_user
        raise HTTPException(status_code=401, detail="No users available - please run SSO login first")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        hospital_id = payload.get("hospital_id")
        
        if not user_id or not hospital_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


@router.get("/me", response_model=HospitalResponse)
async def get_my_hospital(
    current_user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's hospital settings"""
    if not current_user.hospital_id:
        raise HTTPException(status_code=404, detail="User not associated with a hospital")
        
    result = await db.execute(select(Hospital).where(Hospital.id == current_user.hospital_id))
    hospital = result.scalar_one_or_none()
    
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    return hospital

@router.patch("/me/settings", response_model=HospitalResponse)
async def update_hospital_settings(
    settings: HospitalSettingsUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Update hospital settings (WizeChat config)"""
    # Authorization check (Only Admin/Doctor? For now allow all doctors)
    if not current_user.hospital_id:
        raise HTTPException(status_code=404, detail="Transaction context missing")
        
    result = await db.execute(select(Hospital).where(Hospital.id == current_user.hospital_id))
    hospital = result.scalar_one_or_none()
    
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Update config
    # Merge existing config if needed, or overwrite
    current_config = hospital.wizechat_config or {}
    new_config = settings.wizechat_config.model_dump(exclude_unset=True)
    
    # Update
    hospital.wizechat_config = {**current_config, **new_config}
    
    await db.commit()
    await db.refresh(hospital)
    return hospital


@router.get("/me/wizechat-status")
async def get_wizechat_status(
    current_user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Check if WizeChat is properly configured for the current hospital"""
    if not current_user.hospital_id:
        return {
            "configured": False,
            "missing": ["Hospital association"],
            "message": "User not associated with a hospital"
        }
        
    result = await db.execute(select(Hospital).where(Hospital.id == current_user.hospital_id))
    hospital = result.scalar_one_or_none()
    
    if not hospital:
        return {
            "configured": False,
            "missing": ["Hospital"],
            "message": "Hospital not found"
        }
    
    config = hospital.wizechat_config or {}
    
    missing = []
    if not config.get("api_key"):
        missing.append("API Key")
    if not config.get("inbox_id"):
        missing.append("Inbox ID")
    
    is_configured = len(missing) == 0
    
    return {
        "configured": is_configured,
        "missing": missing,
        "message": "WizeChat is properly configured" if is_configured else f"Missing: {', '.join(missing)}",
        "has_api_key": bool(config.get("api_key")),
        "has_inbox_id": bool(config.get("inbox_id")),
        "has_template_id": bool(config.get("template_id"))
    }
