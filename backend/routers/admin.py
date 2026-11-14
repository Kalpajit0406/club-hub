"""
backend/routers/admin.py
University Secretariat and System Administration Router.
Tags: Admin
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.database import get_db
from backend.models import Student, Club, Application, Membership, Event
from backend.schemas import (
    StudentResponse,
    StudentRoleUpdate,
    CoordinatorCreate,
    ClubResponse,
    ClubAssignCoordinator,
    ApplicationResponse,
    MembershipResponse,
    AdminDashboardStats,
    MessageResponse
)
from backend.auth import get_password_hash
from backend.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/students",
    response_model=List[StudentResponse],
    summary="View all registered students and staff",
    description="Lists all users in the system. Supports filtering by role (student, coordinator, admin), department, and search."
)
def get_all_students(
    role: Optional[str] = Query(None, description="Filter by role: student, coordinator, admin"),
    department: Optional[str] = Query(None, description="Filter by academic department"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_admin: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    if role:
        query = query.filter(Student.role == role.strip().lower())
    if department:
        query = query.filter(Student.department.ilike(f"%{department.strip()}%"))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.full_name.ilike(pattern),
                Student.email.ilike(pattern)
            )
        )

    students = query.order_by(Student.id.asc()).offset(skip).limit(limit).all()
    return students


@router.patch(
    "/students/{student_id}/role",
    response_model=StudentResponse,
    summary="Update a user's role",
    description="Elevates or demotes a user's role to 'student', 'coordinator', or 'admin'. Strictly admin only."
)
def update_user_role(
    student_id: int,
    payload: StudentRoleUpdate,
    current_admin: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {student_id} not found."
        )

    # Protect against self-demoting the sole primary admin
    if student.id == current_admin.id and payload.role != "admin":
        admin_count = db.query(Student).filter(Student.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the only remaining administrator."
            )

    student.role = payload.role
    db.commit()
    db.refresh(student)
    return student


@router.post(
    "/coordinators",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a coordinator account directly",
    description="Administrative provision of a verified club coordinator account."
)
def create_coordinator_account(
    payload: CoordinatorCreate,
    current_admin: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Student).filter(Student.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A user with email '{payload.email}' already exists."
        )

    hashed_pwd = get_password_hash(payload.password)
    coordinator = Student(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hashed_pwd,
        department=payload.department.strip(),
        year=payload.year,
        role="coordinator"
    )

    db.add(coordinator)
    db.commit()
    db.refresh(coordinator)
    return coordinator


@router.patch(
    "/clubs/{club_id}/coordinator",
    response_model=ClubResponse,
    summary="Assign or reassign club coordinator",
    description="Assigns a designated coordinator (by student ID) to lead a specific club."
)
def assign_club_coordinator(
    club_id: int,
    payload: ClubAssignCoordinator,
    current_admin: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    coordinator = db.query(Student).filter(Student.id == payload.coordinator_id).first()
    if not coordinator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student/Coordinator with ID {payload.coordinator_id} not found."
        )

    # Ensure the user has at least coordinator role
    if coordinator.role == "student":
        coordinator.role = "coordinator"

    club.coordinator_id = coordinator.id
    db.commit()
    db.refresh(club)
    return club


@router.get(
    "/applications",
    response_model=List[ApplicationResponse],
    summary="View all applications across all clubs",
    description="Administrative overview of every membership application submitted in the university."
)
def get_all_applications_admin(
    status_filter: Optional[str] = Query(None, description="Filter: Pending, Shortlisted, Approved, Rejected"),
    club_id: Optional[int] = Query(None, description="Filter by club ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_admin: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Application)
        .options(joinedload(Application.student), joinedload(Application.club))
    )

    if status_filter:
        query = query.filter(Application.status == status_filter.strip())
    if club_id:
        query = query.filter(Application.club_id == club_id)

    applications = query.order_by(Application.applied_at.desc()).offset(skip).limit(limit).all()
    return applications


@router.get(
    "/memberships",
    response_model=List[MembershipResponse],
    summary="View all memberships across all clubs",
    description="Global roster of all student club memberships."
)
def get_all_memberships_admin(
    club_id: Optional[int] = Query(None, description="Filter by club ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_admin: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Membership)
        .options(joinedload(Membership.student), joinedload(Membership.club))
    )

    if club_id:
        query = query.filter(Membership.club_id == club_id)

    memberships = query.order_by(Membership.joined_at.desc()).offset(skip).limit(limit).all()
    return memberships


@router.get(
    "/stats",
    response_model=AdminDashboardStats,
    summary="Platform-wide administrative statistics",
    description="Global telemetry on total student count, clubs, applications, and events."
)
def get_admin_stats(
    current_admin: Student = Depends(require_admin),
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

