# WizeSign - E-Signature Platform

Complete e-signature solution integrating with WizeFlow (HMS) and WizeChat (WhatsApp API).

## Project Structure

```
wizesign/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── routers/  # API endpoints
│   │   ├── models.py # Database models
│   │   ├── schemas.py # Pydantic schemas
│   │   └── services/ # External service integrations
│   ├── requirements.txt
│   └── README.md
│
├── components/       # React components
│   ├──doctor/        # Doctor portal components
│   ├── patient/      # Patient portal components
│   ├── DoctorDashboard.tsx
│   ├── DoctorEditor.tsx
│   ├── DoctorLayout.tsx
│   ├── PatientView.tsx
│   ├── CompletedView.tsx
│   └── LandingPage.tsx
│
├── App.tsx          # Main app with routing
└── package.json
```

## Quick Start

### Frontend

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run server
uvicorn app.main:app --reload
```

## Integration Flow

### 1. WizeFlow Creates Document
```
POST http://localhost:8000/api/documents/create
{
  "patient": {...},
  "procedure_name": "...",
  "file_url": "...",
  ...
}

Response:
{
  "patient_link": "http://localhost:3000/patient/view?token=xyz",
  ...
}
```

### 2. Send via WizeChat
```
POST http://localhost:8000/api/documents/{id}/send-whatsapp
{
  "inbox_id": "wizechat-inbox-id",
  "phone_number": "+1234567890"
}
```

### 3. Patient Signs
- Patient clicks link → Opens patient view
- Reviews document → Signs digitally
- Submits signature → Document marked as SIGNED

## Key Features

- ✅ SSO Integration with WizeFlow
- ✅ Secure document links (7-day expiry)
- ✅ WhatsApp integration via WizeChat
- ✅ Digital signature capture
- ✅ Complete audit trail
- ✅ OTP verification
- ✅ Mobile-responsive design

See `backend/README.md` for complete API documentation.
