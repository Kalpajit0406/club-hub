"""
backend/routers/students.py
Student Profile & My Clubs Router.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Student, Club, Membership, Application
from backend.schemas import (
    StudentResponse,
    StudentProfileUpdate,
    MembershipResponse,
    ApplicationResponse,
    MessageResponse
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "/profile",
    response_model=StudentResponse,
    summary="Get current user's profile information"
)
def get_current_profile(current_user: Student = Depends(get_current_user)):
    return current_user


@router.patch(
    "/profile",
    response_model=StudentResponse,
    summary="Update current user's profile information"
)
def update_profile(
    payload: StudentProfileUpdate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows authenticated students and club admins to update their own profile:
    - full_name
    - email (validating uniqueness across other accounts)
    - department
    - year
    - avatar_url (or remove avatar by setting to empty string / None)
    Role changes are strictly forbidden.
    """
    if payload.email and payload.email.lower() != current_user.email.lower():
        existing_email = db.query(Student).filter(
            Student.email == payload.email.lower(),
            Student.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The email address '{payload.email}' is already associated with another account."
            )
        current_user.email = payload.email.lower()

    if payload.full_name is not None and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()

    if payload.department is not None and payload.department.strip():
        current_user.department = payload.department.strip()

    if payload.year is not None:
        current_user.year = payload.year

    if payload.avatar_url is not None:
        # If empty string was passed, user wants to remove profile picture
        current_user.avatar_url = payload.avatar_url.strip() if payload.avatar_url.strip() else None

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get(
    "/my-clubs",
    summary="Get current user's club memberships and join requests"
)
def get_my_clubs(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Memberships
    memberships = (
        db.query(Membership)
        .options(joinedload(Membership.club))
        .filter(Membership.student_id == current_user.id)
        .all()
    )
    memberships_list = []
    for m in memberships:
        if m.club:
            memberships_list.append({
                "membership_id": m.id,
                "club_id": m.club.id,
                "club_name": m.club.name,
                "club_category": m.club.category,
                "club_image": m.club.image_url,
                "joined_at": m.joined_at.isoformat()
            })

    # 2. Coordinated Clubs
    coordinated = db.query(Club).filter(Club.coordinator_id == current_user.id).all()
    coordinated_list = []
    for c in coordinated:
        pending_count = db.query(Application).filter(
            Application.club_id == c.id,
            Application.status == "Pending"
        ).count()
        members_count = db.query(Membership).filter(Membership.club_id == c.id).count()
        coordinated_list.append({
            "club_id": c.id,
            "club_name": c.name,
            "club_category": c.category,
            "pending_requests": pending_count,
            "member_count": members_count
        })

    # 3. All Join Requests submitted by this student
    requests = (
        db.query(Application)
        .options(joinedload(Application.club))
        .filter(Application.student_id == current_user.id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    pending_list = []
    rejected_list = []
    approved_list = []
    all_requests_list = []

    for r in requests:
        if r.club:
            data = {
                "application_id": r.id,
                "club_id": r.club.id,
                "club_name": r.club.name,
                "club_category": r.club.category,
                "club_image": r.club.image_url,
                "reason_for_joining": r.reason_for_joining or "",
                "skills": r.skills or "",
                "status": r.status,
                "applied_at": r.applied_at.isoformat(),
                "updated_at": r.updated_at.isoformat() if r.updated_at else r.applied_at.isoformat()
            }
            all_requests_list.append(data)
            if r.status == "Pending":
                pending_list.append(data)
            elif r.status == "Rejected":
                rejected_list.append(data)
            elif r.status == "Approved":
                approved_list.append(data)

    return {
        "memberships": memberships_list,
        "coordinated": coordinated_list,
        "pending_requests": pending_list,
        "rejected_requests": rejected_list,
        "approved_requests": approved_list,
        "all_requests": all_requests_list
    }
