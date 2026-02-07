from jose import jwt
import datetime
import uuid

# Configuration (Must match backend/.env)
SECRET_KEY = "your_super_secret_key_change_this"
ALGORITHM = "HS256"
FRONTEND_URL = "http://localhost:3000"

def generate_hub_link(doctor_email="sarah@demo.com", patient_id=None):
    """
    Generates a deep-link URL for WizeSign.
    """
    payload = {
        "user": {
            "email": doctor_email,
            "name": "Dr. Sarah Jenkins",
            "role": "DOCTOR",
            "user_id": "ext_u_1",
            "qualification": "MBBS",
            "position": "Senior Physician",
            "specialty": "General Medicine"
        },
        "hospital": {
            "name": "Demo Hospital",
            "id": "h_demo",
            "status": "ACTIVE"
        },
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    }

    if patient_id:
        payload["patient"] = {
            "id": patient_id, # Must match external_id in seed data (e.g., 'p1')
            "name": "Ron Weasley",
            "email": "ron@example.com",
            "reg_no": "P-1024",
            "age": 25,
            "gender": "M",
            "address": "The Burrow"
        }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    url = f"{FRONTEND_URL}/sso?token={token}"
    print("\n--- WizeFlow Hub Link Generator ---")
    print(f"Context: Doctor={doctor_email}, Patient={patient_id or 'None'}")
    print(f"Link: {url}\n")
    return url

if __name__ == "__main__":
    # 1. Doctor Dashboard Link
    generate_hub_link()
    
    # 2. Patient Context Link (Deep Link)
    generate_hub_link(patient_id="p1")
