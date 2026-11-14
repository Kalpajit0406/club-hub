"""
backend/tests/test_events.py
Automated Tests for Event Scheduling, Retrieval, Updates, Deletion, and Dashboard Telemetry.
"""

from datetime import datetime, timedelta

def test_public_get_events(client):
    response = client.get("/events")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_coordinator_create_event_success(client, seed_users):
    # 1. Create club
    club_res = client.post(
        "/clubs",
        json={
            "name": "Hackathon Club",
            "description": "Organizes college hackathons.",
            "category": "Technical"
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    # 2. Coordinator creates event
    future_date = (datetime.utcnow() + timedelta(days=10)).isoformat()
    event_payload = {
        "club_id": club_id,
        "title": "Campus HackSprint 2026",
        "description": "24-hour rapid prototyping hackathon.",
        "event_date": future_date,
        "location": "Central Seminar Hall"
    }
    event_res = client.post("/events", json=event_payload, headers=seed_users["coord_headers"])
    assert event_res.status_code == 201
    data = event_res.json()
    assert data["title"] == "Campus HackSprint 2026"
    assert data["club_id"] == club_id


def test_student_cannot_create_event(client, seed_users):
    club_res = client.post(
        "/clubs",
        json={
            "name": "Gaming Society",
            "description": "Esports club.",
            "category": "Sports"
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    event_payload = {
        "club_id": club_id,
        "title": "Unauthorized LAN Tournament",
        "description": "Gaming tournament.",
        "event_date": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "location": "Hostel Lounge"
    }
    res = client.post("/events", json=event_payload, headers=seed_users["student_headers"])
    assert res.status_code == 403


def test_update_and_delete_event(client, seed_users):
    club_res = client.post(
        "/clubs",
        json={
            "name": "Dev Community",
            "description": "Developers on campus.",
            "category": "Technical"
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    create_res = client.post(
        "/events",
        json={
            "club_id": club_id,
            "title": "Initial Tech Talk",
            "description": "Intro to Git.",
            "event_date": (datetime.utcnow() + timedelta(days=5)).isoformat(),
            "location": "Room 101"
        },
        headers=seed_users["coord_headers"]
    )
    event_id = create_res.json()["id"]

    # Update event
    patch_res = client.patch(
        f"/events/{event_id}",
        json={"location": "Auditorium Main Stage"},
        headers=seed_users["coord_headers"]
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["location"] == "Auditorium Main Stage"

    # Delete event
    del_res = client.delete(f"/events/{event_id}", headers=seed_users["coord_headers"])
    assert del_res.status_code == 200

    # Verify deleted
    get_res = client.get(f"/events/{event_id}")
    assert get_res.status_code == 404


def test_dashboard_stats_endpoint(client, seed_users):
    # Student dashboard
    s_res = client.get("/dashboard/student", headers=seed_users["student_headers"])
    assert s_res.status_code == 200
    assert "total_applications" in s_res.json()

    # Coordinator dashboard
    c_res = client.get("/dashboard/coordinator", headers=seed_users["coord_headers"])
    assert c_res.status_code == 200
    assert "coordinated_clubs_count" in c_res.json()

    # Admin dashboard
    a_res = client.get("/dashboard/admin", headers=seed_users["admin_headers"])
    assert a_res.status_code == 200
    assert "total_students" in a_res.json()
    assert "total_clubs" in a_res.json()

