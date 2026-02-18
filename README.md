# WizeSign - E-Signature & Patient Integration System

## 🎯 Overview
WizeSign is a secure e-signature platform designed for healthcare providers. It integrates seamlessly with **WizeFlow** for single sign-on (SSO) and **WizeChat** (WhatsApp) for OTP verification and document delivery.

---

## 🔐 1. WizeFlow SSO Integration

### How it Works
Doctors access WizeSign directly from WizeFlow. Patient context is passed via a secure JWT, allowing for automatic patient creation and form pre-filling.

### Integration Flow
1.  **WizeFlow** generates a JWT containing User (Doctor), Hospital, and Patient data.
2.  Redirects to `WizeSign` with `?token={jwt}`.
3.  **WizeSign Backend** validates the token signature.
4.  Syncs Hospital, Doctor, and Patient records to the database.
5.  Logs the doctor in and redirects to the dashboard with patient details pre-filled and locked.

### JWT Payload Structure
```json
{
  "user": {
    "email": "doctor@example.com",
    "name": "Dr. Smith",
    "role": "DOCTOR"
  },
  "hospital": {
    "id": "h_123",
    "name": "General Hospital"
  },
  "patient": {
    "id": "p_456",
    "name": "John Doe",
    "phone": "+1234567890"
  }
}
```

---

## 💬 2. WizeChat API Integration (WhatsApp)

WizeSign uses WizeChat for two critical compliance features:

### A. OTP Verification
*   **Trigger**: When a doctor clicks "Send Document".
*   **Action**: A 6-digit OTP is generated and sent via WhatsApp to the patient.
*   **Security**: OTPs are hashed (SHA-256) and expire in 10 minutes.

### B. Signed Document Delivery
*   **Trigger**: Automatically sent after the patient signs.
*   **Content**:
    *   Confirmation message.
    *   **Digital Certificate Hash**.
    *   Secure link to download the signed PDF.
*   **Compliance**: Meets ESIGN Act requirements for providing a copy of the signed record.

### Configuration
Update `backend/.env` with your WizeChat credentials:
```ini
WIZECHAT_API_URL=http://your-wizechat-instance/api
WIZECHAT_API_KEY=your-api-key
```

---

## 🚀 3. Setup & Running

### Prerequisites
*   Docker & Docker Compose
*   Python 3.11+ (for local scripts)

### Installation
1.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

2.  **Initialize Database**:
    ```bash
    # Can be run from host machine
    python backend/init_db.py
    ```

### Environment Variables (`backend/.env`)
Ensure `DATABASE_URL` is set correctly for your context:
*   **Docker Container**: `postgresql+asyncpg://postgres:postgres@db:5432/wizesign`
*   **Local Scripts**: `postgresql+asyncpg://postgres:postgres@localhost:5432/wizesign`
*(Note: `docker-compose.yml` handles the container override automatically)*

---

## 🚀 4. Production Deployment

### Step 1: Configure Environment
1.  Open `.env.prod`.
2.  Set strong passwords for `POSTGRES_PASSWORD` and `SECRET_KEY`.
3.  Add your real `WIZECHAT_API_KEY`.

### Step 2: Deploy
Run the following command to build and start the production containers:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 3: Initialize Database
Run this command to create tables inside the secure container:
```bash
docker-compose -f docker-compose.prod.yml exec backend python init_db_prod.py
```

### Step 4: Verify
*   Your app will be running on port `8082`.
*   Access via: `http://localhost:8082` (or server IP).
*   The database will be secure (not accessible from the internet).
*   Services will restart automatically if the server reboots.

---

## 🛠 Troubleshooting

*   **SSO Failed**: Check if `SECRET_KEY` matches WizeFlow. Verify `backend/app/routers/auth.py`.
*   **WhatsApp Not Sending**: Check `WIZECHAT_API_KEY` and ensure the WizeChat service is reachable.
*   **Database Connection**: Ensure `db` container is running (`docker ps`).
