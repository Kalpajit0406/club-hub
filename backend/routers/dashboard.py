"""
backend/routers/dashboard.py
Role-Specific Dashboard Analytics Router.
Tags: Dashboard
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import Student, Club, Application, Membership, Event
from backend.schemas import (
    StudentDashboardStats,
    CoordinatorDashboardStats,
    AdminDashboardStats
)
from backend.dependencies import (
    get_current_user,
    require_coordinator_or_admin,
    require_admin
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/student",
    response_model=StudentDashboardStats,
    summary="Student command center analytics",
    description="Returns aggregate counts of applications (total, pending, shortlisted, approved, rejected) and clubs joined by the logged-in student."
)
def get_student_dashboard_stats(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    total_apps = db.query(Application).filter(Application.student_id == user_id).count()
    pending_apps = db.query(Application).filter(Application.student_id == user_id, Application.status == "Pending").count()
    shortlisted_apps = db.query(Application).filter(Application.student_id == user_id, Application.status == "Shortlisted").count()
    approved_apps = db.query(Application).filter(Application.student_id == user_id, Application.status == "Approved").count()
    rejected_apps = db.query(Application).filter(Application.student_id == user_id, Application.status == "Rejected").count()

    clubs_joined = db.query(Membership).filter(Membership.student_id == user_id).count()

    return StudentDashboardStats(
        total_applications=total_apps,
        pending_applications=pending_apps,
        shortlisted_applications=shortlisted_apps,
        approved_applications=approved_apps,
        rejected_applications=rejected_apps,
        clubs_joined=clubs_joined
    )


@router.get(
    "/coordinator",
    response_model=CoordinatorDashboardStats,
    summary="Club coordinator operations analytics",
    description="Returns metrics for all clubs coordinated by the current user: applications received, member count, and upcoming events."
)
def get_coordinator_dashboard_stats(
    current_user: Student = Depends(require_coordinator_or_admin),
    db: Session = Depends(get_db)
):
    # Coordinated clubs query
    if current_user.role == "admin":
        coordinated_club_ids = [c.id for c in db.query(Club.id).all()]
    else:
        coordinated_club_ids = [c.id for c in db.query(Club.id).filter(Club.coordinator_id == current_user.id).all()]

    if not coordinated_club_ids:
        return CoordinatorDashboardStats(
            coordinated_clubs_count=0,
            total_applications_received=0,
            pending_applications=0,
            shortlisted_applications=0,
            approved_applications=0,
            rejected_applications=0,
            total_members=0,
            upcoming_events=0
        )

    total_apps = db.query(Application).filter(Application.club_id.in_(coordinated_club_ids)).count()
    pending_apps = db.query(Application).filter(Application.club_id.in_(coordinated_club_ids), Application.status == "Pending").count()
    shortlisted_apps = db.query(Application).filter(Application.club_id.in_(coordinated_club_ids), Application.status == "Shortlisted").count()
    approved_apps = db.query(Application).filter(Application.club_id.in_(coordinated_club_ids), Application.status == "Approved").count()
    rejected_apps = db.query(Application).filter(Application.club_id.in_(coordinated_club_ids), Application.status == "Rejected").count()

    total_members = db.query(Membership).filter(Membership.club_id.in_(coordinated_club_ids)).count()
    upcoming_events = db.query(Event).filter(
        Event.club_id.in_(coordinated_club_ids),
        Event.event_date >= datetime.utcnow()
    ).count()

    return CoordinatorDashboardStats(
        coordinated_clubs_count=len(coordinated_club_ids),
        total_applications_received=total_apps,
        pending_applications=pending_apps,
        shortlisted_applications=shortlisted_apps,
        approved_applications=approved_apps,
        rejected_applications=rejected_apps,
        total_members=total_members,
        upcoming_events=upcoming_events
    )


@router.get(
    "/admin",
    response_model=AdminDashboardStats,
    summary="Platform-wide administrator overview",
    description="High-level campus metrics across all students, coordinators, clubs, applications, memberships, and events."
)
def get_admin_dashboard_stats(
    current_user: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_students = db.query(Student).filter(Student.role == "student").count()
    total_coordinators = db.query(Student).filter(Student.role == "coordinator").count()
    total_admins = db.query(Student).filter(Student.role == "admin").count()

    total_clubs = db.query(Club).count()
    total_apps = db.query(Application).count()
    total_memberships = db.query(Membership).count()
    total_events = db.query(Event).count()

    return AdminDashboardStats(
        total_students=total_students,
        total_coordinators=total_coordinators,
        total_admins=total_admins,
        total_clubs=total_clubs,
        total_applications=total_apps,
        total_memberships=total_memberships,
        total_events=total_events
    )

