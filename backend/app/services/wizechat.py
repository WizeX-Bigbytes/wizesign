import httpx
from typing import Optional
from app.config import settings


class WizeChatService:
    """Service to send WhatsApp messages via WizeChat E-Signature API"""

    BASE_URL = settings.WIZECHAT_API_URL or "https://chat.test.wizex.tech"

    def __init__(self):
        self.api_key = settings.WIZECHAT_API_KEY

    def _get_headers(self, api_key: Optional[str] = None) -> dict:
        """Return headers using X-API-Token authentication."""
        token = api_key or self.api_key
        return {
            "X-API-Token": token,
            "Content-Type": "application/json",
        }

    async def _post(self, endpoint: str, payload: dict, api_key: Optional[str] = None) -> dict:
        """
        Core HTTP helper — POSTs to a WizeChat endpoint with X-API-Token auth.
        """
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers(api_key)

        print(f"\n📤 WizeChat POST: {url}")
        print(f"   Payload: {payload}")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers, timeout=30.0)
                print(f"✅ WizeChat Response: {response.status_code}")
                response.raise_for_status()
                result = response.json()
                print(f"   Body: {result}")
                return result

            except httpx.TimeoutException:
                print("⏱️ WizeChat Timeout")
                raise Exception("WizeChat API request timed out.")

            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                try:
                    error_body = e.response.json()
                except Exception:
                    error_body = e.response.text
                print(f"❌ WizeChat HTTP {status_code}: {error_body}")

                if status_code == 401:
                    raise Exception("Invalid WizeChat API Key. Please check your settings.")
                elif status_code == 404:
                    raise Exception("Invalid WizeChat Inbox ID or endpoint not found.")
                elif status_code == 400:
                    detail = (
                        error_body.get("detail", str(error_body))
                        if isinstance(error_body, dict)
                        else str(error_body)
                    )
                    raise Exception(f"Bad request: {detail}")
                else:
                    raise Exception(f"WizeChat API error ({status_code}): {error_body}")

            except httpx.ConnectError as e:
                print(f"🔌 WizeChat Connection Error: {e}")
                raise Exception(f"Cannot connect to WizeChat API at {self.BASE_URL}.")

            except httpx.RequestError as e:
                print(f"🔥 WizeChat Request Error: {e}")
                raise Exception(f"Failed to connect to WizeChat: {str(e)}")

    # ─── Public Methods ───────────────────────────────────────────────────────

    async def send_signature_request(
        self,
        inbox_id: str,
        to_phone: str,
        document_name: str,
        signature_link: str,
        recipient_name: Optional[str] = None,
        expires_in_hours: Optional[int] = 72,
        custom_message: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> dict:
        """
        Send a signature request via WizeChat.
        POST /api/esignature/send-request
        """
        payload: dict = {
            "inbox_id": inbox_id,
            "to_phone": to_phone,
            "document_name": document_name,
            "signature_link": signature_link,
        }
        if recipient_name is not None:
            payload["recipient_name"] = recipient_name
        if expires_in_hours is not None:
            payload["expires_in_hours"] = expires_in_hours
        if custom_message is not None:
            payload["custom_message"] = custom_message

        return await self._post("/api/esignature/send-request", payload, api_key=api_key)

    async def send_otp(
        self,
        inbox_id: str,
        to_phone: str,
        otp_code: str,
        document_name: Optional[str] = None,
        expires_in_minutes: int = 5,
        api_key: Optional[str] = None,
    ) -> dict:
        """
        Send OTP verification code via WizeChat.
        POST /api/esignature/send-otp
        """
        payload: dict = {
            "inbox_id": inbox_id,
            "to_phone": to_phone,
            "otp_code": otp_code,
        }
        if document_name is not None:
            payload["document_name"] = document_name
        payload["expires_in_minutes"] = expires_in_minutes

        return await self._post("/api/esignature/send-otp", payload, api_key=api_key)

    async def send_completion(
        self,
        inbox_id: str,
        to_phone: str,
        document_name: str,
        signer_name: Optional[str] = None,
        signed_at: Optional[str] = None,
        signed_document_url: Optional[str] = None,
        send_document: bool = False,
        api_key: Optional[str] = None,
    ) -> dict:
        """
        Send signing completion confirmation via WizeChat.
        POST /api/esignature/send-completion
        """
        payload: dict = {
            "inbox_id": inbox_id,
            "to_phone": to_phone,
            "document_name": document_name,
        }
        if signer_name is not None:
            payload["signer_name"] = signer_name
        if signed_at is not None:
            payload["signed_at"] = signed_at
        if signed_document_url is not None:
            payload["signed_document_url"] = signed_document_url
        payload["send_document"] = send_document

        return await self._post("/api/esignature/send-completion", payload, api_key=api_key)


# Singleton instance
wizechat_service = WizeChatService()
