import asyncio
import uuid
from datetime import datetime
from sqlalchemy import select
from app.database import engine, Base, AsyncSessionLocal
from app.models import User, Hospital, Patient, Template, Document, RoleEnum, DocumentStatusEnum

# Static UUIDs for consistency
NAMESPACE_WIZESIGN = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

def get_uuid(name):
    return uuid.uuid5(NAMESPACE_WIZESIGN, name)

# Mapping user's IDs to UUIDs
H_DEMO_ID = get_uuid('h_demo')

async def seed_data():
    print("Beginning database seed...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Hospital
        hospital = Hospital(
            id=H_DEMO_ID,
            name='Demo Hospital',
            status='ACTIVE',
            subscription_tier='ENTERPRISE'
        )
        db.add(hospital)
        
        # 2. Users
        users = []
        
        # Admin
        admin = User(
            id=get_uuid('admin1'),
            name='WizeX Admin',
            email='admin@wizex.com',
            role=RoleEnum.SUPERADMIN,
            hospital_id=None, # Superadmin has no specific hospital (or could be linked to one)
            hashed_password='WizeXAdmin@0808' # Hash this in real app
        )
        users.append(admin)
        
        # Doctors
        doctor_data = [
            ('d1', 'Dr. Sarah Jenkins', 'sarah@demo.com', 'Senior General Physician', 'General Physician'),
            ('d2', 'Dr. Michael Chen', 'michael@demo.com', 'Head of Cardiology', 'Cardiologist'),
            ('d3', 'Dr. Emily Carter', 'emily@demo.com', 'Consultant Dermatologist', 'Dermatologist'),
        ]
        
        for doc_id, name, email, pos, spec in doctor_data:
            doc = User(
                id=get_uuid(doc_id),
                name=name,
                email=email,
                role=RoleEnum.DOCTOR,
                hospital_id=H_DEMO_ID,
                position=pos,
                specialty=spec,
                hashed_password='password'
            )
            users.append(doc)
            
        db.add_all(users)
        await db.commit()
        
        # 3. Templates
        templates = [
            Template(
                id=get_uuid('t_gen_consent'),
                name="General Consent Form",
                file_url="https://example.com/consent.pdf",
                category="General",
                hospital_id=H_DEMO_ID,
                created_by_id=get_uuid('d1')
            ),
            Template(
                id=get_uuid('t_surgery'),
                name="Surgical Consent",
                file_url="https://example.com/surgery.pdf",
                category="Surgery",
                hospital_id=H_DEMO_ID,
                created_by_id=get_uuid('d2')
            )
        ]
        db.add_all(templates)
        await db.commit()
        
        # 4. Patients (Batch of 50 for demo)
        print("Generating patients...")
        patients = []
        for i in range(50):
            p_id = f'p{i+1}'
            patient = Patient(
                id=get_uuid(p_id),
                external_id=p_id,
                registration_number=f"P24-{i+1:05d}",
                full_name=f"Patient {i+1}",
                email=f"patient{i+1}@example.com",
                phone=f"555-00{i:02d}",
                hospital_id=H_DEMO_ID,
                gender="M" if i % 2 == 0 else "F",
                age=25 + (i % 50)
            )
            patients.append(patient)
        
        db.add_all(patients)
        await db.commit()
        
        print("Seed completed successfully!")
        print(f"Hospital ID: {H_DEMO_ID}")
        print(f"Admin ID: {get_uuid('admin1')}")

if __name__ == "__main__":
    asyncio.run(seed_data())
