"""
backend/schemas.py
Pydantic Data Validation, Request Schemas, and Response Serializers for ClubClash.
Uses Pydantic v2 conventions.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============================================================
# GENERIC & BASE SCHEMAS
# ============================================================

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


# ============================================================
# AUTHENTICATION & STUDENT SCHEMAS
# ============================================================

class StudentBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, json_schema_extra={"example": "Aditya Verma"})
    email: EmailStr = Field(..., json_schema_extra={"example": "aditya@tint.edu.in"})
    department: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "Computer Science & Engineering"})
    year: int = Field(..., ge=1, le=5, json_schema_extra={"example": 3})


class StudentRegister(StudentBase):
    """
    Public student registration.
    Notice: role is intentionally excluded so users cannot grant themselves
    elevated permissions (Coordinator / Admin) during public sign up.
    """
    password: str = Field(..., min_length=6, max_length=100, json_schema_extra={"example": "SecurePass123!"})


class StudentLogin(BaseModel):
    email: EmailStr = Field(..., json_schema_extra={"example": "aditya@tint.edu.in"})
    password: str = Field(..., min_length=1, json_schema_extra={"example": "SecurePass123!"})


class StudentResponse(StudentBase):
    id: int
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(student|coordinator|admin)$", json_schema_extra={"example": "coordinator"})


class CoordinatorCreate(StudentBase):
    """
    Admin-only schema for creating a designated coordinator account.
    """
    password: str = Field(..., min_length=6, json_schema_extra={"example": "CoordinatorPass123!"})


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: StudentResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


# ============================================================
# CLUB SCHEMAS
# ============================================================

class ClubBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, json_schema_extra={"example": "Google Developer Student Club (GDSC)"})
    description: str = Field(..., min_length=10, json_schema_extra={"example": "Campus tech community focusing on Android, Cloud, and Web technologies."})
    category: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "Technical"})
    image_url: Optional[str] = Field(None, json_schema_extra={"example": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"})


class ClubCreate(ClubBase):
    coordinator_id: Optional[int] = Field(None, json_schema_extra={"example": 2})
    recruitment_open: bool = Field(True, json_schema_extra={"example": True})


class ClubUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    image_url: Optional[str] = None
    coordinator_id: Optional[int] = None
    recruitment_open: Optional[bool] = None


class ClubRecruitmentToggle(BaseModel):
    recruitment_open: bool = Field(..., json_schema_extra={"example": True})


class ClubAssignCoordinator(BaseModel):
    coordinator_id: int = Field(..., json_schema_extra={"example": 2})


class ClubResponse(ClubBase):
    id: int
    coordinator_id: Optional[int] = None
    recruitment_open: bool
    created_at: datetime
    coordinator: Optional[StudentResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ClubMemberCountResponse(BaseModel):
    club_id: int
    club_name: str
    member_count: int


# ============================================================
# APPLICATION SCHEMAS
# ============================================================

class ApplicationCreate(BaseModel):
    club_id: int = Field(..., json_schema_extra={"example": 1})
    reason_for_joining: str = Field(..., min_length=10, json_schema_extra={"example": "I am passionate about building AI and web applications and want to contribute to college projects."})
    skills: str = Field(..., min_length=2, json_schema_extra={"example": "Python, FastAPI, React, Git, Cloud"})


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Pending|Shortlisted|Approved|Rejected)$", json_schema_extra={"example": "Approved"})


class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    club_id: int
    reason_for_joining: str
    skills: str
    status: str
    applied_at: datetime
    updated_at: datetime
    student: Optional[StudentResponse] = None
    club: Optional[ClubResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# MEMBERSHIP SCHEMAS
# ============================================================

class MembershipResponse(BaseModel):
    id: int
    student_id: int
    club_id: int
    application_id: Optional[int] = None
    joined_at: datetime
    student: Optional[StudentResponse] = None
    club: Optional[ClubResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# EVENT SCHEMAS
# ============================================================

class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, json_schema_extra={"example": "HackTINT 2026: 36-Hour National Hackathon"})
    description: str = Field(..., min_length=10, json_schema_extra={"example": "Annual inter-college hackathon with ₹1.5L prize pool, mentor workshops, and recruiter screening."})
    event_date: datetime = Field(..., json_schema_extra={"example": "2026-03-20T10:00:00"})
    location: str = Field(..., min_length=2, max_length=200, json_schema_extra={"example": "Main Auditorium, Ground Floor"})


class EventCreate(EventBase):
    club_id: int = Field(..., json_schema_extra={"example": 1})


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    event_date: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=2, max_length=200)


class EventResponse(EventBase):
    id: int
    club_id: int
    created_at: datetime
    club: Optional[ClubResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ANNOUNCEMENT SCHEMAS
# ============================================================

class AnnouncementCreate(BaseModel):
    club_id: int = Field(..., json_schema_extra={"example": 1})
    title: str = Field(..., min_length=3, max_length=200, json_schema_extra={"example": "Orientation Session Schedule Announced"})
    message: str = Field(..., min_length=5, json_schema_extra={"example": "Welcome meeting for newly inducted members this Friday at 4 PM in Seminar Hall 1."})


class AnnouncementResponse(BaseModel):
    id: int
    club_id: int
    title: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# DASHBOARD STATS SCHEMAS
# ============================================================

class StudentDashboardStats(BaseModel):
    total_applications: int
    pending_applications: int
    shortlisted_applications: int
    approved_applications: int
    rejected_applications: int
    clubs_joined: int


class CoordinatorDashboardStats(BaseModel):
    coordinated_clubs_count: int
    total_applications_received: int
    pending_applications: int
    shortlisted_applications: int
    approved_applications: int
    rejected_applications: int
    total_members: int
    upcoming_events: int


class AdminDashboardStats(BaseModel):
    total_students: int
    total_coordinators: int
    total_admins: int
    total_clubs: int
    total_applications: int
    total_memberships: int
    total_events: int
