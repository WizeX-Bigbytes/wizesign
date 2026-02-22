from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum
from uuid import UUID


class RoleEnum(str, Enum):
    SUPERADMIN = "SUPERADMIN"
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    RECEPTIONIST = "RECEPTIONIST"
    STAFF = "STAFF"


class DocumentStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    VIEWED = "VIEWED"
    SIGNED = "SIGNED"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"


# ============ Patient Schemas ============
class PatientBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    external_id: Optional[str] = None
    registration_number: Optional[str] = None
    age: Optional[float] = None
    gender: Optional[str] = None
    address: Optional[str] = None

    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none_email(cls, v):
        if v == '' or v is None:
            return None
        return v
    
    @field_validator('phone', mode='before')
    @classmethod
    def empty_str_to_none_phone(cls, v):
        if v == '' or v is None:
            return None
        return v


class PatientCreate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Field Schema ============
class SmartField(BaseModel):
    id: str
    type: str  # TEXT, DATE, SIGNATURE
    label: str
    x: float
    y: float
    w: float
    h: float
    value: Optional[str] = None
    fontSize: Optional[int] = None
    fontWeight: Optional[str] = None
    textAlign: Optional[str] = None


# ============ Document Schemas ============
class DocumentCreate(BaseModel):
    """From WizeFlow - Create a new document for signing"""
    patient: PatientCreate
    procedure_name: str
    file_url: str
    file_path: Optional[str] = None  # Local file path if uploaded
    file_content: Optional[str] = None  # Base64 encoded file content
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None
    template_id: Optional[UUID] = None
    fields: Optional[List[SmartField]] = None


class DocumentResponse(BaseModel):
    id: UUID
    transaction_id: UUID
    procedure_name: str
    file_url: str
    doctor_name: Optional[str]
    clinic_name: Optional[str]
    status: DocumentStatusEnum
    secure_token: UUID
    patient_link: str  # The actual URL to send via WizeChat
    link_expiry: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUpdate(BaseModel):
    procedure_name: Optional[str] = None
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None
    fields: Optional[List[SmartField]] = None


class SignatureSubmit(BaseModel):
    signature: str  # Base64 encoded signature image
    ip_address: Optional[str] = None
    audit_events: Optional[List[dict]] = None


class DocumentDetailResponse(BaseModel):
    id: UUID
    transaction_id: UUID
    procedure_name: str
    file_url: str
    doctor_name: Optional[str]
    clinic_name: Optional[str]
    status: DocumentStatusEnum
    fields: Optional[List[dict]]
    signature: Optional[str]
    signed_date: Optional[datetime]
    certificate_hash: Optional[str]
    certificate_issued_at: Optional[datetime]
    audit_trail: List[dict]
    patient: PatientResponse

    class Config:
        from_attributes = True


# ============ Template Schemas ============
class TemplateCreate(BaseModel):
    name: str
    file_url: str
    file_path: Optional[str] = None
    file_content: Optional[str] = None
    category: Optional[str] = None
    fields: Optional[List[SmartField]] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    file_url: Optional[str] = None
    file_path: Optional[str] = None
    file_content: Optional[str] = None
    category: Optional[str] = None
    fields: Optional[List[SmartField]] = None


class TemplateResponse(BaseModel):
    id: UUID
    name: str
    file_url: str
    file_path: Optional[str] = None
    category: Optional[str]
    version: str
    fields: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ User/Auth Schemas ============
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: RoleEnum = RoleEnum.DOCTOR


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: UUID
    qualification: Optional[str] = None
    position: Optional[str] = None
    specialty: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    context: Optional[dict] = None  # Optional context for deep linking


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    hospital_id: Optional[UUID] = None
    role: Optional[RoleEnum] = None
    patient_id: Optional[UUID] = None # For Deep Linking context


# ============ SSO Schemas (for WizeFlow integration) ============
class SSOTokenValidate(BaseModel):
    """Token from WizeFlow to validate"""
    token: str
    source: str = "wizeflow"  # Identify which system is calling


class SSOUserData(BaseModel):
    """User data from WizeFlow SSO"""
    user_id: str
    email: EmailStr
    name: str
    role: str
    qualification: Optional[str] = None
    position: Optional[str] = None
    specialty: Optional[str] = None


class SSOHospitalData(BaseModel):
    """Hospital data from WizeFlow SSO"""
    id: str # External ID (e.g. h_demo)
    name: str
    status: str = "ACTIVE"
    subscription_tier: str = "STANDARD"


class SSOPatientData(BaseModel):
    """Patient data for Deep Linking"""
    id: str # External ID (e.g. p1)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    reg_no: Optional[str] = None
    age: Optional[float] = None
    gender: Optional[str] = None
    address: Optional[str] = None

# ============ Hospital/Settings Schemas ============
class WizeChatConfig(BaseModel):
    api_key: Optional[str] = None
    inbox_id: Optional[str] = None
    template_id: Optional[str] = None
    template_name: Optional[str] = None

class HospitalResponse(BaseModel):
    id: UUID
    name: str
    status: str
    wizechat_config: Optional[dict] = None
    
    class Config:
        from_attributes = True

class HospitalSettingsUpdate(BaseModel):
    wizechat_config: WizeChatConfig
