import asyncio
import bcrypt
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import User, RoleEnum

def hash_password(password: str) -> str:
    # Hash a password for the first time
    # (Using bcrypt, the salt is saved into the hash itself)
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_superadmin():
    print("Seed Super Admin Script Started...")
    
    admin_email = "admin@wizex.com"
    admin_name = "WizeX Admin"
    admin_password = "WizeXAdmin@0808"
    
    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(select(User).where(User.email == admin_email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"Super admin with email {admin_email} already exists.")
            # Optionally update password? Let's just update it and role to be safe
            existing_user.hashed_password = hash_password(admin_password)
            existing_user.role = RoleEnum.SUPERADMIN
            existing_user.name = admin_name
            await session.commit()
            print("Updated existing user to SUPERADMIN and reset password.")
            return

        # Create new superadmin
        hashed_password = hash_password(admin_password)
        
        new_admin = User(
            email=admin_email,
            name=admin_name,
            hashed_password=hashed_password,
            role=RoleEnum.SUPERADMIN,
            hospital_id=None  # Global superadmins don't need a specific hospital
        )
        
        session.add(new_admin)
        await session.commit()
        
        print(f"Successfully created Super Admin!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")

if __name__ == "__main__":
    asyncio.run(seed_superadmin())
