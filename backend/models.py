"""
backend/models.py
SQLAlchemy Database Models for ClubHub.
Defines Students, Clubs, Applications, Memberships, Events, EventRegistrations,
NetworkPosts, NetworkComments, and Badges.
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
      - admin: University Secretariat / Site Super Admin
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
    registrations = relationship("EventRegistration", back_populates="student", cascade="all, delete-orphan")
    posts = relationship("NetworkPost", back_populates="author", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="student", cascade="all, delete-orphan")


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
    badges = relationship("Badge", back_populates="club", cascade="all, delete-orphan")


class Application(Base):
    """
    Application / Join Request Entity submitted by students to join a club.
    Statuses: Pending, Approved, Rejected.
    Enforces uniqueness: a student can have at most one application per club.
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    reason_for_joining = Column(Text, nullable=True, default="")
    skills = Column(Text, nullable=True, default="")
    status = Column(String(50), default="Pending", nullable=False)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "club_id", name="uq_student_club_application"),
    )

    # Relationships
    student = relationship("Student", back_populates="applications")
    club = relationship("Club", back_populates="applications")
    membership = relationship("Membership", back_populates="application", uselist=False)


class Membership(Base):
    """
    Membership Entity created when a club join request is Approved.
    """
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "club_id", name="uq_student_club_membership"),
    )

    # Relationships
    student = relationship("Student", back_populates="memberships")
    club = relationship("Club", back_populates="memberships")
    application = relationship("Application", back_populates="membership")


class Event(Base):
    """
    Campus Event / Tech Fest Entity organized and hosted by clubs.
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="Workshop")
    event_date = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=False)
    banner_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    club = relationship("Club", back_populates="events")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")


class EventRegistration(Base):
    """
    Event Registration record linking a student to an event with a verifiable pass code.
    """
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    pass_code = Column(String(100), unique=True, index=True, nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "event_id", name="uq_student_event_registration"),
    )

    # Relationships
    event = relationship("Event", back_populates="registrations")
    student = relationship("Student", back_populates="registrations")


class NetworkPost(Base):
    """
    Collab Feed / Discussion Post.
    """
    __tablename__ = "network_posts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    tag = Column(String(50), nullable=False, default="#CampusLife")
    upvotes_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    author = relationship("Student", back_populates="posts")
    upvotes = relationship("NetworkPostUpvote", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("NetworkComment", back_populates="post", cascade="all, delete-orphan")


class NetworkPostUpvote(Base):
    """
    Records student upvotes on network posts.
    """
    __tablename__ = "network_post_upvotes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("network_posts.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("post_id", "student_id", name="uq_post_student_upvote"),
    )

    # Relationships
    post = relationship("NetworkPost", back_populates="upvotes")


class NetworkComment(Base):
    """
    Comments on Collab Feed Posts.
    """
    __tablename__ = "network_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("network_posts.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("NetworkPost", back_populates="comments")
    author = relationship("Student")


class Badge(Base):
    """
    Verifiable Digital Badge Entity.
    """
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    issuer_name = Column(String(150), nullable=False)
    hash_id = Column(String(100), unique=True, index=True, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="badges")
    club = relationship("Club", back_populates="badges")
