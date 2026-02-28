#!/bin/bash
docker compose -f docker-compose.prod.yml exec backend python seed_superadmin.py
