"""
backend/routers/students.py
Student Management Router.
Tags: Students, Memberships
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Student, Membership, Application
from backend.schemas import (
    StudentResponse,
    MembershipResponse,
    ApplicationResponse
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "/me/memberships",
    response_model=List[MembershipResponse],
    summary="View clubs joined by logged-in student",
    description="Returns all active club memberships for the currently authenticated student."
)
def get_my_memberships(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = (
        db.query(Membership)
        .options(joinedload(Membership.club))
        .filter(Membership.student_id == current_user.id)
        .order_by(Membership.joined_at.desc())
        .all()
    )
    return memberships


@router.get(
    "/me/applications",
    response_model=List[ApplicationResponse],
    summary="View applications submitted by logged-in student",
    description="Returns all club membership applications submitted by the current student along with live status."
)
def get_my_applications(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applications = (
        db.query(Application)
        .options(joinedload(Application.club))
        .filter(Application.student_id == current_user.id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    return applications


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Get student details by ID",
    description="Allowed for the student themselves, club coordinators, or administrators."
)
def get_student_by_id(
    student_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow the user themselves, or coordinator/admin
    if current_user.id != student_id and current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view other students' profiles."
        )

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
    return student

