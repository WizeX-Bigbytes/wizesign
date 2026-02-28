import asyncio
import os
from sqlalchemy import text
from app.database import engine
from app.models import Base

async def reset_db():
    print("WARNING: This will drop all tables and completely reset the database!")
    # For safety, require a confirmation or just assume it since we're explicitly running it
    
    async with engine.begin() as conn:
        print("Dropping all existing tables...")
        # Since we are using SQLAlchemy ORM, we can rely on metadata to drop all
        # But if there are extensions, etc., this only drops known tables.
        
        # To handle CASCADE drops safely in Postgres:
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        
        print("Re-creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        
    print("✓ Database cleared and tables re-created successfully!")

if __name__ == "__main__":
    asyncio.run(reset_db())
