"""
Initialize database tables
Run with: python init_db.py
"""
import asyncio
import os
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from app.database import engine
from app.models import Base

async def init_models():
    async with engine.begin() as conn:
        # Drop all tables (careful in production!)
        print("Dropping existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        print("Creating tables with new schema...")
        await conn.run_sync(Base.metadata.create_all)
    
    print("✓ Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_models())
