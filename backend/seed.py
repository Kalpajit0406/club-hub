"""
backend/seed.py
Database Seeding Script for ClubHub.
Populates standard collegiate baseline data idempotently.
"""

from datetime import datetime, timedelta
from backend.database import SessionLocal, init_db
from backend.models import (
    Student,
    Club,
    Membership,
    Event,
    EventRegistration,
    NetworkPost,
    Badge
)
from backend.auth import get_password_hash


def seed_data():
    """
    Seeds initial clubs, events, users, and telemetry records idempotently.
    """
    init_db()
    db = SessionLocal()

    try:
        def get_or_create_student(full_name, email, password, dept, year, role):
            existing = db.query(Student).filter(Student.email == email).first()
            if existing:
                return existing
            st = Student(
                full_name=full_name,
                email=email,
                password_hash=get_password_hash(password),
                department=dept,
                year=year,
                role=role
            )
            db.add(st)
            db.commit()
            db.refresh(st)
            return st

        def get_or_create_club(name, desc, category, img, coord_id, open_rec=True):
            existing = db.query(Club).filter(Club.name == name).first()
            if existing:
                return existing
            c = Club(
                name=name,
                description=desc,
                category=category,
                image_url=img,
                coordinator_id=coord_id,
                recruitment_open=open_rec
            )
            db.add(c)
            db.commit()
            db.refresh(c)
            return c

        print("[SEED] Ensuring collegiate baseline data exists for ClubHub...")

        # 1. Create Core Users
        admin_user = get_or_create_student(
            "Prof. Amitav Roy", "admin@tint.edu.in", "Admin@123", "Computer Science & Engineering", 4, "admin"
        )
        coord_user = get_or_create_student(
            "Priya Sharma", "coord@tint.edu.in", "Coord@123", "Information Technology", 3, "coordinator"
        )
        student_user = get_or_create_student(
            "Rahul Verma", "rahul@tint.edu.in", "Student@123", "Electronics & Communication", 2, "student"
        )
        student_user_2 = get_or_create_student(
            "Ananya Das", "ananya@tint.edu.in", "Student@123", "Computer Science & Engineering", 3, "student"
        )
        aditya_user = get_or_create_student(
            "Aditya Sen", "aditya.cs23@campus.edu", "password123", "Computer Science & Engineering", 3, "student"
        )
        aparna_user = get_or_create_student(
            "Aparna Maity", "aparnamaity2609@gmail.com", "password123", "Computer Science & Engineering", 4, "admin"
        )

        # 2. Create Campus Societies
        c1 = get_or_create_club(
            "Google Developer Student Club",
            "Official Google Developer Student Club campus chapter building cloud, mobile, and web solutions.",
            "Technical",
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
            coord_user.id,
            True
        )
        c2 = get_or_create_club(
            "Turing AI & Data Science Society",
            "Fostering artificial intelligence, computer vision, deep learning, and algorithmic research on campus.",
            "Technical",
            "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
            coord_user.id,
            True
        )
        c3 = get_or_create_club(
            "Robotics & Embedded Systems Club",
            "Building autonomous rovers, combat robots, and IoT micro-controller applications for national robotics championships.",
            "Technical",
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
            coord_user.id,
            True
        )
        c4 = get_or_create_club(
            "E-Cell & Startup Incubator",
            "Campus hub for early-stage founders, startup pitch decks, venture capital networking, and entrepreneurial incubation.",
            "Entrepreneurship",
            "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80",
            coord_user.id,
            True
        )
        c5 = get_or_create_club(
            "CodeChef Campus Chapter",
            "Organizing weekly algorithmic contests, ICPC prep sprints, and dynamic programming bootcamps.",
            "Technical",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
            coord_user.id,
            True
        )
        c6 = get_or_create_club(
            "TINT Cultural & Arts Collective",
            "Acoustic concerts, theatrical dramatics, photography exhibitions, and collegiate festival productions.",
            "Cultural",
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
            coord_user.id,
            False
        )

        # 3. Create Active Memberships
        for s, c in [(coord_user, c1), (student_user, c1), (student_user_2, c1), (coord_user, c2), (student_user, c2), (student_user_2, c3)]:
            existing_m = db.query(Membership).filter(Membership.student_id == s.id, Membership.club_id == c.id).first()
            if not existing_m:
                db.add(Membership(student_id=s.id, club_id=c.id))
        db.commit()

        # 4. Create Campus Events
        now = datetime.utcnow()
        if db.query(Event).count() < 3:
            e1 = Event(
                club_id=c1.id,
                title="HackTINT 2026: 36-Hour National Hackathon",
                description="Annual collegiate hackathon bringing 400+ developers together with ₹2.5L cash prizes and live corporate mentorship.",
                category="Hackathon",
                event_date=now + timedelta(days=14, hours=10),
                location="Main University Auditorium",
                banner_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
            )
            e2 = Event(
                club_id=c3.id,
                title="Autonomous Robowars & Arena Combat",
                description="15kg & 30kg combat robotics championship with custom obstacle arenas and wire-speed telemetry.",
                category="Robotics & Contests",
                event_date=now + timedelta(days=21, hours=14),
                location="Indoor Sports Complex Arena",
                banner_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80"
            )
            e3 = Event(
                club_id=c2.id,
                title="Full-Stack Cloud & FastAPI Workshop",
                description="Hands-on masterclass building enterprise microservices with Python FastAPI, Docker, and PostgreSQL.",
                category="Workshops",
                event_date=now + timedelta(days=7, hours=16),
                location="CS Advanced Computing Lab 3",
                banner_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80"
            )
            db.add_all([e1, e2, e3])
            db.commit()

        # 5. Collab Feed Network Posts
        if db.query(NetworkPost).count() < 2:
            p1 = NetworkPost(
                student_id=student_user.id,
                title="Looking for 2 React & Python teammates for Smart India Hackathon 2026",
                content="Hey everyone! Our team is building an AI-powered smart agriculture IoT pipeline for SIH 2026. Looking for 2 collaborators with frontend or embedded experience.",
                tag="#HackathonTeam",
                upvotes_count=7
            )
            p2 = NetworkPost(
                student_id=coord_user.id,
                title="GDSC Cloud Study Jam starting this Saturday — All departments welcome",
                content="Kickstarting our 4-week cloud computing journey with Google Cloud Skills Boost credits. Free certificate vouchers for all students who complete 3 labs.",
                tag="#Workshops",
                upvotes_count=14
            )
            db.add_all([p1, p2])
            db.commit()

        # 6. Verifiable Badges
        if db.query(Badge).count() < 1:
            b1 = Badge(
                student_id=student_user.id,
                club_id=c1.id,
                title="Certified Cloud Developer",
                description="Awarded for successfully deploying microservices in HackTINT.",
                issuer_name="Google Developer Student Club",
                hash_id="D8A279F13BC0491E"
            )
            db.add(b1)
            db.commit()

        print("[SEED] Successfully verified and seeded ClubHub collegiate baseline data.")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Failed to seed database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
