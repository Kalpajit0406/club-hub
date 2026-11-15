"""
backend/schemas.py
Pydantic Data Validation, Request Schemas, and Response Serializers for ClubHub.
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
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    department: str = Field(..., min_length=2, max_length=100)
    year: Optional[int] = Field(default=1, ge=1, le=5)
    avatar_url: Optional[str] = None


class StudentRegister(StudentBase):
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = Field(default="student", pattern="^(student|coordinator)$")


class StudentLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    section: Optional[str] = None  # "student" or "admin"


class StudentResponse(StudentBase):
    id: int
    role: str
    created_at: datetime
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    year: Optional[int] = Field(None, ge=1, le=5)
    avatar_url: Optional[str] = None


class StudentRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(student|coordinator|admin)$")


class CoordinatorCreate(StudentBase):
    password: str = Field(..., min_length=6)


class ClubAssignCoordinator(BaseModel):
    coordinator_id: int


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
    name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5)
    category: str = Field(..., min_length=2, max_length=100)
    image_url: Optional[str] = None


class ClubCreate(ClubBase):
    recruitment_open: bool = True


class ClubUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=5)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    image_url: Optional[str] = None
    recruitment_open: Optional[bool] = None


class ClubRecruitmentToggle(BaseModel):
    recruitment_open: bool


class ClubResponse(ClubBase):
    id: int
    coordinator_id: Optional[int] = None
    recruitment_open: bool
    created_at: datetime
    coordinator: Optional[StudentResponse] = None
    member_count: Optional[int] = 0
    user_status: Optional[str] = None  # "none", "pending", "member", "rejected", "admin"

    model_config = ConfigDict(from_attributes=True)


class ClubMemberCountResponse(BaseModel):
    club_id: int
    club_name: str
    member_count: int


# ============================================================
# APPLICATION / JOIN REQUEST SCHEMAS
# ============================================================

class ApplicationCreate(BaseModel):
    club_id: int
    reason_for_joining: Optional[str] = "Interested in contributing to the society"
    skills: Optional[str] = "General"


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Approved|Rejected)$")


class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    club_id: int
    reason_for_joining: Optional[str] = ""
    skills: Optional[str] = ""
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
    joined_at: datetime
    student: Optional[StudentResponse] = None
    club: Optional[ClubResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# EVENT SCHEMAS
# ============================================================

class EventBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=5)
    category: str = Field("Workshop", max_length=100)
    event_date: datetime
    location: str = Field(..., min_length=2, max_length=200)
    banner_url: Optional[str] = None


class EventCreate(EventBase):
    club_id: int


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, min_length=5)
    category: Optional[str] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    banner_url: Optional[str] = None


class EventResponse(EventBase):
    id: int
    club_id: int
    created_at: datetime
    club: Optional[ClubResponse] = None
    is_registered: Optional[bool] = False
    pass_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EventRegistrationResponse(BaseModel):
    id: int
    event_id: int
    student_id: int
    pass_code: str
    registered_at: datetime
    event: Optional[EventResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# NETWORK / COLLAB FEED SCHEMAS
# ============================================================

class NetworkPostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=5)
    tag: str = Field("#CampusLife", max_length=50)


class NetworkPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    content: Optional[str] = Field(None, min_length=5)
    tag: Optional[str] = Field(None, max_length=50)


class NetworkCommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class NetworkCommentResponse(BaseModel):
    id: int
    post_id: int
    student_id: int
    content: str
    created_at: datetime
    author: Optional[StudentResponse] = None

    model_config = ConfigDict(from_attributes=True)


class NetworkPostResponse(BaseModel):
    id: int
    student_id: int
    title: str
    content: str
    tag: str
    upvotes_count: int
    created_at: datetime
    author: Optional[StudentResponse] = None
    comments_count: Optional[int] = 0
    has_upvoted: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# BADGE SCHEMAS
# ============================================================

class BadgeCreate(BaseModel):
    student_id: int
    club_id: Optional[int] = None
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)


class BadgeResponse(BaseModel):
    id: int
    student_id: int
    club_id: Optional[int] = None
    title: str
    description: str
    issuer_name: str
    hash_id: str
    issued_at: datetime
    student: Optional[StudentResponse] = None
    club: Optional[ClubResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# DASHBOARD & PUBLIC STATS SCHEMAS
# ============================================================

class PublicStatsResponse(BaseModel):
    total_clubs: int
    total_students: int
    total_events: int
    total_memberships: int


class StudentDashboardStats(BaseModel):
    total_applications: int
    pending_applications: int
    approved_applications: int
    rejected_applications: int
    clubs_joined: int
    event_passes: int
    badges_count: int


class AdminDashboardStats(BaseModel):
    total_students: int
    total_coordinators: int
    total_admins: int
    total_clubs: int
    total_applications: int
    total_memberships: int
    total_events: int
