"""
Initialize production database tables
Run inside container: python init_db_prod.py
"""
import asyncio
import os
from app.database import engine
from app.models import Base

async def init_models():
    async with engine.begin() as conn:
        # Create all tables (SAFE: does not drop existing tables)
        print("Creating tables (if not exist)...")
        await conn.run_sync(Base.metadata.create_all)
    
    print("✓ Production database initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_models())
