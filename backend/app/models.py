from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, JSON, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from .database import Base


class RoleEnum(str, enum.Enum):
    SUPERADMIN = "SUPERADMIN"
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    RECEPTIONIST = "RECEPTIONIST"
    STAFF = "STAFF"


class DocumentStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    VIEWED = "VIEWED"
    SIGNED = "SIGNED"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE, SUSPENDED
    subscription_tier = Column(String, default="STANDARD") # STANDARD, ENTERPRISE
    
    # WizeChat Integration Config
    wizechat_config = Column(JSON, nullable=True) # { api_key, inbox_id, template_id, template_name }
    
    joined_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")
    documents = relationship("Document", back_populates="hospital")
    templates = relationship("Template", back_populates="hospital")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for SSO-only users
    role = Column(Enum(RoleEnum), default=RoleEnum.DOCTOR)
    
    # Metadata from WizeFlow
    qualification = Column(String, nullable=True)
    position = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    max_token_count = Column(Integer, default=20)
    
    # Context
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True) # Nullable only for SuperAdmin
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="users")
    documents = relationship("Document", back_populates="created_by")
    templates = relationship("Template", back_populates="created_by")


class Template(Base):
    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    file_url = Column(Text, nullable=False)
    file_path = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    version = Column(String, default="1.0")
    fields = Column(JSON, nullable=True)
    
    # Ownership
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="templates")
    created_by = relationship("User", back_populates="templates")
    documents = relationship("Document", back_populates="template")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String, nullable=True, index=True) # ID from WizeFlow
    registration_number = Column(String, nullable=True) # e.g. P24-00001
    
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True, index=True)
    dob = Column(String, nullable=True)
    
    age = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    # Ownership
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="patients")
    documents = relationship("Document", back_populates="patient")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), unique=True, default=uuid.uuid4, index=True)
    procedure_name = Column(String, nullable=False)
    file_url = Column(Text, nullable=False)  # Original URL (blob or external)
    file_path = Column(Text, nullable=True)  # Local file path on server
    doctor_name = Column(String, nullable=True)
    clinic_name = Column(String, nullable=True)
    status = Column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.DRAFT, index=True)

    # Ownership
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False, index=True)

    # Patient Info
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)

    # Template Info
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=True)

    # Secure Link
    secure_token = Column(UUID(as_uuid=True), unique=True, default=uuid.uuid4, index=True)
    link_expiry = Column(DateTime, nullable=True)
    link_accessed = Column(Boolean, default=False)
    link_accessed_at = Column(DateTime, nullable=True)

    # Signature Data
    signature = Column(Text, nullable=True)
    signed_date = Column(DateTime, nullable=True)
    ip_address = Column(String, nullable=True)
    
    # Digital Certificate
    certificate_hash = Column(String, nullable=True, index=True)
    certificate_issued_at = Column(DateTime, nullable=True)
    
    # OTP Verification
    otp_code = Column(String, nullable=True)  # Store hashed OTP
    otp_sent_at = Column(DateTime, nullable=True)
    otp_verified_at = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0)

    # Fields (JSON)
    fields = Column(JSON, nullable=True)

    # Audit Trail
    audit_trail = Column(JSON, default=list)

    # Created By
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="documents")
    patient = relationship("Patient", back_populates="documents")
    template = relationship("Template", back_populates="documents")
    created_by = relationship("User", back_populates="documents")
