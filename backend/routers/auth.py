"""
backend/routers/auth.py
Authentication Router for Student Registration, Login, and Current Profile.
Tags: Authentication
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Student
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
    summary="Register a new student account",
    description="Registers a new student user. Role is strictly assigned as 'student' to prevent privilege escalation."
)
def register_student(
    payload: StudentRegister,
    db: Session = Depends(get_db)
):
    # Check if email is already registered
    existing_user = db.query(Student).filter(Student.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A student with this email address already exists."
        )

    # Hash the password
    hashed_pwd = get_password_hash(payload.password)

    # Create new student record with explicit role='student'
    new_student = Student(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hashed_pwd,
        department=payload.department.strip(),
        year=payload.year,
        role="student"
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Generate JWT access token
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
    summary="Sign in with email and password",
    description="Authenticates a user via JSON payload (email and password) and returns a signed JWT access token."
)
def login_student(
    credentials: StudentLogin,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.email == credentials.email.lower().strip()).first()
    if not student or not verify_password(credentials.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
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


@router.post(
    "/token",
    response_model=Token,
    summary="OAuth2 Form sign in (for Swagger UI /docs)",
    description="Standard OAuth2 form-urlencoded login endpoint to allow authorization directly from the Swagger UI documentation."
)
def login_for_swagger_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # In OAuth2PasswordRequestForm, 'username' holds the user's email
    student = db.query(Student).filter(Student.email == form_data.username.lower().strip()).first()
    if not student or not verify_password(form_data.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username (email) or password.",
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
    summary="Get current user profile",
    description="Retrieves the profile of the currently logged-in student, coordinator, or admin."
)
def get_current_user_profile(
    current_user: Student = Depends(get_current_user)
):
    return current_user

