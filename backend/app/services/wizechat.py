import httpx
from typing import Optional
from app.config import settings


class WizeChatService:
    """Service to interact with WizeChat API for e-signature workflows"""
    
    def __init__(self):
        self.base_url = settings.WIZECHAT_API_URL
        self.api_key = settings.WIZECHAT_API_KEY
    
    async def send_signature_request(
        self,
        inbox_id: str,
        to_phone: str,
        document_name: str,
        signature_link: str,
        recipient_name: Optional[str] = None,
        expires_in_hours: Optional[int] = 168,
        custom_message: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> dict:
        """
        Send a document signing request via WizeChat e-signature API.
        
        Args:
            inbox_id: WizeChat inbox ID
            to_phone: Recipient's phone number (e.g., +1234567890)
            document_name: Name of the document to sign
            signature_link: Link to the e-signature page
            recipient_name: Optional recipient name
            expires_in_hours: Link expiration time (default 7 days)
            custom_message: Optional custom message
            api_key: Optional API key override
        
        Returns:
            Response from WizeChat API
        """
        
        async with httpx.AsyncClient() as client:
            token = api_key if api_key else self.api_key
            
            headers = {
                "X-API-Token": token,
                "Content-Type": "application/json"
            }
            
            payload = {
                "inbox_id": inbox_id,
                "to_phone": to_phone,
                "document_name": document_name,
                "signature_link": signature_link,
                "expires_in_hours": expires_in_hours
            }
            
            if recipient_name:
                payload["recipient_name"] = recipient_name
            if custom_message:
                payload["custom_message"] = custom_message
            
            endpoint = f"{self.base_url}/esignature/send-request"
            print(f"\n📤 WizeChat Request:")
            print(f"   URL: {endpoint}")
            print(f"   Payload: {payload}")
            print(f"   Has API Key: {bool(token)}")
            
            try:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                print(f"✅ WizeChat Response: Status {response.status_code}")
                response.raise_for_status()
                result = response.json()
                print(f"   Response Body: {result}")
                return result
            
            except httpx.TimeoutException as e:
                print(f"⏱️ WizeChat Timeout Error: {str(e)}")
                raise Exception("WizeChat API request timed out. Please check your connection.")
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                try:
                    error_body = e.response.json()
                    print(f"❌ WizeChat HTTP Error {status_code}: {error_body}")
                except:
                    error_body = e.response.text
                    print(f"❌ WizeChat HTTP Error {status_code}: {error_body}")
                
                if status_code == 401:
                    raise Exception("Invalid WizeChat API Key. Please check your settings.")
                elif status_code == 404:
                    raise Exception("Invalid WizeChat Inbox ID. Please check your settings.")
                elif status_code == 400:
                    error_detail = error_body.get('detail', 'Invalid request') if isinstance(error_body, dict) else 'Invalid request'
                    raise Exception(f"Bad request: {error_detail}")
                else:
                    raise Exception(f"WizeChat API error (Status {status_code}): {error_body}")
            except httpx.ConnectError as e:
                print(f"🔌 WizeChat Connection Error: {type(e).__name__} - {str(e)}")
                print(f"   Attempted to connect to: {self.base_url}")
                raise Exception(f"Cannot connect to WizeChat API at {self.base_url}. Please check if WizeChat service is running.")
            except httpx.RequestError as e:
                print(f"🔥 WizeChat Request Error: {type(e).__name__} - {str(e)}")
                raise Exception(f"Failed to connect to WizeChat API: {str(e)}")
            except Exception as e:
                print(f"⚠️ WizeChat Unexpected Error: {type(e).__name__} - {str(e)}")
                if "Failed to send signature request" not in str(e):
                    raise Exception(f"Failed to send signature request: {str(e)}")
                raise
    
    async def send_otp(
        self,
        inbox_id: str,
        to_phone: str,
        otp_code: str,
        document_name: Optional[str] = None,
        expires_in_minutes: int = 10,
        api_key: Optional[str] = None
    ) -> dict:
        """
        Send OTP verification code via WizeChat e-signature API.
        
        Args:
            inbox_id: WizeChat inbox ID
            to_phone: Recipient's phone number
            otp_code: The OTP code (typically 6 digits)
            document_name: Optional document name for context
            expires_in_minutes: OTP expiration time (default 10 minutes)
            api_key: Optional API key override
        
        Returns:
            Response from WizeChat API
        """
        
        async with httpx.AsyncClient() as client:
            token = api_key if api_key else self.api_key
            
            headers = {
                "X-API-Token": token,
                "Content-Type": "application/json"
            }
            
            payload = {
                "inbox_id": inbox_id,
                "to_phone": to_phone,
                "otp_code": otp_code,
                "expires_in_minutes": expires_in_minutes
            }
            
            if document_name:
                payload["document_name"] = document_name
            
            endpoint = f"{self.base_url}/esignature/send-otp"
            print(f"\n📤 WizeChat OTP Request:")
            print(f"   URL: {endpoint}")
            print(f"   Phone: {to_phone}")
            print(f"   Has API Key: {bool(token)}")
            
            try:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                print(f"✅ WizeChat OTP Response: Status {response.status_code}")
                response.raise_for_status()
                result = response.json()
                print(f"   Response Body: {result}")
                return result
            
            except httpx.TimeoutException as e:
                print(f"⏱️ WizeChat Timeout Error: {str(e)}")
                raise Exception("WizeChat API request timed out. Please check your connection.")
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                try:
                    error_body = e.response.json()
                    print(f"❌ WizeChat HTTP Error {status_code}: {error_body}")
                except:
                    error_body = e.response.text
                    print(f"❌ WizeChat HTTP Error {status_code}: {error_body}")
                
                if status_code == 401:
                    raise Exception("Invalid WizeChat API Key. Please check your settings.")
                elif status_code == 404:
                    raise Exception("Invalid WizeChat Inbox ID. Please check your settings.")
                elif status_code == 400:
                    error_detail = error_body.get('detail', 'Invalid request') if isinstance(error_body, dict) else 'Invalid request'
                    raise Exception(f"Bad request: {error_detail}")
                else:
                    raise Exception(f"WizeChat API error (Status {status_code}): {error_body}")
            except httpx.ConnectError as e:
                print(f"🔌 WizeChat Connection Error: {type(e).__name__} - {str(e)}")
                print(f"   Attempted to connect to: {self.base_url}")
                raise Exception(f"Cannot connect to WizeChat API at {self.base_url}. Please check if WizeChat service is running.")
            except httpx.RequestError as e:
                print(f"🔥 WizeChat Request Error: {type(e).__name__} - {str(e)}")
                raise Exception(f"Failed to connect to WizeChat API: {str(e)}")
            except Exception as e:
                print(f"⚠️ WizeChat Unexpected Error: {type(e).__name__} - {str(e)}")
                if "Failed to send OTP" not in str(e):
                    raise Exception(f"Failed to send OTP: {str(e)}")
                raise
    
    async def send_completion(
        self,
        inbox_id: str,
        to_phone: str,
        document_name: str,
        signed_document_url: Optional[str] = None,
        signer_name: Optional[str] = None,
        signed_at: Optional[str] = None,
        send_document: bool = False,
        api_key: Optional[str] = None
    ) -> dict:
        """
        Send signature completion notification via WizeChat e-signature API.
        
        Args:
            inbox_id: WizeChat inbox ID
            to_phone: Recipient's phone number
            document_name: Name of the signed document
            signed_document_url: Optional URL to the signed PDF
            signer_name: Optional signer name
            signed_at: Optional ISO timestamp of signing
            send_document: If True, sends the PDF as attachment
            api_key: Optional API key override
        
        Returns:
            Response from WizeChat API
        """
        
        async with httpx.AsyncClient() as client:
            token = api_key if api_key else self.api_key
            
            headers = {
                "X-API-Token": token,
                "Content-Type": "application/json"
            }
            
            payload = {
                "inbox_id": inbox_id,
                "to_phone": to_phone,
                "document_name": document_name,
                "send_document": send_document
            }
            
            if signed_document_url:
                payload["signed_document_url"] = signed_document_url
            if signer_name:
                payload["signer_name"] = signer_name
            if signed_at:
                payload["signed_at"] = signed_at
            
            try:
                response = await client.post(
                    f"{self.base_url}/esignature/send-completion",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
            
            except httpx.TimeoutException:
                raise Exception("WizeChat API request timed out. Please check your connection.")
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                if status_code == 401:
                    raise Exception("Invalid WizeChat API Key. Please check your settings.")
                elif status_code == 404:
                    raise Exception("Invalid WizeChat Inbox ID. Please check your settings.")
                elif status_code == 400:
                    error_detail = e.response.json().get('detail', 'Invalid request')
                    raise Exception(f"Bad request: {error_detail}")
                else:
                    raise Exception(f"WizeChat API error (Status {status_code}): {str(e)}")
            except httpx.RequestError as e:
                raise Exception(f"Failed to connect to WizeChat API: {str(e)}")
            except Exception as e:
                if "Failed to send completion notification" not in str(e):
                    raise Exception(f"Failed to send completion notification: {str(e)}")
                raise


# Singleton instance
wizechat_service = WizeChatService()
