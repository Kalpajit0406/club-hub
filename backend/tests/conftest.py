"""
backend/tests/conftest.py
Pytest Configuration and Fixtures for ClubClash.
Uses an isolated in-memory SQLite database for test execution with dependency overrides.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from backend.database import Base, get_db
from backend.main import app
from backend.models import Student, Club, Event, Application, Membership
from backend.auth import get_password_hash, create_access_token

# In-memory SQLite database configured for thread-safe testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)


@pytest.fixture(scope="function")
def db_session():
    """
    Creates fresh database tables before each test and drops them cleanly afterward.
    """
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI TestClient with overridden get_db dependency pointing to the test database.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seed_users(db_session):
    """
    Seeds a student, coordinator, and admin into the test database
    and returns them alongside valid JWT bearer tokens.
    """
    # 1. Student
    student = Student(
        full_name="Test Student",
        email="student@tint.edu.in",
        password_hash=get_password_hash("student123"),
        department="Computer Science",
        year=2,
        role="student"
    )
    db_session.add(student)

    # 2. Coordinator
    coordinator = Student(
        full_name="Test Coordinator",
        email="coord@tint.edu.in",
        password_hash=get_password_hash("coord123"),
        department="Information Tech",
        year=4,
        role="coordinator"
    )
    db_session.add(coordinator)

    # 3. Admin
    admin = Student(
        full_name="Test Admin",
        email="admin@tint.edu.in",
        password_hash=get_password_hash("admin123"),
        department="Secretariat",
        year=5,
        role="admin"
    )
    db_session.add(admin)

    db_session.commit()
    db_session.refresh(student)
    db_session.refresh(coordinator)
    db_session.refresh(admin)

    student_token = create_access_token({"sub": str(student.id), "email": student.email, "role": student.role})
    coord_token = create_access_token({"sub": str(coordinator.id), "email": coordinator.email, "role": coordinator.role})
    admin_token = create_access_token({"sub": str(admin.id), "email": admin.email, "role": admin.role})

    return {
        "student": student,
        "coordinator": coordinator,
        "admin": admin,
        "student_headers": {"Authorization": f"Bearer {student_token}"},
        "coord_headers": {"Authorization": f"Bearer {coord_token}"},
        "admin_headers": {"Authorization": f"Bearer {admin_token}"}
    }

