import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == 'admin@wizex.com'))
        user = result.scalar_one_or_none()
        if user:
            print(f"User found: {user.email}")
            print(f"Role: {user.role}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check())
