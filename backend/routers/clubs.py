"""
backend/routers/clubs.py
Club Management Router.
Tags: Clubs, Memberships
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.database import get_db
from backend.models import Club, Student, Membership, Application, Event
from backend.schemas import (
    ClubCreate,
    ClubUpdate,
    ClubRecruitmentToggle,
    ClubResponse,
    ClubMemberCountResponse,
    MembershipResponse,
    ApplicationResponse,
    EventResponse,
    MessageResponse
)
from backend.dependencies import (
    get_current_user,
    require_coordinator_or_admin,
    require_admin
)

router = APIRouter(prefix="/clubs", tags=["Clubs"])


# ============================================================
# PUBLIC CLUB DISCOVERY ENDPOINTS
# ============================================================

@router.get(
    "",
    response_model=List[ClubResponse],
    summary="Retrieve all clubs",
    description="Returns a list of all college clubs. Supports filtering by category, recruitment status, search query, and pagination."
)
def get_all_clubs(
    category: Optional[str] = Query(None, description="Filter clubs by category (e.g. Technical, Cultural, Sports)"),
    recruitment_open: Optional[bool] = Query(None, description="Filter by recruitment availability"),
    search: Optional[str] = Query(None, description="Search keyword in club name or description"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    query = db.query(Club).options(joinedload(Club.coordinator))

    if category:
        query = query.filter(Club.category.ilike(f"%{category.strip()}%"))
    if recruitment_open is not None:
        query = query.filter(Club.recruitment_open == recruitment_open)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Club.name.ilike(search_pattern),
                Club.description.ilike(search_pattern)
            )
        )

    clubs = query.order_by(Club.name.asc()).offset(skip).limit(limit).all()
    return clubs


@router.get(
    "/search",
    response_model=List[ClubResponse],
    summary="Search clubs by name or category",
    description="Quick search endpoint for autocomplete and live discovery in the search bar."
)
def search_clubs(
    q: str = Query(..., min_length=1, description="Search query string"),
    db: Session = Depends(get_db)
):
    pattern = f"%{q.strip()}%"
    clubs = (
        db.query(Club)
        .options(joinedload(Club.coordinator))
        .filter(
            or_(
                Club.name.ilike(pattern),
                Club.category.ilike(pattern),
                Club.description.ilike(pattern)
            )
        )
        .order_by(Club.name.asc())
        .limit(25)
        .all()
    )
    return clubs


@router.get(
    "/{club_id}",
    response_model=ClubResponse,
    summary="Retrieve one club by ID",
    description="Returns comprehensive details of a specific club, including coordinator details."
)
def get_club_by_id(
    club_id: int,
    db: Session = Depends(get_db)
):
    club = (
        db.query(Club)
        .options(joinedload(Club.coordinator))
        .filter(Club.id == club_id)
        .first()
    )
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )
    return club


@router.get(
    "/{club_id}/members/count",
    response_model=ClubMemberCountResponse,
    summary="Get membership count of a club",
    description="Public count of approved active student members in a given club."
)
def get_club_members_count(
    club_id: int,
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    count = db.query(Membership).filter(Membership.club_id == club_id).count()
    return ClubMemberCountResponse(
        club_id=club.id,
        club_name=club.name,
        member_count=count
    )


@router.get(
    "/{club_id}/events",
    response_model=List[EventResponse],
    summary="View events of a particular club",
    description="Public list of upcoming and past events hosted by this club."
)
def get_club_events(
    club_id: int,
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    events = (
        db.query(Event)
        .filter(Event.club_id == club_id)
        .order_by(Event.event_date.asc())
        .all()
    )
    return events


# ============================================================
# PROTECTED CLUB MANAGEMENT (COORDINATOR & ADMIN)
# ============================================================

@router.post(
    "",
    response_model=ClubResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new club",
    description="Creates a new club. Restricted to Coordinators and Admins. If created by a coordinator, coordinator_id defaults to the creator."
)
def create_club(
    payload: ClubCreate,
    current_user: Student = Depends(require_coordinator_or_admin),
    db: Session = Depends(get_db)
):
    # Check if a club with this name already exists
    existing = db.query(Club).filter(Club.name.ilike(payload.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A club named '{payload.name}' already exists."
        )

    # Determine coordinator assignment
    coordinator_id = payload.coordinator_id
    if current_user.role == "coordinator":
        # A coordinator automatically owns clubs they create unless admin assigns otherwise
        coordinator_id = current_user.id
    elif coordinator_id:
        # If admin is assigning, verify coordinator exists
        coord = db.query(Student).filter(Student.id == coordinator_id).first()
        if not coord:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assigned coordinator ID {coordinator_id} does not exist."
            )

    new_club = Club(
        name=payload.name.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        image_url=payload.image_url,
        coordinator_id=coordinator_id,
        recruitment_open=payload.recruitment_open
    )

    db.add(new_club)
    db.commit()
    db.refresh(new_club)
    return new_club


@router.patch(
    "/{club_id}",
    response_model=ClubResponse,
    summary="Update club details",
    description="Updates club information. Permitted only for the assigned club coordinator or an administrator."
)
def update_club(
    club_id: int,
    payload: ClubUpdate,
    current_user: Student = Depends(require_coordinator_or_admin),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    # Coordinators can manage only the clubs assigned to them
    if current_user.role == "coordinator" and club.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only authorized to manage clubs assigned to you."
        )

    # Check for name conflict if renaming
    if payload.name and payload.name.strip().lower() != club.name.lower():
        name_exists = db.query(Club).filter(Club.name.ilike(payload.name.strip()), Club.id != club_id).first()
        if name_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A club named '{payload.name}' already exists."
            )
        club.name = payload.name.strip()

    if payload.description is not None:
        club.description = payload.description.strip()
    if payload.category is not None:
        club.category = payload.category.strip()
    if payload.image_url is not None:
        club.image_url = payload.image_url
    if payload.recruitment_open is not None:
        club.recruitment_open = payload.recruitment_open

    # Only admins can reassign coordinator_id
    if payload.coordinator_id is not None:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can reassign club coordinators."
            )
        coord = db.query(Student).filter(Student.id == payload.coordinator_id).first()
        if not coord:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coordinator with ID {payload.coordinator_id} not found."
            )
        club.coordinator_id = payload.coordinator_id

    db.commit()
    db.refresh(club)
    return club


@router.patch(
    "/{club_id}/recruitment",
    response_model=ClubResponse,
    summary="Open or close recruitment",
    description="Toggles the recruitment_open flag for a club. Permitted only for the assigned coordinator or admin."
)
def toggle_club_recruitment(
    club_id: int,
    payload: ClubRecruitmentToggle,
    current_user: Student = Depends(require_coordinator_or_admin),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    if current_user.role == "coordinator" and club.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only authorized to change recruitment status for your assigned club."
        )

    club.recruitment_open = payload.recruitment_open
    db.commit()
    db.refresh(club)
    return club


@router.delete(
    "/{club_id}",
    response_model=MessageResponse,
    summary="Delete a club",
    description="Deletes a club and cascades to applications, memberships, and events. Strictly admin only."
)
def delete_club(
    club_id: int,
    current_user: Student = Depends(require_admin),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    club_name = club.name
    db.delete(club)
    db.commit()
    return MessageResponse(
        message=f"Club '{club_name}' (ID: {club_id}) has been permanently deleted."
    )


@router.get(
    "/{club_id}/members",
    response_model=List[MembershipResponse],
    summary="View club members list",
    description="Returns the full member roster with student information. Accessible only by the club coordinator or an admin."
)
def get_club_members(
    club_id: int,
    current_user: Student = Depends(require_coordinator_or_admin),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    if current_user.role == "coordinator" and club.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only authorized to view members of your assigned club."
        )

    members = (
        db.query(Membership)
        .options(joinedload(Membership.student), joinedload(Membership.club))
        .filter(Membership.club_id == club_id)
        .order_by(Membership.joined_at.desc())
        .all()
    )
    return members


@router.get(
    "/{club_id}/applications",
    response_model=List[ApplicationResponse],
    summary="View applications received by a club",
    description="Returns all student recruitment applications for a club. Accessible only by the club coordinator or admin."
)
def get_club_applications(
    club_id: int,
    status_filter: Optional[str] = Query(None, description="Optional status filter: Pending, Shortlisted, Approved, Rejected"),
    current_user: Student = Depends(require_coordinator_or_admin),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    if current_user.role == "coordinator" and club.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can review applications for your own clubs only."
        )

    query = (
        db.query(Application)
        .options(joinedload(Application.student), joinedload(Application.club))
        .filter(Application.club_id == club_id)
    )

    if status_filter:
        query = query.filter(Application.status == status_filter)

    applications = query.order_by(Application.applied_at.desc()).all()
    return applications

