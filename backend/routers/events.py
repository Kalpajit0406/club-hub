"""
backend/routers/events.py
Event Management Router.
Tags: Events
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.database import get_db
from backend.models import Event, Club, Student
from backend.schemas import (
    EventCreate,
    EventUpdate,
    EventResponse,
    MessageResponse
)
from backend.dependencies import (
    get_current_user,
    require_coordinator_or_admin
)

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=List[EventResponse],
    summary="View all upcoming events",
    description="Public list of upcoming campus club events and workshops. Supports search, date sorting, and pagination."
)
def get_all_events(
    search: Optional[str] = Query(None, description="Search keyword in title, description, or location"),
    club_id: Optional[int] = Query(None, description="Filter events by club ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Event).options(joinedload(Event.club))

    if club_id:
        query = query.filter(Event.club_id == club_id)

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
    return events


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="View event details",
    description="Returns full information about a specific event, including hosting club details."
)
def get_event_by_id(
    event_id: int,
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
    return event


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event",
    description="Schedules a new club event. Only the relevant club coordinator or an administrator can create events."
)
def create_event(
    payload: EventCreate,
    current_user: Student = Depends(require_coordinator_or_admin),
    db: Session = Depends(get_db)
):
    club = db.query(Club).filter(Club.id == payload.club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID {payload.club_id} not found."
        )

    # Coordinators can only schedule events for their own club
    if current_user.role == "coordinator" and club.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can schedule events for clubs assigned to you only."
        )

    new_event = Event(
        club_id=payload.club_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        event_date=payload.event_date,
        location=payload.location.strip(),
        created_at=datetime.utcnow()
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.patch(
    "/{event_id}",
    response_model=EventResponse,
    summary="Update an event",
    description="Modifies an existing event. Only the assigned club coordinator or an administrator can update."
)
def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: Student = Depends(require_coordinator_or_admin),
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

    # Authorization
    if current_user.role == "coordinator":
        if not event.club or event.club.coordinator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only modify events for clubs you coordinate."
            )

    if payload.title is not None:
        event.title = payload.title.strip()
    if payload.description is not None:
        event.description = payload.description.strip()
    if payload.event_date is not None:
        event.event_date = payload.event_date
    if payload.location is not None:
        event.location = payload.location.strip()

    db.commit()
    db.refresh(event)
    return event


@router.delete(
    "/{event_id}",
    response_model=MessageResponse,
    summary="Delete an event",
    description="Permanently deletes an event. Permitted only for the assigned coordinator or admin."
)
def delete_event(
    event_id: int,
    current_user: Student = Depends(require_coordinator_or_admin),
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

    if current_user.role == "coordinator":
        if not event.club or event.club.coordinator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete events for clubs you coordinate."
            )

    event_title = event.title
    db.delete(event)
    db.commit()

    return MessageResponse(
        message=f"Event '{event_title}' (ID: {event_id}) has been successfully deleted."
    )

