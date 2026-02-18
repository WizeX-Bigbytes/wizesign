import jwt
import datetime
import uuid

# Configuration (Must match WizeSign)
# WizeFlow should store this securely and separate per integration app if needed.
WIZESIGN_SECRET_KEY = "your_super_secret_key_change_this" 
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
        # WizeFlow User: id, name, email, role, hospitalId, qualification, position, specialty
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
        # WizeFlow Hospital: id, name, status, subscriptionTier
        "hospital": {
            "id": str(user.get("hospitalId")), # External ID from User object
            "name": hospital_name, # REQUIRED: Fetch from GET /api/hospitals/{id} if not in login response
            "status": "ACTIVE",
            "subscription_tier": "STANDARD" # Map WizeFlow 'subscriptionTier' if available
        }
    }
    
    # Optional: Deep Linking Context (Patient)
    # WizeFlow Patient: id, name, phone, age, gender, address, dateOfBirth, registrationNumber
    if patient_context:
        payload["patient"] = {
            "id": str(patient_context["id"]),
            "name": patient_context["name"],
            "email": patient_context.get("email"), # Not in WizeFlow Patient, optional
            "phone": patient_context.get("phone"),
            "dob": patient_context.get("dateOfBirth"), # Map dateOfBirth -> dob
            "reg_no": patient_context.get("registrationNumber"), # Map registrationNumber -> reg_no
            "age": patient_context.get("age"),
            "gender": patient_context.get("gender"),
            "address": patient_context.get("address")
        }

    token = jwt.encode(payload, WIZESIGN_SECRET_KEY, algorithm=ALGORITHM)
    return token

# ==========================================
# Example Usage in WizeFlow Backend
# ==========================================

# 1. User is logged in WizeFlow (Response from POST /api/auth/login)
wizeflow_user = {
  "id": "u_123",
  "name": "Dr. John Smith",
  "email": "john@hospital.com",
  "role": "DOCTOR",
  "hospitalId": "h_123",
  "specialty": "Cardiology",
  "qualification": "MBBS, MD",
  "position": "Senior Consultant"
}

# 2. WizeFlow fetches Hospital Name (GET /api/hospitals/{id})
# Login response only gives hospitalId, so fetch name to sync tenant.
hospital_name = "City General Hospital" 

# 3. (Optional) Patient Context (GET /api/patients/{id})
# If opening WizeSign from a specific patient's profile:
wizeflow_patient = {
  "id": "p_456",
  "registrationNumber": "P24-1001", 
  "name": "Jane Doe",
  "phone": "9876543210",
  "age": 28,
  "gender": "F",
  "dateOfBirth": "1996-05-20",
  "address": "456 Oak Ave"
}

# 4. Generate Token
# Pass patient_context=wizeflow_patient for Deep Linking
token = generate_wizesign_sso_token(wizeflow_user, hospital_name, patient_context=wizeflow_patient)


# 4. Redirect user
redirect_url = f"https://sign.wizex.tech/sso?token={token}"
print(f"Redirecting to: {redirect_url}")
