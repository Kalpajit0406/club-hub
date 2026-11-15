"""
backend/routers/applications.py
Club Join Requests & Applications Router.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Application, Club, Student, Membership
from backend.schemas import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ApplicationResponse
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a club join request"
)
def submit_join_request(
    payload: ApplicationCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == payload.club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {payload.club_id} not found."
        )

    if not club.recruitment_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recruitment for '{club.name}' is currently closed."
        )

    # Check for existing membership
    existing_member = (
        db.query(Membership)
        .filter(Membership.student_id == current_user.id, Membership.club_id == payload.club_id)
        .first()
    )
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are already an active member of '{club.name}'."
        )

    # Check for existing application
    existing_app = (
        db.query(Application)
        .filter(Application.student_id == current_user.id, Application.club_id == payload.club_id)
        .first()
    )
    if existing_app:
        if existing_app.status == "Pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You already have a pending join request for '{club.name}'."
            )
        elif existing_app.status == "Approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Your membership request for '{club.name}' is already approved."
            )
        elif existing_app.status == "Rejected":
            # Allow re-requesting after rejection
            existing_app.status = "Pending"
            existing_app.reason_for_joining = (payload.reason_for_joining or "").strip()
            existing_app.skills = (payload.skills or "").strip()
            existing_app.applied_at = datetime.utcnow()
            existing_app.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_app)
            return existing_app

    new_application = Application(
        student_id=current_user.id,
        club_id=payload.club_id,
        reason_for_joining=(payload.reason_for_joining or "").strip(),
        skills=(payload.skills or "").strip(),
        status="Pending",
        applied_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application


@router.get(
    "/my",
    response_model=List[ApplicationResponse],
    summary="View current user's join requests"
)
def get_my_applications(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applications = (
        db.query(Application)
        .options(joinedload(Application.club), joinedload(Application.student))
        .filter(Application.student_id == current_user.id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    return applications


@router.get(
    "/incoming",
    response_model=List[ApplicationResponse],
    summary="Get incoming join requests for club admins"
)
def get_incoming_applications(
    club_id: Optional[int] = Query(None, description="Filter by specific club ID"),
    status_filter: Optional[str] = Query(None, description="Filter by status: Pending, Approved, Rejected"),
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # RBAC: Only Club Admins or Site Administrators can access incoming join requests
    if current_user.role not in ("coordinator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Club Admins or Platform Administrators can view incoming join requests."
        )

    query = (
        db.query(Application)
        .options(joinedload(Application.student), joinedload(Application.club))
    )

    if club_id is not None:
        query = query.filter(Application.club_id == club_id)

    if status_filter and status_filter.strip():
        query = query.filter(Application.status == status_filter.strip())

    return query.order_by(Application.applied_at.desc()).all()


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Approve or Reject a join request"
)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = (
        db.query(Application)
        .options(joinedload(Application.club), joinedload(Application.student))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Join request with ID {application_id} not found."
        )

    # Authorization Check: Strictly Club Admins (coordinators) or site administrators
    if current_user.role not in ("coordinator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Club Admins or Platform Administrators can approve or reject join requests."
        )

    new_status = payload.status
    try:
        application.status = new_status
        application.updated_at = datetime.utcnow()

        if new_status == "Approved":
            existing_membership = (
                db.query(Membership)
                .filter(
                    Membership.student_id == application.student_id,
                    Membership.club_id == application.club_id
                )
                .first()
            )
            if not existing_membership:
                membership = Membership(
                    student_id=application.student_id,
                    club_id=application.club_id,
                    application_id=application.id,
                    joined_at=datetime.utcnow()
                )
                db.add(membership)
        elif new_status == "Rejected":
            existing_membership = (
                db.query(Membership)
                .filter(
                    Membership.student_id == application.student_id,
                    Membership.club_id == application.club_id
                )
                .first()
            )
            if existing_membership:
                db.delete(existing_membership)

        db.commit()
        db.refresh(application)
        return application

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while updating join request: {str(e)}"
        )
