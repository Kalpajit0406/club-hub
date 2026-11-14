"""
backend/tests/test_admin_and_dashboard.py
Unit and Integration Tests for Admin, Dashboard, Students, and System Health Endpoints.
"""

import pytest
from datetime import datetime, timedelta
from backend.models import Club, Event, Application, Membership


def test_system_root_and_health(client):
    """
    Test root and health check endpoints.
    """
    res_root = client.get("/")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["status"] == "online"
    assert "version" in data_root

    res_health = client.get("/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    assert data_health["status"] == "healthy"
    assert "database" in data_health


def test_student_dashboard_and_memberships(client, seed_users, db_session):
    """
    Test student dashboard statistics and personal memberships list.
    """
    student_headers = seed_users["student_headers"]

    # Create a test club
    club = Club(
        name="Robotics Society",
        description="Autonomous robots and CAD",
        category="Technical",
        recruitment_open=True,
        coordinator_id=seed_users["coordinator"].id
    )
    db_session.add(club)
    db_session.commit()
    db_session.refresh(club)

    # Initially, student dashboard stats should be 0
    res_stats = client.get("/dashboard/student", headers=student_headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total_applications"] == 0
    assert stats["clubs_joined"] == 0

    # Student submits application
    res_app = client.post(
        "/applications",
        json={
            "club_id": club.id,
            "reason_for_joining": "Passionate about robotics hardware",
            "skills": "ROS, C++, Arduino"
        },
        headers=student_headers
    )
    assert res_app.status_code == 201
    app_id = res_app.json()["id"]

    # Verify student dashboard reflects pending application
    res_stats_after = client.get("/dashboard/student", headers=student_headers)
    assert res_stats_after.status_code == 200
    stats_after = res_stats_after.json()
    assert stats_after["total_applications"] == 1
    assert stats_after["pending_applications"] == 1

    # Coordinator approves application
    coord_headers = seed_users["coord_headers"]
    res_review = client.patch(
        f"/applications/{app_id}/status",
        json={"status": "Approved"},
        headers=coord_headers
    )
    assert res_review.status_code == 200

    # Now verify student memberships endpoint
    res_memberships = client.get("/students/me/memberships", headers=student_headers)
    assert res_memberships.status_code == 200
    memberships = res_memberships.json()
    assert len(memberships) == 1
    assert memberships[0]["club_id"] == club.id

    # Verify stats reflect approved application and joined club
    res_stats_final = client.get("/dashboard/student", headers=student_headers)
    stats_final = res_stats_final.json()
    assert stats_final["approved_applications"] == 1
    assert stats_final["clubs_joined"] == 1


def test_coordinator_dashboard_stats(client, seed_users, db_session):
    """
    Test coordinator dashboard stats reflecting coordinated clubs, applications, and upcoming events.
    """
    coord_headers = seed_users["coord_headers"]

    # Create club for coordinator
    club = Club(
        name="GDSC TINT",
        description="Google technologies",
        category="Technical",
        recruitment_open=True,
        coordinator_id=seed_users["coordinator"].id
    )
    db_session.add(club)
    db_session.commit()
    db_session.refresh(club)

    # Create upcoming event
    event = Event(
        club_id=club.id,
        title="Web3 Workshop",
        description="Decentralized web",
        event_date=datetime.utcnow() + timedelta(days=5),
        location="Lab 101"
    )
    db_session.add(event)
    db_session.commit()

    # Get coordinator stats
    res = client.get("/dashboard/coordinator", headers=coord_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["coordinated_clubs_count"] == 1
    assert data["upcoming_events"] == 1


def test_admin_dashboard_stats(client, seed_users):
    """
    Test platform-wide administrative statistics.
    """
    admin_headers = seed_users["admin_headers"]
    res = client.get("/dashboard/admin", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_students"] >= 1
    assert data["total_coordinators"] >= 1
    assert data["total_admins"] >= 1


def test_admin_user_role_update(client, seed_users):
    """
    Test admin elevating a student to coordinator, and protection against unauthorized role update.
    """
    student_id = seed_users["student"].id
    admin_headers = seed_users["admin_headers"]
    student_headers = seed_users["student_headers"]

    # Student cannot change roles
    res_forbidden = client.patch(
        f"/admin/students/{student_id}/role",
        json={"role": "coordinator"},
        headers=student_headers
    )
    assert res_forbidden.status_code == 403

    # Admin changes student to coordinator
    res_elevate = client.patch(
        f"/admin/students/{student_id}/role",
        json={"role": "coordinator"},
        headers=admin_headers
    )
    assert res_elevate.status_code == 200
    assert res_elevate.json()["role"] == "coordinator"


def test_admin_create_coordinator(client, seed_users):
    """
    Test admin directly provisioning a coordinator account.
    """
    admin_headers = seed_users["admin_headers"]
    res = client.post(
        "/admin/coordinators",
        json={
            "full_name": "New Coordinator",
            "email": "new.coord@tint.edu.in",
            "password": "securepassword",
            "department": "Civil Engineering",
            "year": 3
        },
        headers=admin_headers
    )
    assert res.status_code == 201
    assert res.json()["role"] == "coordinator"
    assert res.json()["email"] == "new.coord@tint.edu.in"
