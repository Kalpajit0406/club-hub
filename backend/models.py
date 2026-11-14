"""
backend/models.py
SQLAlchemy Database Models for ClubClash.
Defines Students, Clubs, Applications, Memberships, Events, and Announcements.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.database import Base


class Student(Base):
    """
    Student User Entity.
    Roles:
      - student: Standard student user
      - coordinator: Club student lead / manager
      - admin: University Secretariat / System Admin
    """
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    role = Column(String(50), nullable=False, default="student")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    coordinated_clubs = relationship("Club", back_populates="coordinator")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="student", cascade="all, delete-orphan")


class Club(Base):
    """
    Club Entity representing university societies, technical cells, and chapters.
    """
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    image_url = Column(String(500), nullable=True)
    coordinator_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    recruitment_open = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    coordinator = relationship("Student", back_populates="coordinated_clubs")
    applications = relationship("Application", back_populates="club", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="club", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="club", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="club", cascade="all, delete-orphan")


class Application(Base):
    """
    Application Entity submitted by students to join a club.
    Statuses: Pending, Shortlisted, Approved, Rejected.
    Enforces uniqueness: a student can have at most one application per club.
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    reason_for_joining = Column(Text, nullable=False)
    skills = Column(Text, nullable=False)
    status = Column(String(50), default="Pending", nullable=False)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Uniqueness constraint: prevents duplicate applications from same student to same club
    __table_args__ = (
        UniqueConstraint("student_id", "club_id", name="uq_student_club_application"),
    )

    # Relationships
    student = relationship("Student", back_populates="applications")
    club = relationship("Club", back_populates="applications")
    membership = relationship("Membership", back_populates="application", uselist=False)


class Membership(Base):
    """
    Membership Entity created when a club application is Approved.
    Enforces uniqueness: prevents duplicate memberships for the same student in the same club.
    """
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Uniqueness constraint: prevents duplicate memberships
    __table_args__ = (
        UniqueConstraint("student_id", "club_id", name="uq_student_club_membership"),
    )

    # Relationships
    student = relationship("Student", back_populates="memberships")
    club = relationship("Club", back_populates="memberships")
    application = relationship("Application", back_populates="membership")


class Event(Base):
    """
    Event Entity organized and hosted by clubs.
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    event_date = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    club = relationship("Club", back_populates="events")


class Announcement(Base):
    """
    Club Announcement / Broadcast Entity.
    """
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    club = relationship("Club", back_populates="announcements")

