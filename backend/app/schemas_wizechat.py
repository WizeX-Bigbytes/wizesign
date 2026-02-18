from pydantic import BaseModel


# ============ WizeChat Schemas ============
class SendWhatsAppRequest(BaseModel):
    """Request to send WhatsApp message via WizeChat"""
    inbox_id: str
    phone_number: str
    patient_name: str
    message: str


class SendDocumentLinkRequest(BaseModel):
    """Request to send document link via WizeChat"""
    inbox_id: str = "default-inbox"
    phone_number: str
    send_via_whatsapp: bool = True


class WhatsAppResponse(BaseModel):
    """Response from WizeChat API"""
    success: bool
    message: str
    message_id: str = None
    error: str = None
