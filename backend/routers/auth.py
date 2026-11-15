"""
backend/routers/auth.py
Authentication Router for Student Registration, Login, and Profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Student, Club, Application
from backend.schemas import (
    StudentRegister,
    StudentLogin,
    StudentResponse,
    Token
)
from backend.auth import (
    get_password_hash,
    verify_password,
    create_access_token
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student or club admin account"
)
def register_student(
    payload: StudentRegister,
    db: Session = Depends(get_db)
):
    email_clean = payload.email.lower().strip()
    existing_user = db.query(Student).filter(Student.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    # Determine assigned role: "coordinator" (Club Admin) or "student" (Default)
    assigned_role = "coordinator" if payload.role == "coordinator" else "student"
    hashed_pwd = get_password_hash(payload.password)

    new_student = Student(
        full_name=payload.full_name.strip(),
        email=email_clean,
        password_hash=hashed_pwd,
        department=payload.department.strip(),
        year=payload.year if payload.year is not None else 1,
        role=assigned_role
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    access_token = create_access_token(
        data={
            "sub": str(new_student.id),
            "email": new_student.email,
            "role": new_student.role
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=StudentResponse.model_validate(new_student)
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Sign in with email and password"
)
def login_student(
    credentials: StudentLogin,
    db: Session = Depends(get_db)
):
    email_clean = credentials.email.lower().strip()
    student = db.query(Student).filter(Student.email == email_clean).first()

    if not student or not verify_password(credentials.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={
            "sub": str(student.id),
            "email": student.email,
            "role": student.role
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=StudentResponse.model_validate(student)
    )


@router.get(
    "/me",
    response_model=StudentResponse,
    summary="Get current user profile"
)
def get_current_user_profile(
    current_user: Student = Depends(get_current_user)
):
    return current_user
