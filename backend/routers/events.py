"""
backend/routers/events.py
Event Management and Digital Pass Ticketing Router.
"""

from typing import List, Optional
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.database import get_db
from backend.models import Event, Club, Student, EventRegistration
from backend.schemas import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventRegistrationResponse,
    MessageResponse
)
from backend.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=List[EventResponse],
    summary="View all events"
)
def get_all_events(
    search: Optional[str] = Query(None, description="Search keyword in title, description, or location"),
    category: Optional[str] = Query(None, description="Category filter"),
    club_id: Optional[int] = Query(None, description="Filter events by club ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: Optional[Student] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Event).options(joinedload(Event.club))

    if club_id:
        query = query.filter(Event.club_id == club_id)

    if category and category.lower() != "all":
        query = query.filter(Event.category.ilike(f"%{category.strip()}%"))

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Event.title.ilike(pattern),
                Event.description.ilike(pattern),
                Event.location.ilike(pattern)
            )
        )

    events = query.order_by(Event.event_date.asc()).offset(skip).limit(limit).all()

    # Pre-fetch user registrations if authenticated
    user_registrations = {}
    if current_user:
        regs = db.query(EventRegistration).filter(EventRegistration.student_id == current_user.id).all()
        user_registrations = {r.event_id: r.pass_code for r in regs}

    result = []
    for ev in events:
        ev_data = EventResponse.model_validate(ev)
        if current_user and ev.id in user_registrations:
            ev_data.is_registered = True
            ev_data.pass_code = user_registrations[ev.id]
        else:
            ev_data.is_registered = False
            ev_data.pass_code = None
        result.append(ev_data)

    return result


@router.get(
    "/my-registrations",
    response_model=List[EventRegistrationResponse],
    summary="View current user's registered event passes"
)
def get_my_event_registrations(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    registrations = (
        db.query(EventRegistration)
        .options(joinedload(EventRegistration.event).joinedload(Event.club))
        .filter(EventRegistration.student_id == current_user.id)
        .order_by(EventRegistration.registered_at.desc())
        .all()
    )
    return registrations


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="View event details"
)
def get_event_by_id(
    event_id: int,
    current_user: Optional[Student] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    event = (
        db.query(Event)
        .options(joinedload(Event.club))
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )

    resp = EventResponse.model_validate(event)
    if current_user:
        reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.student_id == current_user.id
        ).first()
        if reg:
            resp.is_registered = True
            resp.pass_code = reg.pass_code
    return resp


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event"
)
def create_event(
    payload: EventCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == payload.club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {payload.club_id} not found."
        )

    # Authorization: Coordinator of this specific club or site admin
    if club.coordinator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can schedule events for clubs you coordinate only."
        )

    new_event = Event(
        club_id=payload.club_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category.strip() if payload.category else "Workshop",
        event_date=payload.event_date,
        location=payload.location.strip(),
        banner_url=payload.banner_url,
        created_at=datetime.utcnow()
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.post(
    "/{event_id}/register",
    response_model=EventRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for an event and generate digital pass"
)
def register_for_event(
    event_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).options(joinedload(Event.club)).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )

    existing_reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.student_id == current_user.id
    ).first()
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already registered for this event."
        )

    # Generate unique digital pass code (e.g. PASS-8492-EVT-01)
    unique_suffix = uuid.uuid4().hex[:6].upper()
    pass_code = f"PASS-{unique_suffix}-EVT-{event.id}"

    new_reg = EventRegistration(
        event_id=event.id,
        student_id=current_user.id,
        pass_code=pass_code,
        registered_at=datetime.utcnow()
    )

    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)

    return new_reg


@router.delete(
    "/{event_id}",
    response_model=MessageResponse,
    summary="Delete an event"
)
def delete_event(
    event_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = (
        db.query(Event)
        .options(joinedload(Event.club))
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found."
        )

    if event.club and event.club.coordinator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete events for clubs you coordinate."
        )

    title = event.title
    db.delete(event)
    db.commit()

    return MessageResponse(message=f"Event '{title}' has been successfully deleted.")
