from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from jose import jwt, JWTError

from app.database import get_db
from app.models import Template, User, RoleEnum
from app.schemas import TemplateCreate, TemplateResponse, TemplateUpdate
from app.config import settings

router = APIRouter(prefix="/api/templates", tags=["templates"])


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


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """Create a new template"""
    
    template = Template(
        name=template_data.name,
        file_url=template_data.file_url,
        category=template_data.category,
        hospital_id=current_user.hospital_id,
        created_by_id=current_user.id
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    return template


@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: AsyncSession = Depends(get_db)
):
    """List all templates"""
    
    query = select(Template)
    
    if category:
        query = query.where(Template.category == category)
    
    query = query.offset(skip).limit(limit).order_by(Template.created_at.desc())
    
    result = await db.execute(query)
    templates = result.scalars().all()
    
    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific template"""
    
    try:
        temp_uuid = uuid.UUID(template_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid template ID"
        )
    
    result = await db.execute(
        select(Template).where(Template.id == temp_uuid)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return template


@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    template_data: TemplateUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a template"""
    
    try:
        temp_uuid = uuid.UUID(template_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid template ID"
        )
    
    result = await db.execute(
        select(Template).where(Template.id == temp_uuid)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Update fields
    if template_data.name is not None:
        template.name = template_data.name
    if template_data.category is not None:
        template.category = template_data.category
    
    await db.commit()
    await db.refresh(template)
    
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a template"""
    
    try:
        temp_uuid = uuid.UUID(template_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid template ID"
        )
    
    result = await db.execute(
        select(Template).where(Template.id == temp_uuid)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    await db.delete(template)
    await db.commit()
    
    return None
