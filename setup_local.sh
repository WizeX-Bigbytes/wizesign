#!/bin/bash

echo "🚀 Starting Local Development Setup for WizeSign..."

# 1. Start the Docker containers in detached mode
echo "📦 Building and starting Docker containers..."
docker-compose up -d --build

# 2. Wait for the database to be ready
echo "⏳ Waiting for PostgreSQL database to be ready..."
sleep 10 # Adjust if your machine is slower

# 3. Initialize the database schema
echo "🛠️ Initializing the database tables..."
docker-compose exec backend python init_db.py

# 4. Seed test data (Hospital, Test Patient, Test Doctor)
echo "🌱 Seeding initial test data..."
docker-compose exec backend python seed_test_data.py

# 5. Seed Super Admin
echo "👑 Seeding Super Admin..."
docker-compose exec backend python seed_superadmin.py

echo "✅ Setup Complete!"
echo "----------------------------------------"
echo "🌐 Frontend URL: http://localhost:3000"
echo "🔌 Backend API docs: http://localhost:8000/docs"
echo "----------------------------------------"
echo "Logins:"
echo "Super Admin: admin@wizex.com / WizeXAdmin@0808"
echo "Test Doctor: mockuser@wizex.com / password"
