"""
backend/routers/badges.py
Verifiable Digital Badges Router.
"""

from typing import List
from datetime import datetime
import hashlib
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Badge, Club, Student
from backend.schemas import BadgeCreate, BadgeResponse
from backend.dependencies import get_current_user

router = APIRouter(prefix="/badges", tags=["Badges"])


@router.get(
    "/my",
    response_model=List[BadgeResponse],
    summary="Get badges of logged-in student"
)
def get_my_badges(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    badges = (
        db.query(Badge)
        .options(joinedload(Badge.club))
        .filter(Badge.student_id == current_user.id)
        .order_by(Badge.issued_at.desc())
        .all()
    )
    return badges


@router.post(
    "",
    response_model=BadgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue a verifiable badge"
)
def issue_badge(
    payload: BadgeCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recipient = db.query(Student).filter(Student.id == payload.student_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient student not found.")

    club = None
    if payload.club_id:
        club = db.query(Club).filter(Club.id == payload.club_id).first()
        if not club:
            raise HTTPException(status_code=404, detail="Club not found.")
        if club.coordinator_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the coordinator of this club can issue its badges."
            )

    issuer_name = club.name if club else current_user.full_name
    raw_str = f"{recipient.id}-{issuer_name}-{payload.title}-{uuid.uuid4()}"
    hash_id = hashlib.sha256(raw_str.encode()).hexdigest()[:16].upper()

    badge = Badge(
        student_id=recipient.id,
        club_id=club.id if club else None,
        title=payload.title.strip(),
        description=payload.description.strip(),
        issuer_name=issuer_name,
        hash_id=hash_id,
        issued_at=datetime.utcnow()
    )

    db.add(badge)
    db.commit()
    db.refresh(badge)
    return badge
