# WizeFlow to WizeSign SSO Integration Guide

## Overview
This guide documents how to connect **WizeFlow** (Flask + React) to **WizeSign** using JWT-based Single Sign-On (Option 1).

## 1. Shared Secret
Both applications must share the same **Secret Key** to sign and verify tokens.
*   **WizeSign**: Set valid `SECRET_KEY` in `.env.prod`.
*   **WizeFlow**: Add `WIZESIGN_SECRET_KEY` to your Flask config (it must match WizeSign's key).

## 2. Backend Implementation (Flask)
Add this endpoint to your WizeFlow backend to generate the SSO token.

```python
import jwt  # pip install pyjwt
import datetime
from flask import jsonify, session, current_app

@app.route('/api/wizesign/sso-token', methods=['POST'])
def generate_wizesign_token():
    # 1. Get current logged-in user from session
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # 2. Fetch User & Organization details from DB
    # user = User.query.get(user_id)
    # org = Organization.query.get(user.org_id)

    # 3. Check if patient_id was passed (from request body)
    data = request.get_json() if request.is_json else {}
    patient_id = data.get('patient_id')
    
    patient_context = None
    if patient_id:
        # Fetch patient details
        # patient = Patient.query.get(patient_id)
        if patient:
            patient_context = {
                "id": str(patient.id),      # Your DB ID
                "name": patient.full_name,
                "email": patient.email,
                "phone": patient.phone,
                "dob": patient.dob.strftime('%Y-%m-%d') if patient and patient.dob else None,
                "reg_no": patient.registration_number,
                "age": patient.age,
                "gender": patient.gender,
                "address": patient.address
            }
    
    # 4. Construct Payload (Must match WizeSign schema)
    payload = {
        "user": {
            "email": "doctor@example.com", # user.email
            "name": "Dr. Smith",           # user.name
            "role": "DOCTOR",              # user.role
            "qualification": "MBBS",       # optional
            "specialty": "Cardiology"      # optional
        },
        "hospital": {
            "name": "City Hospital",       # org.name
            "id": "org_123",               # org.id
            "status": "ACTIVE"
        },
        "patient": patient_context # Optional context
    }
    
    # 5. Sign Token
    # MUST match WizeSign's SECRET_KEY and ALGORITHM (HS256)
    secret_key = current_app.config['WIZESIGN_SECRET_KEY'] 
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    
    return jsonify({"token": token, "redirect_url": f"https://wizesign.yourdomain.com/sso?token={token}"})
```

## 3. Frontend Implementation (React)

### Scenario A: Open WizeSign Dashboard
```javascript
const handleOpenWizeSign = async () => {
  try {
    const response = await axios.post('/api/wizesign/sso-token');
    window.location.href = response.data.redirect_url;
  } catch (error) {
    console.error("Failed to launch WizeSign", error);
    alert("Could not launch WizeSign session");
  }
};
```

### Scenario B: Launch for Specific Patient
```javascript
const openPatientInWizeSign = async (patientId) => {
  try {
    // Pass patient_id to generate context-aware token
    const response = await axios.post('/api/wizesign/sso-token', { patient_id: patientId });
    window.location.href = response.data.redirect_url;
  } catch (error) {
    console.error("Failed to open patient in WizeSign", error);
  }
};
```

## 4. Verification
1.  User clicks "Open WizeSign" in WizeFlow.
2.  WizeFlow generates JWT -> Redirects to WizeSign `/sso?token=...`.
3.  WizeSign `SSOHandler` grabs token -> Calls WizeSign Backend `/api/auth/sso/validate`.
4.  WizeSign Backend verifies signature -> Creates WizeSign Session -> Logs user in.
