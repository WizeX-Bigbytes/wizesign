from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import uuid

from app.database import get_db
from app.models import User, Hospital, Document, Patient, RoleEnum
from app.schemas import SuperAdminStatsResponse, UserResponse, HospitalResponse
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
