"""
backend/routers/students.py
Student Profile & My Clubs Router.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Student, Club, Membership, Application
from backend.schemas import StudentResponse, MembershipResponse, ApplicationResponse
from backend.dependencies import get_current_user

router = APIRouter(prefix="/students", tags=["Students"])


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

    # 3. Pending & Rejected Requests
    requests = (
        db.query(Application)
        .options(joinedload(Application.club))
        .filter(Application.student_id == current_user.id)
        .all()
    )
    pending_list = []
    rejected_list = []
    for r in requests:
        if r.club:
            data = {
                "application_id": r.id,
                "club_id": r.club.id,
                "club_name": r.club.name,
                "club_category": r.club.category,
                "status": r.status,
                "applied_at": r.applied_at.isoformat()
            }
            if r.status == "Pending":
                pending_list.append(data)
            elif r.status == "Rejected":
                rejected_list.append(data)

    return {
        "memberships": memberships_list,
        "coordinated": coordinated_list,
        "pending_requests": pending_list,
        "rejected_requests": rejected_list
    }
