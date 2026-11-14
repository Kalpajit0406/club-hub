"""
backend/seed.py
Database Seeding Script for ClubClash.
Seeds initial demo accounts (Student, Coordinator, Admin) and representative clubs/events.
Safe to run multiple times: skips records if they already exist.
"""

from datetime import datetime, timedelta
from backend.database import SessionLocal, init_db
from backend.models import Student, Club, Event, Application, Membership
from backend.auth import get_password_hash


def seed_data():
    """
    Initializes tables and seeds initial development and demo records.
    """
    init_db()
    db = SessionLocal()

    try:
        print("[SEED] Checking and seeding users...")

        # 1. Demo Student
        student = db.query(Student).filter(Student.email == "aditya@tint.edu.in").first()
        if not student:
            student = Student(
                full_name="Aditya Verma",
                email="aditya@tint.edu.in",
                password_hash=get_password_hash("student123"),
                department="Computer Science & Engineering",
                year=3,
                role="student"
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            print(f"  + Created Student: {student.email} (pass: student123)")
        else:
            print(f"  = Student exists: {student.email}")

        # 2. Demo Coordinator
        coordinator = db.query(Student).filter(Student.email == "gdsc.lead@tint.edu.in").first()
        if not coordinator:
            coordinator = Student(
                full_name="Rohan Mehta",
                email="gdsc.lead@tint.edu.in",
                password_hash=get_password_hash("coordinator123"),
                department="Information Technology",
                year=4,
                role="coordinator"
            )
            db.add(coordinator)
            db.commit()
            db.refresh(coordinator)
            print(f"  + Created Coordinator: {coordinator.email} (pass: coordinator123)")
        else:
            print(f"  = Coordinator exists: {coordinator.email}")

        # 3. Demo Admin
        admin = db.query(Student).filter(Student.email == "admin@tint.edu.in").first()
        if not admin:
            admin = Student(
                full_name="Dr. Arindam Sen",
                email="admin@tint.edu.in",
                password_hash=get_password_hash("admin123"),
                department="Dean of Student Affairs",
                year=5,
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"  + Created Admin: {admin.email} (pass: admin123)")
        else:
            print(f"  = Admin exists: {admin.email}")

        # 4. Seed Representative Clubs
        print("[SEED] Checking and seeding clubs...")
        sample_clubs = [
            {
                "name": "Google Developer Student Club (GDSC)",
                "description": "Premier campus technical community dedicated to Google Cloud, Android, Flutter, and Full-Stack development.",
                "category": "Technical",
                "image_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
                "coordinator_id": coordinator.id,
                "recruitment_open": True
            },
            {
                "name": "Robotech Robotics Society",
                "description": "Hardware and robotics collective building autonomous combat bots, drones, and IoT microcontrollers.",
                "category": "Technical",
                "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
                "coordinator_id": coordinator.id,
                "recruitment_open": True
            },
            {
                "name": "E-Cell Entrepreneurship Club",
                "description": "Student-led startup incubator fostering business model pitch decks, VC networking, and hackathon ideation.",
                "category": "Entrepreneurship",
                "image_url": "https://images.unsplash.com/photo-1559136555-9303baea8ebd",
                "coordinator_id": coordinator.id,
                "recruitment_open": True
            },
            {
                "name": "Resonance Cultural & Music Club",
                "description": "University musical ensemble and stage performing society organizing live college fests and acoustic nights.",
                "category": "Cultural",
                "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
                "coordinator_id": None,
                "recruitment_open": False
            },
            {
                "name": "Sports & Athletics Committee",
                "description": "Inter-departmental university athletics, football, basketball, and badminton tournaments committee.",
                "category": "Sports",
                "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211",
                "coordinator_id": None,
                "recruitment_open": True
            }
        ]

        created_clubs = []
        for c_data in sample_clubs:
            club = db.query(Club).filter(Club.name == c_data["name"]).first()
            if not club:
                club = Club(**c_data)
                db.add(club)
                db.commit()
                db.refresh(club)
                print(f"  + Created Club: {club.name}")
            created_clubs.append(club)

        # 5. Seed Events
        print("[SEED] Checking and seeding events...")
        gdsc_club = created_clubs[0]
        sample_events = [
            {
                "club_id": gdsc_club.id,
                "title": "HackTINT 2026: 36-Hour National Hackathon",
                "description": "36-hour code sprint featuring Web3, GenAI, and Cloud tracks with ₹1,50,000 cash prize pool.",
                "event_date": datetime.utcnow() + timedelta(days=14),
                "location": "Auditorium Main Hall, Block B"
            },
            {
                "club_id": gdsc_club.id,
                "title": "GenAI & Cloud Codelab: Building with Gemini & FastAPI",
                "description": "Hands-on workshop building production AI agents, structured tool calling, and FastAPI deployment.",
                "event_date": datetime.utcnow() + timedelta(days=7),
                "location": "Computing Lab 4, 3rd Floor"
            }
        ]

        for e_data in sample_events:
            event = db.query(Event).filter(Event.title == e_data["title"]).first()
            if not event:
                event = Event(**e_data)
                db.add(event)
                db.commit()
                print(f"  + Created Event: {event.title}")

        # 6. Seed a sample application and membership for Aditya in GDSC
        print("[SEED] Checking sample application & membership...")
        existing_app = (
            db.query(Application)
            .filter(Application.student_id == student.id, Application.club_id == gdsc_club.id)
            .first()
        )
        if not existing_app:
            app = Application(
                student_id=student.id,
                club_id=gdsc_club.id,
                reason_for_joining="Passionate about Python backend development and cloud architecture.",
                skills="Python, FastAPI, SQL, React, Docker",
                status="Approved",
                applied_at=datetime.utcnow() - timedelta(days=5),
                updated_at=datetime.utcnow() - timedelta(days=2)
            )
            db.add(app)
            db.commit()
            db.refresh(app)

            membership = Membership(
                student_id=student.id,
                club_id=gdsc_club.id,
                application_id=app.id,
                joined_at=datetime.utcnow() - timedelta(days=2)
            )
            db.add(membership)
            db.commit()
            print(f"  + Seeded approved application & membership for {student.full_name} in {gdsc_club.name}")

        print("[SEED] Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Failed to seed database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()

