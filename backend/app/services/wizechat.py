import httpx
from typing import Optional
from app.config import settings


class WizeChatService:
    """Service to interact with WizeChat API for sending WhatsApp messages"""
    
    def __init__(self):
        self.base_url = settings.WIZECHAT_API_URL
        self.api_key = settings.WIZECHAT_API_KEY
    
    async def send_whatsapp_message(
        self,
        inbox_id: str,
        phone_number: str,
        message: str,
        template_name: Optional[str] = None,
        template_params: Optional[dict] = None,
        api_key: Optional[str] = None
    ) -> dict:
        """
        Send a WhatsApp message via WizeChat API.
        
        Args:
            inbox_id: The WizeChat inbox ID to send from
            phone_number: Recipient's phone number (with country code)
            message: The message text to send
            template_name: Optional WhatsApp template name
            template_params: Optional template parameters
        
        Returns:
            Response from WizeChat API
        """
        
        async with httpx.AsyncClient() as client:
            # Use provided API key or fallback to global settings
            token = api_key if api_key else self.api_key
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "inbox_id": inbox_id,
                "phone_number": phone_number,
                "message": message
            }
            
            # Add template data if provided
            if template_name:
                payload["template_name"] = template_name
                payload["template_params"] = template_params or {}
            
            try:
                response = await client.post(
                    f"{self.base_url}/messages/send",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
            
            except httpx.HTTPError as e:
                print(f"Error sending WhatsApp message: {e}")
                raise Exception(f"Failed to send WhatsApp message: {str(e)}")
    
    async def send_document_link(
        self,
        inbox_id: str,
        phone_number: str,
        patient_name: str,
        document_link: str,
        procedure_name: str,
        doctor_name: str,
        api_key: Optional[str] = None
    ) -> dict:
        """
        Send a document signing link via WhatsApp.
        
        Args:
            inbox_id: WizeChat inbox ID
            phone_number: Patient's phone number
            patient_name: Patient's full name
            document_link: The secure link to sign the document
            procedure_name: Name of the medical procedure
            doctor_name: Doctor's name
        
        Returns:
            Response from WizeChat API
        """
        
        message = f"""Hello {patient_name},

You have a consent form ready for signing from {doctor_name}.

📋 Procedure: {procedure_name}

Please click the secure link below to review and digitally sign your consent form:

🔗 {document_link}

This link is valid for 7 days. If you have any questions, please contact your healthcare provider.

Thank you!"""
        
        return await self.send_whatsapp_message(
            inbox_id=inbox_id,
            phone_number=phone_number,
            message=message,
            api_key=api_key
        )


# Singleton instance
wizechat_service = WizeChatService()
