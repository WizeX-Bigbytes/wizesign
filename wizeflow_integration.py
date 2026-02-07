import jwt
import datetime
import uuid

# Configuration (Must match WizeSign)
# WizeFlow should store this securely and separate per integration app if needed.
WIZESIGN_SECRET_KEY = "your-wizesign-secret-key" 
ALGORITHM = "HS256"

def generate_wizesign_sso_token(user, hospital_name, patient_context=None):
    """
    Generates a signed JWT for WizeSign SSO.
    
    Args:
        user (dict): WizeFlow user object (id, email, name, role, etc.)
        hospital_name (str): Name of the hospital/tenant.
        patient_context (dict, optional): Patient data for Deep Linking.
    """
    
    payload = {
        "sub": str(user["id"]),
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5), # Short lived
        "jti": str(uuid.uuid4()),
        
        # User Data (Synced to WizeSign)
        "user": {
            "user_id": str(user["id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "DOCTOR"),
            "qualification": user.get("qualification"),
            "position": user.get("position"),
            "specialty": user.get("specialty")
        },
        
        # Hospital Data (Synced to WizeSign)
        "hospital": {
            "id": str(user.get("hospitalId")), # External ID
            "name": hospital_name, # REQUIRED for creating tenant if new
            "status": "ACTIVE",
            "subscription_tier": "STANDARD" 
        }
    }
    
    # Optional: Deep Linking Context
    if patient_context:
        payload["patient"] = {
            "id": str(patient_context["id"]),
            "name": patient_context["name"],
            "email": patient_context.get("email"),
            "phone": patient_context.get("phone"),
            "dob": patient_context.get("dob"),
            "gender": patient_context.get("gender")
        }

    token = jwt.encode(payload, WIZESIGN_SECRET_KEY, algorithm=ALGORITHM)
    return token

# ==========================================
# Example Usage in WizeFlow Backend
# ==========================================

# 1. User is logged in WizeFlow
wizeflow_user = {
  "id": "u_123",
  "name": "Dr. Smith",
  "email": "smith@hospital.com",
  "role": "DOCTOR",
  "hospitalId": "h_123",
  "specialty": "Cardiology"
}

# 2. WizeFlow fetches Hospital Name (since login response only had ID)
hospital_name = "City General Hospital" 

# 3. User clicks "Open WizeSign" -> WizeFlow generates token
token = generate_wizesign_sso_token(wizeflow_user, hospital_name)

# 4. Redirect user
redirect_url = f"https://sign.wizex.tech/sso?token={token}"
print(f"Redirecting to: {redirect_url}")
