from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.models import Template
from app.schemas import TemplateCreate, TemplateResponse, TemplateUpdate

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new template"""
    
    template = Template(
        name=template_data.name,
        file_url=template_data.file_url,
        category=template_data.category,
        # TODO: Get from authenticated user
        created_by_id=uuid.uuid4()
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
