import asyncio
import bcrypt
import uuid
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import User, RoleEnum, Hospital, Patient

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_test_data():
    print("Seeding Test Data for Local Development...")
    
    # 1. Setup Demo Hospital
    demo_hospital_name = "Demo Hospital"
    async with AsyncSessionLocal() as session:
        # Check if Demo Hospital exists
        result = await session.execute(select(Hospital).where(Hospital.name == demo_hospital_name))
        hospital = result.scalar_one_or_none()
        
        if not hospital:
            hospital = Hospital(
                name=demo_hospital_name,
                status="ACTIVE",
                subscription_tier="ENTERPRISE"
            )
            session.add(hospital)
            await session.commit()
            await session.refresh(hospital)
            print(f"✅ Created Hospital: {hospital.name} (ID: {hospital.id})")
        else:
            print(f"ℹ️ Hospital '{hospital.name}' already exists.")

        # 2. Setup Test Doctor
        doctor_email = "mockuser@wizex.com"
        doctor_name = "Dr. Sarah Jenkins"
        doctor_password = "password"
        
        result = await session.execute(select(User).where(User.email == doctor_email))
        doctor = result.scalar_one_or_none()
        
        if not doctor:
            hashed_password = hash_password(doctor_password)
            doctor = User(
                email=doctor_email,
                name=doctor_name,
                hashed_password=hashed_password,
                role=RoleEnum.DOCTOR,
                hospital_id=hospital.id,
                qualification="MBBS, MD",
                position="Senior Physician",
                specialty="General Medicine"
            )
            session.add(doctor)
            await session.commit()
            await session.refresh(doctor)
            print(f"✅ Created Doctor: {doctor.name} ({doctor.email})")
            print(f"   Password: {doctor_password}")
        else:
            print(f"ℹ️ Doctor '{doctor.email}' already exists.")

        # 3. Setup Test Patient (with external_id="p_test" to match SSO mock)
        test_patient_external_id = "p_test"
        
        result = await session.execute(
            select(Patient).where(
                (Patient.external_id == test_patient_external_id) & 
                (Patient.hospital_id == hospital.id)
            )
        )
        patient = result.scalar_one_or_none()
        
        if not patient:
            patient = Patient(
                external_id=test_patient_external_id,
                hospital_id=hospital.id,
                full_name="Test Patient",
                email="test.patient@example.com",
                phone="+919539170177",
                dob="1996-01-15",
                registration_number="P_TEST",
                age=30,
                gender="M",
                address="123 Test Street"
            )
            session.add(patient)
            await session.commit()
            await session.refresh(patient)
            print(f"✅ Created Test Patient: {patient.full_name} (External WizeFlow ID: {patient.external_id})")
        else:
            print(f"ℹ️ Test Patient '{patient.full_name}' already exists.")

if __name__ == "__main__":
    asyncio.run(seed_test_data())
