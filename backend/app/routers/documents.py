from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Document, Patient, DocumentStatusEnum
from app.schemas import (
    DocumentCreate, DocumentResponse, DocumentDetailResponse,
    SignatureSubmit, DocumentUpdate
)
from app.config import settings
from app.services.wizechat import wizechat_service
from app.schemas_wizechat import SendDocumentLinkRequest, WhatsAppResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/create", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document_for_patient(
    document_data: DocumentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for WizeFlow to create a new document for patient signing.
    This will:
    1. Create or find the patient
    2. Create the document
    3. Generate a secure link
    4. Return the link for WizeChat to send via WhatsApp
    """
    
    # Step 1: Create or get patient
    # Check if patient exists by email or phone
    patient = None
    if document_data.patient.email:
        result = await db.execute(
            select(Patient).where(Patient.email == document_data.patient.email)
        )
        patient = result.scalar_one_or_none()
    
    if not patient and document_data.patient.phone:
        result = await db.execute(
            select(Patient).where(Patient.phone == document_data.patient.phone)
        )
        patient = result.scalar_one_or_none()
    
    # Create new patient if not exists
    if not patient:
        patient = Patient(
            full_name=document_data.patient.full_name,
            email=document_data.patient.email,
            phone=document_data.patient.phone,
            dob=document_data.patient.dob
        )
        db.add(patient)
        await db.flush()  # Get the patient ID
    
    # Step 2: Create document
    secure_token = uuid.uuid4()
    transaction_id = uuid.uuid4()
    
    # Set link expiry (e.g., 7 days from now)
    link_expiry = datetime.utcnow() + timedelta(days=7)
    
    document = Document(
        transaction_id=transaction_id,
        procedure_name=document_data.procedure_name,
        file_url=document_data.file_url,
        doctor_name=document_data.doctor_name,
        clinic_name=document_data.clinic_name,
        patient_id=patient.id,
        template_id=document_data.template_id,
        secure_token=secure_token,
        link_expiry=link_expiry,
        fields=[field.dict() for field in document_data.fields] if document_data.fields else [],
        status=DocumentStatusEnum.SENT,
        # For demo, we'll use a dummy user ID - in production, get from SSO token
        created_by_id=uuid.uuid4(),  # TODO: Get from authenticated user
        audit_trail=[{
            "timestamp": datetime.utcnow().isoformat(),
            "action": "DOCUMENT_CREATED",
            "actor": document_data.doctor_name or "System",
            "details": f"Document created for {patient.full_name}"
        }]
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    # Step 3: Generate the patient link
    patient_link = f"{settings.FRONTEND_URL}/patient/view?token={secure_token}"
    
    return DocumentResponse(
        id=document.id,
        transaction_id=document.transaction_id,
        procedure_name=document.procedure_name,
        file_url=document.file_url,
        doctor_name=document.doctor_name,
        clinic_name=document.clinic_name,
        status=document.status,
        secure_token=document.secure_token,
        patient_link=patient_link,
        link_expiry=document.link_expiry,
        created_at=document.created_at
    )


@router.get("/by-token/{token}", response_model=DocumentDetailResponse)
async def get_document_by_token(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get document details by secure token (for patient view).
    This endpoint is called when patient clicks the link.
    """
    
    # Parse token as UUID
    try:
        token_uuid = uuid.UUID(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token format"
        )
    
    # Find document by secure_token
    result = await db.execute(
        select(Document).where(Document.secure_token == token_uuid)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if link has expired
    if document.link_expiry and document.link_expiry < datetime.utcnow():
        document.status = DocumentStatusEnum.EXPIRED
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This link has expired"
        )
    
    # Mark as accessed if first time
    if not document.link_accessed:
        document.link_accessed = True
        document.link_accessed_at = datetime.utcnow()
        document.status = DocumentStatusEnum.VIEWED
        
        # Add audit event
        audit_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": "LINK_ACCESSED",
            "actor": document.patient.full_name,
            "details": f"IP: {request.client.host}"
        }
        
        if document.audit_trail:
            document.audit_trail.append(audit_event)
        else:
            document.audit_trail = [audit_event]
        
        await db.commit()
        await db.refresh(document)
    
    # Load patient relationship
    await db.refresh(document, ["patient"])
    
    return document


@router.post("/{document_id}/sign", response_model=DocumentDetailResponse)
async def submit_signature(
    document_id: str,
    signature_data: SignatureSubmit,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit patient signature for a document.
    """
    
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )
    
    result = await db.execute(
        select(Document).where(Document.id == doc_uuid)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.status == DocumentStatusEnum.EXPIRED:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This document link has expired"
        )
    
    if document.status == DocumentStatusEnum.SIGNED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document already signed"
        )
    
    # Update document with signature
    document.signature = signature_data.signature
    document.signed_date = datetime.utcnow()
    document.status = DocumentStatusEnum.SIGNED
    document.ip_address = signature_data.ip_address or request.client.host
    
    # Add audit events
    if signature_data.audit_events:
        if document.audit_trail:
            document.audit_trail.extend(signature_data.audit_events)
        else:
            document.audit_trail = signature_data.audit_events
    
    await db.commit()
    await db.refresh(document, ["patient"])
    
    return document


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document_by_id(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get document by ID (for doctor/admin view).
    """
    
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )
    
    result = await db.execute(
        select(Document).where(Document.id == doc_uuid)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    await db.refresh(document, ["patient"])
    return document


@router.get("/", response_model=List[DocumentDetailResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    status_filter: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all documents (for admin/doctor dashboard).
    """
    
    query = select(Document)
    
    if status_filter:
        query = query.where(Document.status == status_filter)
    
    query = query.offset(skip).limit(limit).order_by(Document.created_at.desc())
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    # Load patient relationships
    for doc in documents:
        await db.refresh(doc, ["patient"])
    
    return documents


@router.post("/{document_id}/send-whatsapp", response_model=WhatsAppResponse)
async def send_document_via_whatsapp(
    document_id: str,
    send_request: SendDocumentLinkRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send document link to patient via WhatsApp using WizeChat.
    
    Example call from WizeFlow:
    POST /api/documents/{document_id}/send-whatsapp
    {
        "document_id": "uuid-here",
        "inbox_id": "your-wizechat-inbox-id",
        "phone_number": "+1234567890",
        "send_via_whatsapp": true
    }
    
    This will call WizeChat API to send the WhatsApp message.
    """
    
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )
    
    # Get the document
    result = await db.execute(
        select(Document).where(Document.id == doc_uuid)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Load patient and hospital
    await db.refresh(document, ["patient", "hospital"])
    
    # Generate the secure link
    patient_link = f"{settings.FRONTEND_URL}/patient/view?token={document.secure_token}"
    
    # Determine config
    inbox_id = send_request.inbox_id
    api_key = None
    
    if document.hospital and document.hospital.wizechat_config:
        config = document.hospital.wizechat_config
        # Use config inbox_id if not provided in request
        if not inbox_id:
            inbox_id = config.get("inbox_id")
        api_key = config.get("api_key")
    
    if not inbox_id:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inbox ID is required (neither provided nor configured)"
        )

    try:
        # Call WizeChat API to send WhatsApp message
        wizechat_response = await wizechat_service.send_document_link(
            inbox_id=inbox_id,
            phone_number=send_request.phone_number,
            patient_name=document.patient.full_name,
            document_link=patient_link,
            procedure_name=document.procedure_name,
            doctor_name=document.doctor_name or "Your Doctor",
            api_key=api_key
        )
        
        # Add audit trail
        audit_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": "WHATSAPP_SENT",
            "actor": "System",
            "details": f"WhatsApp sent to {send_request.phone_number} via inbox {inbox_id}"
        }
        
        if document.audit_trail:
            document.audit_trail.append(audit_event)
        else:
            document.audit_trail = [audit_event]
        
        await db.commit()
        
        return WhatsAppResponse(
            success=True,
            message="WhatsApp message sent successfully",
            message_id=wizechat_response.get("message_id")
        )
        
    except Exception as e:
        return WhatsAppResponse(
            success=False,
            message="Failed to send WhatsApp message",
            error=str(e)
        )

