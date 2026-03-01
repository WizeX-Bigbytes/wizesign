from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from jose import jwt, JWTError
import hashlib
import secrets
import random
import shutil
from pathlib import Path

from app.database import get_db
from app.models import Document, Patient, DocumentStatusEnum, User, RoleEnum
from app.schemas import (
    DocumentCreate, DocumentResponse, DocumentDetailResponse,
    SignatureSubmit, DocumentUpdate
)
from app.config import settings
from app.services.wizechat import wizechat_service
from app.services.pdf_generator import pdf_generator_service
from app.schemas_wizechat import SendDocumentLinkRequest, WhatsAppResponse
from fastapi.responses import FileResponse
from app.routers.auth import get_current_user_from_token

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Create uploads directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# 
# Auth dependency is imported from app.routers.auth
# 


@router.post("/upload-file")
async def upload_document_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a PDF or image file for a document template.
    Returns the stored file path.
    """
    if file.size and file.size > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 25MB.")
        
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: PDF, JPEG, PNG"
        )
    
    # Generate unique filename
    file_id = uuid.uuid4()
    file_extension = Path(file.filename).suffix if file.filename else ".pdf"
    filename = f"{file_id}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"✅ File uploaded: {file_path}")
        
        # Return the relative path that can be used later
        return {
            "file_path": str(file_path),
            "file_id": str(file_id),
            "filename": file.filename,
            "content_type": file.content_type
        }
    except Exception as e:
        print(f"❌ Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )


@router.post("/create", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document_for_patient(
    document_data: DocumentCreate,
    current_user: User = Depends(get_current_user_from_token),
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
    
    # Step 1: Create or get patient (within same hospital)
    # Prefer external_id, then email, then phone. Use latest match if duplicates exist.
    patient = None
    if document_data.patient.external_id:
        result = await db.execute(
            select(Patient)
            .where(
                (Patient.external_id == document_data.patient.external_id) &
                (Patient.hospital_id == current_user.hospital_id)
            )
            .order_by(Patient.created_at.desc())
            .limit(1)
        )
        patient = result.scalars().first()

    if not patient and document_data.patient.email:
        result = await db.execute(
            select(Patient)
            .where(
                (Patient.email == document_data.patient.email) &
                (Patient.hospital_id == current_user.hospital_id)
            )
            .order_by(Patient.created_at.desc())
            .limit(1)
        )
        patient = result.scalars().first()
    
    if not patient and document_data.patient.phone:
        result = await db.execute(
            select(Patient)
            .where(
                (Patient.phone == document_data.patient.phone) &
                (Patient.hospital_id == current_user.hospital_id)
            )
            .order_by(Patient.created_at.desc())
            .limit(1)
        )
        patient = result.scalars().first()
    
    # Create new patient if not exists
    if not patient:
        patient = Patient(
            full_name=document_data.patient.full_name,
            email=document_data.patient.email,
            phone=document_data.patient.phone,
            dob=document_data.patient.dob,
            hospital_id=current_user.hospital_id
        )
        db.add(patient)
        await db.flush()  # Get the patient ID
    
    # Step 2: Create document
    secure_token = uuid.uuid4()
    transaction_id = uuid.uuid4()
    
    # Set link expiry (e.g., 7 days from now)
    link_expiry = datetime.utcnow() + timedelta(days=7)
    
    # If file_content is provided (base64), save it locally
    file_path = document_data.file_path
    print(f"\n" + "="*80)
    print(f"🔍 FILE UPLOAD DEBUG - DOCUMENT CREATION")
    print(f"="*80)
    print(f"  - file_path from request: {file_path}")
    print(f"  - file_url from request: {document_data.file_url[:100] if document_data.file_url else None}...")
    print(f"  - has file_content: {bool(document_data.file_content)}")
    if document_data.file_content:
        print(f"  - file_content length: {len(document_data.file_content)}")
        print(f"  - file_content starts with: {document_data.file_content[:50]}")
    
    # Check if file_url contains data URL (base64 encoded content)
    if document_data.file_url and document_data.file_url.startswith('data:'):
        print(f"  - 📄 file_url contains data URL, extracting...")
        try:
            import base64
            from PIL import Image
            import io
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            # Extract base64 content from data URL
            if ',' in document_data.file_url:
                mime_type, base64_data = document_data.file_url.split(',', 1)
                print(f"  - Mime type: {mime_type}")
            else:
                base64_data = document_data.file_url
                mime_type = ''
            
            # Decode base64
            file_bytes = base64.b64decode(base64_data)
            print(f"  - Decoded {len(file_bytes)} bytes from data URL")
            
            # Check if it's an image (JPEG/PNG) - convert to PDF
            if 'image/' in mime_type or not 'pdf' in mime_type.lower():
                print(f"  - 🖼️ Converting image to PDF for signature overlay support...")
                
                # Open image and convert to PDF
                image = Image.open(io.BytesIO(file_bytes))
                img_width, img_height = image.size
                print(f"  - Image size: {img_width}x{img_height}")
                
                # Create PDF from image
                pdf_buffer = io.BytesIO()
                # Scale to letter size while maintaining aspect ratio
                pdf_width, pdf_height = letter
                scale = min(pdf_width / img_width, pdf_height / img_height)
                scaled_width = img_width * scale
                scaled_height = img_height * scale
                
                # Center image on page
                x_offset = (pdf_width - scaled_width) / 2
                y_offset = (pdf_height - scaled_height) / 2
                
                c = canvas.Canvas(pdf_buffer, pagesize=letter)
                
                # Save image to temp buffer for reportlab
                img_buffer = io.BytesIO()
                image.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                from reportlab.lib.utils import ImageReader
                img_reader = ImageReader(img_buffer)
                c.drawImage(img_reader, x_offset, y_offset, scaled_width, scaled_height)
                c.save()
                
                file_bytes = pdf_buffer.getvalue()
                print(f"  - ✅ Converted image to PDF: {len(file_bytes)} bytes")
            
            # Save to uploads directory
            file_id = uuid.uuid4()
            filename = f"{file_id}.pdf"
            file_path = UPLOAD_DIR / filename
            
            with open(file_path, 'wb') as f:
                f.write(file_bytes)
            
            file_path = str(file_path)
            print(f"  - ✅ Saved file from data URL to: {file_path}")
            
        except Exception as e:
            print(f"  - ❌ Error processing data URL: {e}")
            import traceback
            traceback.print_exc()
            file_path = None
    
    elif document_data.file_content and not file_path:
        try:
            import base64
            print(f"  - Processing base64 file_content...")
            # Decode base64 content
            if ',' in document_data.file_content:
                # Remove data:application/pdf;base64, prefix
                file_content = document_data.file_content.split(',', 1)[1]
                print(f"  - Removed data URI prefix")
            else:
                file_content = document_data.file_content
            
            file_bytes = base64.b64decode(file_content)
            print(f"  - Decoded {len(file_bytes)} bytes")
            
            # Save to uploads directory
            file_id = uuid.uuid4()
            filename = f"{file_id}.pdf"
            file_path = UPLOAD_DIR / filename
            
            with open(file_path, 'wb') as f:
                f.write(file_bytes)
            
            file_path = str(file_path)
            print(f"✅ Saved uploaded file content to: {file_path}")
        except Exception as e:
            print(f"❌ Error saving file content: {e}")
            import traceback
            traceback.print_exc()
            file_path = None
    else:
        if not document_data.file_content:
            print(f"⚠️ No file_content provided in request")
        if file_path:
            print(f"  - file_path already set, skipping file_content processing")
    
    print(f"\n📝 CREATING DOCUMENT RECORD:")
    print(f"  - Will use file_path: {file_path}")
    print(f"  - Fields count: {len(document_data.fields) if document_data.fields else 0}")
    
    document = Document(
        transaction_id=transaction_id,
        procedure_name=document_data.procedure_name,
        file_url="", # Will update this after getting the ID
        file_path=file_path,  # Store local file path
        doctor_name=document_data.doctor_name,
        clinic_name=document_data.clinic_name,
        patient_id=patient.id,
        template_id=document_data.template_id,
        secure_token=secure_token,
        link_expiry=link_expiry,
        fields=[field.dict() for field in document_data.fields] if document_data.fields else [],
        status=DocumentStatusEnum.SENT,
        hospital_id=current_user.hospital_id,
        created_by_id=current_user.id,
        audit_trail=[{
            "timestamp": datetime.utcnow().isoformat(),
            "action": "DOCUMENT_CREATED",
            "actor": current_user.name,
            "details": f"Document created for {patient.full_name}"
        }]
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    # Update the file_url to point to the backend route instead of the transient blob
    if file_path:
        document.file_url = f"/api/documents/{document.id}/pdf"
        await db.commit()
        await db.refresh(document)
    elif document_data.file_url and not document_data.file_url.startswith('blob:'):
        document.file_url = document_data.file_url
        await db.commit()
        await db.refresh(document)
    
    print(f"\n✅ DOCUMENT CREATED SUCCESSFULLY:")
    print(f"  - Document ID: {document.id}")
    print(f"  - Stored file_path: {document.file_path}")
    print(f"  - Fields: {len(document.fields)} fields")
    print(f"="*80 + "\n")
    
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
    
    # Find document by secure_token and eagerly load patient relationship
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.patient))
        .where(Document.secure_token == token_uuid)
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
            document.audit_trail = [*document.audit_trail, audit_event]
        else:
            document.audit_trail = [audit_event]
        
        await db.commit()
        await db.refresh(document)
    
    # Load patient relationship using selectinload or joinedload in query instead
    # The patient relationship should be eagerly loaded in the initial query
    # For now, access it directly (SQLAlchemy will lazy load if needed)
    
    return document


@router.patch("/{document_id}/fields")
async def update_document_fields(
    document_id: str,
    fields_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Update document fields. If the document is already signed, this automatically
    invalidates the signature (IT Act 2000 compliance - Invalidation Protocol).
    """
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    result = await db.execute(select(Document).where(Document.id == doc_uuid))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if document was signed — if so, invalidate the signature
    was_signed = document.status in (DocumentStatusEnum.SIGNED, DocumentStatusEnum.COMPLETED)
    
    # Apply field updates
    if fields_data.fields is not None:
        document.fields = [f.dict() for f in fields_data.fields]
    if fields_data.procedure_name is not None:
        document.procedure_name = fields_data.procedure_name
    if fields_data.doctor_name is not None:
        document.doctor_name = fields_data.doctor_name
    if fields_data.clinic_name is not None:
        document.clinic_name = fields_data.clinic_name
    
    # Invalidation protocol: strip signature if document was signed
    if was_signed:
        from datetime import timezone, timedelta
        IST = timezone(timedelta(hours=5, minutes=30))
        ist_now = datetime.now(IST).strftime('%d-%m-%Y %H:%M:%S IST')
        
        document.signature = None
        document.signed_date = None
        document.certificate_hash = None
        document.certificate_issued_at = None
        document.status = DocumentStatusEnum.SENT
        
        invalidation_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": "SIGNATURE_INVALIDATED",
            "actor": current_user.name if current_user else "SYSTEM",
            "details": f"Document fields modified after signing. Signature stripped and document requires re-signing. IST: {ist_now}"
        }
        if document.audit_trail:
            document.audit_trail = [*document.audit_trail, invalidation_event]
        else:
            document.audit_trail = [invalidation_event]
    
    document.updated_at = datetime.utcnow()
    await db.commit()
    
    return {
        "id": str(document.id),
        "status": document.status.value,
        "signature_invalidated": was_signed,
        "message": "Signature invalidated — document requires re-signing." if was_signed else "Fields updated successfully."
    }


@router.post("/{document_id}/sign", response_model=DocumentDetailResponse)
async def submit_signature(
    document_id: str,
    token: str,
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
    
    try:
        token_uuid = uuid.UUID(token)
        if document.secure_token != token_uuid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid secure token"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid secure token format"
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
    
    # Generate digital certificate hash with comprehensive data for non-repudiation
    cert_timestamp = document.signed_date.isoformat()
    cert_data = f"{document.id}:{document.patient_id}:{cert_timestamp}:{signature_data.signature[:100]}:{signature_data.ip_address or request.client.host}"
    document.certificate_hash = hashlib.sha256(cert_data.encode()).hexdigest()
    document.certificate_issued_at = document.signed_date
    
    # Add certificate generation to audit trail
    cert_audit = {
        "timestamp": cert_timestamp,
        "action": "CERTIFICATE_GENERATED",
        "actor": "SYSTEM",
        "details": f"SHA-256 certificate issued: {document.certificate_hash[:16]}..."
    }
    if document.audit_trail:
        document.audit_trail = [*document.audit_trail, cert_audit]
    else:
        document.audit_trail = [cert_audit]
    
    # Add audit events
    if signature_data.audit_events:
        if document.audit_trail:
            document.audit_trail = [*document.audit_trail, *signature_data.audit_events]
        else:
            document.audit_trail = signature_data.audit_events
    
    # Load patient relationship before PDF generation to avoid lazy loading issues
    await db.refresh(document, ["patient", "hospital"])
    
    # Generate signed PDF (synchronous operation)
    try:
        signed_pdf_path = pdf_generator_service.generate_signed_pdf(
            document_id=str(document.id),
            signature_base64=document.signature,
            patient_name=document.patient.full_name if document.patient else "Unknown",
            procedure_name=document.procedure_name,
            signed_date=document.signed_date,
            certificate_hash=document.certificate_hash,
            original_pdf_path=document.file_path,  # Use stored file path
            signature_fields=document.fields,  # Pass signature field positions
            ip_address=document.ip_address,
            phone_number=document.patient.phone if document.patient else None
        )
        
        # Update document with signed PDF path
        document.file_url = f"/api/documents/{document.id}/download"
        
        pdf_audit = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": "SIGNED_PDF_GENERATED",
            "actor": "SYSTEM",
            "details": f"Signed PDF generated: {signed_pdf_path}"
        }
        if document.audit_trail:
            document.audit_trail = [*document.audit_trail, pdf_audit]
        else:
            document.audit_trail = [pdf_audit]
    except Exception as e:
        print(f"❌ Error generating signed PDF: {e}")
    
    await db.commit()
    await db.refresh(document, ["patient"])
    
    # Auto-send signed copy + certificate to patient via wizechat
    if document.status == DocumentStatusEnum.SIGNED and document.patient and document.patient.phone:
        try:
            # Get hospital wizechat config
            if document.hospital and document.hospital.wizechat_config:
                config = document.hospital.wizechat_config
                inbox_id = config.get("inbox_id")
                api_key = config.get("api_key")
                
                if inbox_id:
                    # Generate document link
                    frontend_url = settings.FRONTEND_URL
                    document_link = f"{frontend_url}/document/{document.secure_token}"
                    
                    # Format signed date (ISO format for API)
                    signed_at_iso = document.signed_date.isoformat() if document.signed_date else datetime.utcnow().isoformat()
                    
                    # Send completion notification via wizechat e-signature API
                    await wizechat_service.send_completion(
                        inbox_id=inbox_id,
                        to_phone=document.patient.phone,
                        document_name=document.procedure_name or "Medical Consent Form",
                        signed_document_url=document_link,
                        signer_name=document.patient.full_name,
                        signed_at=signed_at_iso,
                        send_document=False,  # Link only, not PDF attachment
                        api_key=api_key
                    )
                    
                    # Add audit event for signed copy delivery
                    wizechat_audit = {
                        "timestamp": datetime.utcnow().isoformat(),
                        "action": "SIGNED_COPY_SENT",
                        "actor": "SYSTEM",
                        "details": f"Signed document notification sent to {document.patient.phone} via WizeChat (Certificate: {document.certificate_hash[:16]}...)"
                    }
                    if document.audit_trail:
                        document.audit_trail = [*document.audit_trail, wizechat_audit]
                    else:
                        document.audit_trail = [wizechat_audit]
                    
                    await db.commit()
        except Exception as e:
            # Log error but don't fail the signature submission
            print(f"Error sending signed copy via wizechat: {e}")
    
    return document


@router.get("/{document_id}/download")
async def download_signed_document(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Download the signed PDF document.
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
    
    if document.status != DocumentStatusEnum.SIGNED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has not been signed yet"
        )
    
    # Get signed PDF path
    pdf_path = pdf_generator_service.get_download_path(str(document.id))
    
    if not pdf_path or not pdf_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signed PDF not found"
        )
    
    # Return file for download
    await db.refresh(document, ["patient"])
    filename = f"{document.procedure_name.replace(' ', '_')}_signed_{document.patient.full_name.replace(' ', '_')}.pdf"
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=filename
    )


@router.get("/{document_id}/pdf")
async def download_original_document(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Download the original unsigned document PDF.
    This is used for frontend rendering of the PDF via pdf.js
    """
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID format"
        )
        
    result = await db.execute(
        select(Document).where(Document.id == doc_uuid)
    )
    document = result.scalar_one_or_none()
    
    if not document or not document.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original document PDF not found"
        )
        
    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File no longer exists on server"
        )
        
    filename = f"{document.procedure_name.replace(' ', '_')}_original.pdf"
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=filename
    )


@router.post("/{document_id}/send-otp")
async def send_otp(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Send OTP verification code to patient via WizeChat WhatsApp.
    """
    
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )
    
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.patient), selectinload(Document.hospital))
        .where(Document.id == doc_uuid)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if not document.patient or not document.patient.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient phone number not available"
        )
    
    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    
    print(f"📝 OTP Generation: document_id={document_id}, patient_phone={document.patient.phone}")
    print(f"📝 APP_ENV={settings.APP_ENV}")
    
    # Hash OTP for storage (using SHA-256)
    otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()
    
    # Store OTP in database
    document.otp_code = otp_hash
    document.otp_sent_at = datetime.utcnow()
    document.otp_attempts = 0
    document.otp_verified_at = None
    
    await db.commit()
    
    # Send OTP via wizechat
    try:
        print(f"🔍 Checking hospital wizechat_config...")
        print(f"🔍 Hospital exists: {document.hospital is not None}")
        print(f"🔍 Hospital wizechat_config: {document.hospital.wizechat_config if document.hospital else 'N/A'}")
        
        if document.hospital and document.hospital.wizechat_config:
            config = document.hospital.wizechat_config
            inbox_id = config.get("inbox_id")
            api_key = config.get("api_key")
            
            print(f"🔍 Config found - inbox_id: {inbox_id}, api_key: {api_key[:10] if api_key else None}...")
            print(f"🔍 Settings.APP_ENV = '{settings.APP_ENV}'")
            print(f"🔍 Dev mode check: {settings.APP_ENV == 'development'}")
            
            if inbox_id:
                if settings.APP_ENV == "development":
                    print(f"\n🔐 DEV MODE - OTP for {document.patient.phone}: {otp_code}")
                    print(f"   Document: {document.procedure_name}")
                    print(f"   Patient: {document.patient.full_name}")
                
                # In production, send via WizeChat
                await wizechat_service.send_otp(
                    inbox_id=inbox_id,
                    to_phone=document.patient.phone,
                    otp_code=otp_code,
                    document_name=document.procedure_name or "Medical Consent Form",
                    expires_in_minutes=10,
                    api_key=api_key
                )
                
                response = {"success": True, "message": "OTP sent successfully"}
                
                return response
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="WizeChat inbox_id not configured"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="WizeChat not configured for this hospital"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ OTP Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )


@router.post("/{document_id}/verify-otp")
async def verify_otp(
    document_id: str,
    otp_code: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP code entered by patient.
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
    
    if not document.otp_code or not document.otp_sent_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP has been sent for this document"
        )
    
    # Check if OTP expired (10 minutes)
    otp_age = datetime.utcnow() - document.otp_sent_at
    if otp_age.total_seconds() > 600:  # 10 minutes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new code."
        )
    
    # Check attempts limit
    if document.otp_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new OTP."
        )
    
    # Verify OTP
    otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()
    
    if otp_hash != document.otp_code:
        document.otp_attempts += 1
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Mark OTP as verified
    document.otp_verified_at = datetime.utcnow()
    await db.commit()
    
    return {"success": True, "message": "OTP verified successfully"}


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
    
    document.patient_link = f"{settings.FRONTEND_URL}/patient/view?token={document.secure_token}"
    return document


@router.get("/", response_model=List[DocumentDetailResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    status_filter: str = None,
    patient_id: str = None,
    search: str = None,
    current_user: User = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db)
):
    """
    List all documents for the doctor's hospital (for doctor dashboard).
    Includes optional filters for status, patient_id, and general keyword search.
    """
    
    query = select(Document).options(selectinload(Document.patient)).where(
        Document.hospital_id == current_user.hospital_id
    )
    
    # 1. Status Filter
    if status_filter:
        try:
            status_enum = DocumentStatusEnum[status_filter.upper()]
            query = query.where(Document.status == status_enum)
        except KeyError:
            pass  # Invalid status filter, ignore
            
    # 2. Patient ID Filter (Support both internal UUID and WizeFlow external_id)
    if patient_id:
        # Join Patient to allow filtering by its columns
        # Check if it was already joined to avoid duplicate joins
        if not search: 
            query = query.join(Document.patient)
            
        uuid_condition = None
        try:
            patient_uuid = uuid.UUID(patient_id)
            uuid_condition = (Patient.id == patient_uuid)
        except ValueError:
            pass  # It's an external_id string like 'p_test', not a UUID
            
        if uuid_condition is not None:
            # Match either UUID or external_id
            query = query.where(uuid_condition | (Patient.external_id == patient_id))
        else:
            # Only match external_id
            query = query.where(Patient.external_id == patient_id)
            
    # 3. Text Search (Procedure Name, Doctor Name, or Patient Name)
    if search:
        search_term = f"%{search}%"
        # Join Patient to search their fields as well
        query = query.join(Document.patient).where(
            (Document.procedure_name.ilike(search_term)) |
            (Document.doctor_name.ilike(search_term)) |
            (Patient.full_name.ilike(search_term)) |
            (Patient.email.ilike(search_term))
        ).distinct()
    
    query = query.offset(skip).limit(limit).order_by(Document.created_at.desc())
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    for doc in documents:
        doc.patient_link = f"{settings.FRONTEND_URL}/patient/view?token={doc.secure_token}"
    
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
    
    # Validate WizeChat configuration
    if not document.hospital:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hospital configuration is missing. Please contact support."
        )
    
    # Generate the secure link
    patient_link = f"{settings.FRONTEND_URL}/patient/view?token={document.secure_token}"
    
    # Determine config
    inbox_id = send_request.inbox_id
    api_key = None
    
    if document.hospital.wizechat_config:
        config = document.hospital.wizechat_config
        # Use config inbox_id if not provided in request
        if not inbox_id:
            inbox_id = config.get("inbox_id")
        api_key = config.get("api_key")
    
    # Validate required fields
    if not inbox_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WizeChat Inbox ID is not configured. Please configure WizeChat settings first."
        )
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WizeChat API Key is not configured. Please configure WizeChat settings first."
        )
    
    if not send_request.phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient phone number is required"
        )

    try:
        # Calculate link expiry hours
        expiry_hours = 168  # Default 7 days
        if document.link_expiry:
            time_until_expiry = document.link_expiry - datetime.utcnow()
            expiry_hours = int(time_until_expiry.total_seconds() / 3600)
        
        # Call WizeChat e-signature API to send signature request
        wizechat_response = await wizechat_service.send_signature_request(
            inbox_id=inbox_id,
            to_phone=send_request.phone_number,
            document_name=document.procedure_name or "Medical Consent Form",
            signature_link=patient_link,
            recipient_name=document.patient.full_name,
            expires_in_hours=expiry_hours,
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
            message_id=wizechat_response.get("whatsapp_message_id") or wizechat_response.get("message_id") or ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        print(f"❌ Error sending WhatsApp: {error_message}")
        
        # Parse specific error types
        if "api key" in error_message.lower() or "authentication" in error_message.lower():
            error_detail = "Invalid WizeChat API Key. Please check your settings."
        elif "inbox" in error_message.lower():
            error_detail = "Invalid WizeChat Inbox ID. Please check your settings."
        elif "phone" in error_message.lower():
            error_detail = "Invalid phone number format. Please use international format (e.g., +1234567890)."
        elif "timeout" in error_message.lower():
            error_detail = "Connection timeout. Please check your WizeChat service."
        else:
            error_detail = f"Failed to send WhatsApp message: {error_message}"
        
        return WhatsAppResponse(
            success=False,
            message=error_detail,
            error=error_message
        )

