"""
backend/dependencies.py
FastAPI Dependencies for Database Sessions, JWT Authentication, and Role-Based Authorization.
"""

from typing import List, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from backend.database import get_db
from backend.models import Student
from backend.auth import decode_access_token

# OAuth2 token URL for Swagger UI authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Student:
    """
    Validates the Bearer JWT token from the Authorization header,
    decodes the subject (student_id), and returns the active Student entity from the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    student = db.query(Student).filter(Student.id == user_id).first()
    if student is None:
        raise credentials_exception

    return student


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[Student]:
    """
    Optionally returns the active Student if a valid Bearer token is provided.
    Does not raise 401 if token is absent or invalid.
    """
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
        return db.query(Student).filter(Student.id == user_id).first()
    except Exception:
        return None


def require_roles(*allowed_roles: str) -> Callable[[Student], Student]:
    """
    Role-Based Access Control (RBAC) dependency factory.
    """
    def role_checker(current_user: Student = Depends(get_current_user)) -> Student:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles: {list(allowed_roles)}. Your role is '{current_user.role}'."
            )
        return current_user

    return role_checker


require_admin = require_roles("admin")
require_coordinator = require_roles("coordinator")
require_coordinator_or_admin = require_roles("coordinator", "admin")
require_any_student = require_roles("student", "coordinator", "admin")
