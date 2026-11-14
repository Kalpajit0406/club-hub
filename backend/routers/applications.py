"""
backend/routers/applications.py
Club Membership Applications Router.
Tags: Applications
"""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Application, Club, Student, Membership
from backend.schemas import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ApplicationResponse
)
from backend.dependencies import get_current_user, require_coordinator_or_admin

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a club membership application",
    description="Submits an application to join a club. Enforces recruitment open check, duplicate prevention, and initial 'Pending' status."
)
def submit_application(
    payload: ApplicationCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify club exists
    club = db.query(Club).filter(Club.id == payload.club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {payload.club_id} not found."
        )

    # 2. Check if recruitment is open
    if not club.recruitment_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recruitment for '{club.name}' is currently closed."
        )

    # 3. Check for existing membership
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

    # 4. Check for duplicate application
    existing_app = (
        db.query(Application)
        .filter(Application.student_id == current_user.id, Application.club_id == payload.club_id)
        .first()
    )
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already submitted an application to '{club.name}'. Duplicate applications are not permitted."
        )

    # 5. Create application with initial 'Pending' status
    new_application = Application(
        student_id=current_user.id,
        club_id=payload.club_id,
        reason_for_joining=payload.reason_for_joining.strip(),
        skills=payload.skills.strip(),
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
    summary="View applications of the logged-in student",
    description="Returns all club applications submitted by the current authenticated student with live status."
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
    "/{application_id}",
    response_model=ApplicationResponse,
    summary="View application details",
    description="Accessible by the applicant student, the club's coordinator, or an administrator."
)
def get_application_by_id(
    application_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = (
        db.query(Application)
        .options(joinedload(Application.student), joinedload(Application.club))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found."
        )

    # Authorization Check
    is_applicant = (application.student_id == current_user.id)
    is_coordinator = (
        current_user.role == "coordinator" and
        application.club and
        application.club.coordinator_id == current_user.id
    )
    is_admin = (current_user.role == "admin")

    if not (is_applicant or is_coordinator or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this application."
        )

    return application


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Update application status (Review)",
    description="Updates status (Pending, Shortlisted, Approved, Rejected). When approved, a Membership record is automatically created in a safe transaction."
)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    current_user: Student = Depends(require_coordinator_or_admin),
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
            detail=f"Application with ID {application_id} not found."
        )

    # Coordinators can review applications for their own clubs only
    if current_user.role == "coordinator":
        if not application.club or application.club.coordinator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are only authorized to review applications for clubs you coordinate."
            )

    new_status = payload.status
    old_status = application.status

    # Safe Transactional Execution
    try:
        application.status = new_status
        application.updated_at = datetime.utcnow()

        if new_status == "Approved":
            # Check if membership already exists
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
            # Rejection must never create a membership; if it was previously approved, revoke membership
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
            detail=f"Database transaction error while updating application: {str(e)}"
        )

