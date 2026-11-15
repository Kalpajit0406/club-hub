"""
backend/routers/clubs.py
Club Management Router.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

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
    get_optional_current_user,
    require_coordinator_or_admin,
    require_admin
)

router = APIRouter(prefix="/clubs", tags=["Clubs"])


@router.get(
    "",
    response_model=List[ClubResponse],
    summary="Retrieve all clubs"
)
def get_all_clubs(
    category: Optional[str] = Query(None, description="Filter by category"),
    recruitment_open: Optional[bool] = Query(None, description="Filter by recruitment availability"),
    search: Optional[str] = Query(None, description="Search keyword in name or description"),
    sort: Optional[str] = Query("RECOMMENDED", description="Sort order"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: Optional[Student] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Club).options(joinedload(Club.coordinator))

    if category and category.upper() != "ALL":
        query = query.filter(Club.category.ilike(f"%{category.strip()}%"))
    if recruitment_open is not None:
        query = query.filter(Club.recruitment_open == recruitment_open)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Club.name.ilike(search_pattern),
                Club.description.ilike(search_pattern),
                Club.category.ilike(search_pattern)
            )
        )

    # Sorting
    if sort == "NAME_ASC":
        query = query.order_by(Club.name.asc())
    elif sort == "NAME_DESC":
        query = query.order_by(Club.name.desc())
    elif sort == "NEWEST":
        query = query.order_by(Club.created_at.desc())
    else:
        query = query.order_by(Club.name.asc())

    clubs = query.offset(skip).limit(limit).all()

    # Pre-fetch user's memberships and applications if logged in
    user_memberships = set()
    user_applications = {}
    if current_user:
        memberships = db.query(Membership.club_id).filter(Membership.student_id == current_user.id).all()
        user_memberships = {m[0] for m in memberships}
        apps = db.query(Application).filter(Application.student_id == current_user.id).all()
        user_applications = {a.club_id: a.status for a in apps}

    result = []
    for club in clubs:
        count = db.query(Membership).filter(Membership.club_id == club.id).count()
        club_data = ClubResponse.model_validate(club)
        club_data.member_count = count

        if current_user:
            if club.coordinator_id == current_user.id or current_user.role == "admin":
                club_data.user_status = "admin"
            elif club.id in user_memberships:
                club_data.user_status = "member"
            elif club.id in user_applications:
                status_lower = user_applications[club.id].lower()
                club_data.user_status = status_lower  # "pending" or "rejected"
            else:
                club_data.user_status = "none"
        else:
            club_data.user_status = "none"

        result.append(club_data)

    if sort == "MEMBERS_DESC":
        result.sort(key=lambda c: c.member_count or 0, reverse=True)

    return result


@router.get(
    "/{club_id}",
    response_model=ClubResponse,
    summary="Retrieve one club by ID"
)
def get_club_by_id(
    club_id: int,
    current_user: Optional[Student] = Depends(get_optional_current_user),
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

    count = db.query(Membership).filter(Membership.club_id == club.id).count()
    resp = ClubResponse.model_validate(club)
    resp.member_count = count

    if current_user:
        if club.coordinator_id == current_user.id or current_user.role == "admin":
            resp.user_status = "admin"
        else:
            is_member = db.query(Membership).filter(
                Membership.club_id == club.id,
                Membership.student_id == current_user.id
            ).first()
            if is_member:
                resp.user_status = "member"
            else:
                app = db.query(Application).filter(
                    Application.club_id == club.id,
                    Application.student_id == current_user.id
                ).first()
                if app:
                    resp.user_status = app.status.lower()
                else:
                    resp.user_status = "none"
    else:
        resp.user_status = "none"

    return resp


@router.post(
    "",
    response_model=ClubResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new club"
)
def create_club(
    payload: ClubCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check for name uniqueness
    existing = db.query(Club).filter(Club.name.ilike(payload.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A club named '{payload.name}' already exists."
        )

    new_club = Club(
        name=payload.name.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        image_url=payload.image_url,
        coordinator_id=current_user.id,
        recruitment_open=payload.recruitment_open,
        created_at=datetime.utcnow()
    )

    db.add(new_club)
    db.commit()
    db.refresh(new_club)

    # Promote user role to coordinator if currently standard student
    if current_user.role == "student":
        current_user.role = "coordinator"
        db.commit()

    # Automatically add creator as a member of the club
    membership = Membership(
        student_id=current_user.id,
        club_id=new_club.id,
        joined_at=datetime.utcnow()
    )
    db.add(membership)
    db.commit()

    new_club.coordinator = current_user
    resp = ClubResponse.model_validate(new_club)
    resp.member_count = 1
    resp.user_status = "admin"
    return resp


@router.patch(
    "/{club_id}",
    response_model=ClubResponse,
    summary="Update club details"
)
def update_club(
    club_id: int,
    payload: ClubUpdate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    # Authorization: Only club coordinator or admin
    if club.coordinator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only authorized to manage clubs you coordinate."
        )

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

    db.commit()
    db.refresh(club)

    count = db.query(Membership).filter(Membership.club_id == club.id).count()
    resp = ClubResponse.model_validate(club)
    resp.member_count = count
    resp.user_status = "admin"
    return resp


@router.patch(
    "/{club_id}/recruitment",
    response_model=ClubResponse,
    summary="Open or close recruitment"
)
def toggle_club_recruitment(
    club_id: int,
    payload: ClubRecruitmentToggle,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    is_coord = club.coordinator_id == current_user.id
    is_admin = current_user.role in ("admin", "coordinator")
    is_member = (
        db.query(Membership)
        .filter(Membership.club_id == club_id, Membership.student_id == current_user.id)
        .first() is not None
    )

    if not (is_coord or is_admin or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only toggle recruitment for clubs you coordinate or belong to."
        )

    club.recruitment_open = payload.recruitment_open
    db.commit()
    db.refresh(club)

    count = db.query(Membership).filter(Membership.club_id == club.id).count()
    resp = ClubResponse.model_validate(club)
    resp.member_count = count
    resp.user_status = "admin"
    return resp


@router.get(
    "/{club_id}/members",
    response_model=List[MembershipResponse],
    summary="View club members list"
)
def get_club_members(
    club_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    is_coord = club.coordinator_id == current_user.id
    is_admin = current_user.role in ("admin", "coordinator")
    is_member = (
        db.query(Membership)
        .filter(Membership.club_id == club_id, Membership.student_id == current_user.id)
        .first() is not None
    )

    if not (is_coord or is_admin or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view members of clubs you coordinate or belong to."
        )

    members = (
        db.query(Membership)
        .options(joinedload(Membership.student))
        .filter(Membership.club_id == club_id)
        .order_by(Membership.joined_at.desc())
        .all()
    )
    return members


@router.get(
    "/{club_id}/requests",
    response_model=List[ApplicationResponse],
    summary="View pending join requests for a club"
)
def get_club_requests(
    club_id: int,
    status_filter: Optional[str] = Query(None, description="Optional status: Pending, Approved, Rejected"),
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    # Enforce club admin / coordinator / member access
    is_coord = club.coordinator_id == current_user.id
    is_admin = current_user.role in ("admin", "coordinator")
    is_member = (
        db.query(Membership)
        .filter(Membership.club_id == club_id, Membership.student_id == current_user.id)
        .first() is not None
    )

    if not (is_coord or is_admin or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or members of this club can view its join requests."
        )

    query = (
        db.query(Application)
        .options(joinedload(Application.student), joinedload(Application.club))
        .filter(Application.club_id == club_id)
    )

    if isinstance(status_filter, str) and status_filter.strip():
        query = query.filter(Application.status == status_filter.strip())

    applications = query.order_by(Application.applied_at.desc()).all()
    return applications


@router.delete(
    "/{club_id}",
    response_model=MessageResponse,
    summary="Delete a club"
)
def delete_club(
    club_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {club_id} not found."
        )

    if club.coordinator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the coordinator of this club or a site admin can delete it."
        )

    name = club.name
    db.delete(club)
    db.commit()
    return MessageResponse(message=f"Club '{name}' has been successfully deleted.")
