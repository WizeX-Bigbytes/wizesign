from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated

from app.database import get_db
from app.models import User, Hospital
from app.schemas import HospitalResponse, HospitalSettingsUpdate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])

@router.get("/me", response_model=HospitalResponse)
async def get_my_hospital(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
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
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
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
