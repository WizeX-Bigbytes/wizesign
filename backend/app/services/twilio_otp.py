"""
Twilio Verify API service for OTP delivery via SMS or WhatsApp.

Uses the Twilio Verify API which handles code generation, delivery,
rate-limiting, and expiry automatically.
"""

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from typing import Optional


class TwilioOTPService:
    """Wrapper around Twilio Verify API for sending/checking OTP codes."""

    @staticmethod
    def _get_client(twilio_config: dict) -> Client:
        """Create a Twilio REST client from hospital config."""
        account_sid = twilio_config.get("account_sid")
        auth_token = twilio_config.get("auth_token")

        if not account_sid or not auth_token:
            raise ValueError("Twilio Account SID and Auth Token are required")

        return Client(account_sid, auth_token)

    @staticmethod
    def _get_service_sid(twilio_config: dict) -> str:
        """Extract Verify Service SID from config."""
        service_sid = twilio_config.get("verify_service_sid")
        if not service_sid:
            raise ValueError("Twilio Verify Service SID is required")
        return service_sid

    async def send_verification(
        self,
        to_phone: str,
        channel: str,
        twilio_config: dict,
    ) -> dict:
        """
        Send OTP verification code via Twilio Verify API.

        Args:
            to_phone: Phone number in E.164 format (e.g. +919876543210)
            channel: 'sms' or 'whatsapp'
            twilio_config: Dict with account_sid, auth_token, verify_service_sid

        Returns:
            dict with status info from Twilio
        """
        try:
            client = self._get_client(twilio_config)
            service_sid = self._get_service_sid(twilio_config)

            print(f"📲 Twilio OTP: Sending {channel} verification to {to_phone}")
            print(f"   Service SID: {service_sid[:10]}...")

            # Twilio Verify API — sends the OTP automatically
            verification = client.verify.v2.services(
                service_sid
            ).verifications.create(
                to=to_phone,
                channel=channel,  # 'sms' or 'whatsapp'
            )

            print(f"✅ Twilio verification sent: SID={verification.sid}, status={verification.status}")

            return {
                "success": True,
                "status": verification.status,
                "sid": verification.sid,
                "channel": channel,
                "message": f"OTP sent via {channel.upper()}"
            }

        except TwilioRestException as e:
            print(f"❌ Twilio API Error: {e.code} - {e.msg}")

            # Map common Twilio errors to user-friendly messages
            if e.code == 20003:
                raise Exception("Invalid Twilio credentials. Please check Account SID and Auth Token.")
            elif e.code == 20404:
                raise Exception("Twilio Verify Service not found. Please check the Service SID.")
            elif e.code == 60200:
                raise Exception("Invalid phone number format. Please use international format (e.g., +919876543210).")
            elif e.code == 60203:
                raise Exception("Too many verification attempts. Please wait before trying again.")
            elif e.code == 60212:
                raise Exception("This phone number is not eligible for verification.")
            else:
                raise Exception(f"Twilio error ({e.code}): {e.msg}")

        except ValueError as e:
            print(f"❌ Twilio Config Error: {str(e)}")
            raise Exception(str(e))

        except Exception as e:
            print(f"❌ Twilio Unexpected Error: {str(e)}")
            raise Exception(f"Failed to send OTP via Twilio: {str(e)}")

    async def check_verification(
        self,
        to_phone: str,
        code: str,
        twilio_config: dict,
    ) -> dict:
        """
        Verify an OTP code via Twilio Verify API.

        Args:
            to_phone: Phone number in E.164 format
            code: 6-digit OTP code entered by user
            twilio_config: Dict with account_sid, auth_token, verify_service_sid

        Returns:
            dict with verification result
        """
        try:
            client = self._get_client(twilio_config)
            service_sid = self._get_service_sid(twilio_config)

            print(f"🔐 Twilio OTP: Checking verification for {to_phone}")

            verification_check = client.verify.v2.services(
                service_sid
            ).verification_checks.create(
                to=to_phone,
                code=code,
            )

            print(f"   Twilio check result: status={verification_check.status}")

            is_approved = verification_check.status == "approved"

            return {
                "success": is_approved,
                "status": verification_check.status,
                "message": "OTP verified successfully" if is_approved else "Invalid OTP code",
            }

        except TwilioRestException as e:
            print(f"❌ Twilio Verify Check Error: {e.code} - {e.msg}")

            if e.code == 20404:
                raise Exception("Verification expired or not found. Please request a new code.")
            elif e.code == 60202:
                raise Exception("Too many failed attempts. Please request a new OTP.")
            else:
                raise Exception(f"Twilio verification error: {e.msg}")

        except ValueError as e:
            raise Exception(str(e))

        except Exception as e:
            print(f"❌ Twilio Check Unexpected Error: {str(e)}")
            raise Exception(f"Failed to verify OTP: {str(e)}")


# Singleton instance
twilio_otp_service = TwilioOTPService()
