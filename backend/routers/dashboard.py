"""
backend/routers/dashboard.py
Dashboard & System Analytics Router.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.database import get_db
from backend.models import Student, Club, Application, Membership, Event, EventRegistration, Badge
from backend.schemas import PublicStatsResponse, StudentDashboardStats
from backend.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/public",
    response_model=PublicStatsResponse,
    summary="Platform-wide public metrics"
)
def get_public_stats(db: Session = Depends(get_db)):
    total_clubs = db.query(Club).count()
    total_students = db.query(Student).count()
    total_events = db.query(Event).count()
    total_memberships = db.query(Membership).count()

    return PublicStatsResponse(
        total_clubs=total_clubs,
        total_students=total_students,
        total_events=total_events,
        total_memberships=total_memberships
    )


@router.get(
    "/student",
    response_model=StudentDashboardStats,
    summary="Student command center analytics"
)
def get_student_dashboard_stats(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uid = current_user.id
    total_apps = db.query(Application).filter(Application.student_id == uid).count()
    pending = db.query(Application).filter(Application.student_id == uid, Application.status == "Pending").count()
    approved = db.query(Application).filter(Application.student_id == uid, Application.status == "Approved").count()
    rejected = db.query(Application).filter(Application.student_id == uid, Application.status == "Rejected").count()

    clubs_joined = db.query(Membership).filter(Membership.student_id == uid).count()
    passes = db.query(EventRegistration).filter(EventRegistration.student_id == uid).count()
    badges = db.query(Badge).filter(Badge.student_id == uid).count()

    return StudentDashboardStats(
        total_applications=total_apps,
        pending_applications=pending,
        approved_applications=approved,
        rejected_applications=rejected,
        clubs_joined=clubs_joined,
        event_passes=passes,
        badges_count=badges
    )


@router.get(
    "/coordinator-clubs",
    summary="Get clubs coordinated or managed by current user"
)
def get_coordinated_clubs(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        clubs = db.query(Club).all()
    else:
        # Include clubs where current_user is coordinator OR an active member
        member_club_ids = [m.club_id for m in db.query(Membership.club_id).filter(Membership.student_id == current_user.id).all()]
        clubs = db.query(Club).filter(
            or_(
                Club.coordinator_id == current_user.id,
                Club.id.in_(member_club_ids) if member_club_ids else False
            )
        ).all()

        # If user has coordinator or admin role and has no clubs assigned yet, allow managing all campus societies:
        if not clubs and current_user.role in ("coordinator", "admin"):
            clubs = db.query(Club).all()

    result = []
    for c in clubs:
        pending_requests = db.query(Application).filter(
            Application.club_id == c.id,
            Application.status == "Pending"
        ).count()
        member_count = db.query(Membership).filter(Membership.club_id == c.id).count()
        events_count = db.query(Event).filter(Event.club_id == c.id).count()

        result.append({
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "recruitment_open": c.recruitment_open,
            "pending_requests": pending_requests,
            "member_count": member_count,
            "events_count": events_count
        })

    return result
