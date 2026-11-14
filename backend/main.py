"""
backend/main.py
FastAPI Application Entry Point for ClubClash (CampusConnect).
Integrates modular routers, database initialization, CORS, and OpenAPI documentation.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

# Load environment configuration
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from backend.database import init_db, get_db
from backend.seed import seed_data
from backend.routers import (
    auth,
    students,
    clubs,
    applications,
    events,
    dashboard,
    admin
)

# Parse CORS Origins from environment
raw_cors = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5500,http://127.0.0.1:5500,https://club-hub-inky.vercel.app"
)
origins = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]


# Lifespan Context Manager for Startup & Shutdown Events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema is created and initial seed runs
    print("[STARTUP] Initializing ClubClash Database...")
    init_db()
    try:
        seed_data()
    except Exception as e:
        print(f"[STARTUP WARNING] Automatic seed failed or was skipped: {e}")
    print("[STARTUP] ClubClash Backend Ready.")
    yield
    # Shutdown
    print("[SHUTDOWN] ClubClash Backend Shutting Down.")


# FastAPI Application Definition with Comprehensive Swagger OpenAPI metadata
app = FastAPI(
    title="ClubClash (CampusConnect) API",
    version="1.0.0",
    description="""
## 🎓 Welcome to the ClubClash Smart Campus Backend API!

ClubClash is a unified university platform where students can:
* 🔍 **Discover & Explore Clubs**: Filter by category, view coordinator contacts, and check recruitment status.
* 📝 **Apply for Membership**: Submit applications with skills and motivations with duplicate prevention.
* 🎫 **Participate in Club Events**: View schedules and details for campus hackathons and workshops.
* 📊 **Role-Based Command Centers**: Dedicated dashboards for **Students**, **Club Coordinators**, and **Secretariat Admins**.

### 🔒 Authentication & Authorization
Uses standard **JWT (Bearer Token)** authentication with **bcrypt** password hashing.
* **Student Role**: Access public club discovery, submit applications, view joined memberships.
* **Coordinator Role**: Manage assigned clubs, review applicant submissions, schedule club events.
* **Admin Role**: Platform oversight, create coordinators, assign club leads, and overall analytics.

### 📚 Interactive Documentation
* Swagger UI: `/docs`
* ReDoc UI: `/redoc`
* OpenAPI Schema: `/openapi.json`
    """,
    openapi_tags=[
        {"name": "Authentication", "description": "Student registration, JWT token generation, and current profile"},
        {"name": "Students", "description": "Student profiles, personal memberships, and submitted applications"},
        {"name": "Clubs", "description": "Public club catalog, search, recruitment management, and member rosters"},
        {"name": "Applications", "description": "Club membership applications, duplicate checks, and coordinator review workflows"},
        {"name": "Events", "description": "Campus events, hackathons, codelabs, and workshop management"},
        {"name": "Dashboard", "description": "Role-specific statistical analytics for students, coordinators, and admins"},
        {"name": "Admin", "description": "University Secretariat commands: user roles, coordinator provisioning, and system analytics"},
    ],
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(clubs.router)
app.include_router(applications.router)
app.include_router(events.router)
app.include_router(dashboard.router)
app.include_router(admin.router)


# Root Health & Welcome Endpoints
@app.get(
    "/",
    tags=["General"],
    summary="Root welcome endpoint",
    description="Returns platform health, version metadata, and links to interactive API documentation."
)
def root():
    return {
        "platform": "ClubClash (CampusConnect) API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "redoc": "/redoc",
        "supported_roles": ["student", "coordinator", "admin"]
    }


@app.get(
    "/health",
    tags=["General"],
    summary="Health check endpoint",
    description="Validates active database connection and system operational status."
)
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected (SQLite)",
            "api_version": "1.0.0"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database_error": str(e)
            }
        )

