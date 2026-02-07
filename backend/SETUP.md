# Backend Setup Instructions

## Fixed Dependency Issues

The `requirements.txt` has been updated to resolve conflicts:
- ✅ Removed `databases` package (incompatible with SQLAlchemy 2.0)
- ✅ Removed `python-cors` (FastAPI has built-in CORS middleware)
- ✅ Removed `uuid` (part of Python standard library)

## Quick Setup

### Option 1: Run setup script (Recommended)
```bash
cd backend
setup.bat
```

### Option 2: Manual setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

## Running the Server

After installation:
```bash
# Make sure venv is activated
venv\Scripts\activate

# Run the server
uvicorn app.main:app --reload --port 8000
```

API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## Next: Database Setup

You'll need PostgreSQL installed. Then:

```bash
# Create database
createdb wizesign

# Update .env with your database URL
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/wizesign
```

## Test the API

Once running, test with:
```bash
curl http://localhost:8000/health
```

Should return: `{"status":"healthy"}`
