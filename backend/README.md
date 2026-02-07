# WizeSign Backend API

FastAPI backend for WizeSign e-signature platform with WizeFlow and WizeChat integration.

## Features

- **Document Management**: Create, retrieve, and manage consent documents
- **Secure Link Generation**: Generate unique, time-limited links for patient document signing
- **SSO Integration**: Single Sign-On with WizeFlow
- **WizeChat Integration**: Send WhatsApp messages via WizeChat API
- **Audit Trail**: Complete tracking of all document activities
- **Patient Management**: Store and manage patient information

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env` file and update with your credentials:

```bash
cp .env.example .env
```

Update the following:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SECRET_KEY`: Random secret for JWT tokens
- `WIZECHAT_API_URL`: Your WizeChat API endpoint
- `WIZECHAT_API_KEY`: Your WizeChat API key
- `FRONTEND_URL`: Your React frontend URL

### 3. Database Setup

```bash
# Create database
createdb wizesign

# Run migrations (using Alembic)
alembic upgrade head
```

### 4. Run Server

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication (SSO)

#### POST `/api/auth/sso/validate`
Validate SSO token from WizeFlow and get WizeSign JWT token.

**Request:**
```json
{
  "token": "wizeflow-jwt-token",
  "source": "wizeflow"
}
```

**Response:**
```json
{
  "access_token": "wizesign-jwt-token",
  "token_type": "bearer"
}
```

#### POST `/api/auth/sso/wizeflow`
Alternative SSO endpoint using Authorization header.

**Headers:**
```
Authorization: Bearer wizeflow-jwt-token
```

### Documents

#### POST `/api/documents/create`
**Create a new document** (Called by WizeFlow)

This endpoint creates a patient record, generates a document with secure token, and returns the link.

**Request:**
```json
{
  "patient": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+11234567890",
    "dob": "1990-01-01"
  },
  "procedure_name": "Consent for Surgery",
  "file_url": "https://your-cdn.com/document.jpg",
  "doctor_name": "Dr. Smith",
  "clinic_name": "City Hospital",
  "template_id": "uuid-optional",
  "fields": [
    {
      "id": "f1",
      "type": "TEXT",
      "label": "Patient Name",
      "x": 10,
      "y": 20,
      "w": 40,
      "h": 5,
      "value": "John Doe"
    },
    {
      "id": "f2",
      "type": "SIGNATURE",
      "label": "Patient Signature",
      "x": 10,
      "y": 80,
      "w": 40,
      "h": 10
    }
  ]
}
```

**Response:**
```json
{
  "id": "document-uuid",
  "transaction_id": "transaction-uuid",
  "procedure_name": "Consent for Surgery",
  "secure_token": "secure-token-uuid",
  "patient_link": "http://localhost:3000/patient/view?token=secure-token-uuid",
  "link_expiry": "2026-02-12T00:00:00",
  "status": "SENT",
  "created_at": "2026-02-05T00:00:00"
}
```

#### POST `/api/documents/{document_id}/send-whatsapp`
**Send document link via WhatsApp** using WizeChat

**Request:**
```json
{
  "document_id": "document-uuid",
  "inbox_id": "your-wizechat-inbox-id",
  "phone_number": "+11234567890",
  "send_via_whatsapp": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "message_id": "wizechat-message-id"
}
```

#### GET `/api/documents/by-token/{token}`
**Get document by secure token** (Called by patient view)

**Response:**
```json
{
  "id": "document-uuid",
  "procedure_name": "Consent for Surgery",
  "file_url": "https://...",
  "fields": [...],
  "patient": {
    "id": "patient-uuid",
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "audit_trail": [...]
}
```

#### POST `/api/documents/{document_id}/sign`
**Submit signature** (Called by patient after signing)

**Request:**
```json
{
  "signature": "data:image/png;base64,...",
  "ip_address": "192.168.1.1",
  "audit_events": [
    {
      "timestamp": "2026-02-05T00:00:00",
      "action": "DOCUMENT_SIGNED",
      "actor": "John Doe",
      "details": "Signature submitted"
    }
  ]
}
```

### Templates

#### GET `/api/templates/`
List all templates

#### POST `/api/templates/`
Create a new template

#### GET `/api/templates/{template_id}`
Get specific template

#### PATCH `/api/templates/{template_id}`
Update template

#### DELETE `/api/templates/{template_id}`
Delete template

## Integration Flow

### WizeFlow → WizeSign → WizeChat

1. **Doctor initiates signing in WizeFlow**
   - WizeFlow calls `/api/documents/create` with patient and document data
   - WizeSign returns secure link

2. **Send link via WhatsApp**
   - WizeFlow (or WizeSign) calls `/api/documents/{id}/send-whatsapp`
   - WizeSign calls WizeChat API
   - WizeChat sends WhatsApp message with link

3. **Patient clicks link**
   - Opens `http://frontend/patient/view?token=xyz`
   - Frontend calls `/api/documents/by-token/{token}`
   - Patient reviews and signs

4. **Patient submits signature**
   - Frontend calls `/api/documents/{id}/sign`
   - Document status updated to SIGNED
   - WizeFlow can query document status

## WizeChat Integration

The backend calls WizeChat API to send WhatsApp messages. Configure in `.env`:

```
WIZECHAT_API_URL=http://your-wizechat-api/api
WIZECHAT_API_KEY=your-api-key
```

**WizeChat API Call Format:**
```
POST {WIZECHAT_API_URL}/messages/send
Authorization: Bearer {WIZECHAT_API_KEY}

{
  "inbox_id": "inbox-id",
  "phone_number": "+1234567890",
  "message": "Your message..."
}
```

## Database Schema

- **users**: Doctor/Staff users
- **patients**: Patient records
- **documents**: Consent documents
- **templates**: Document templates

## Security

- JWT-based authentication
- Secure token-based document links
- Link expiration (7 days default)
- IP tracking and audit trails
- CORS protection

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Production Deployment

1. Set `APP_ENV=production` in `.env`
2. Use proper PostgreSQL database
3. Configure reverse proxy (nginx)
4. Enable HTTPS
5. Set secure SECRET_KEY
6. Configure proper CORS origins
