"""
backend/tests/test_clubs.py
Automated Tests for Club Management: Catalog, Search, Creation, Updates, Recruitment Toggle, and Deletion.
"""

def test_public_get_clubs(client):
    response = client.get("/clubs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_coordinator_create_club_success(client, seed_users):
    headers = seed_users["coord_headers"]
    payload = {
        "name": "TINT Coding Club",
        "description": "Competitive programming, Data Structures, and Algorithmic challenges.",
        "category": "Technical",
        "image_url": "https://example.com/logo.png",
        "recruitment_open": True
    }
    response = client.post("/clubs", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "TINT Coding Club"
    assert data["coordinator_id"] == seed_users["coordinator"].id


def test_student_cannot_create_club(client, seed_users):
    headers = seed_users["student_headers"]
    payload = {
        "name": "Unauthorized Club",
        "description": "A club created without permissions.",
        "category": "Social"
    }
    response = client.post("/clubs", json=payload, headers=headers)
    assert response.status_code == 403


def test_search_clubs(client, seed_users):
    # Create club first
    client.post(
        "/clubs",
        json={
            "name": "Robotics Society",
            "description": "Hardware and microcontrollers.",
            "category": "Technical"
        },
        headers=seed_users["coord_headers"]
    )

    response = client.get("/clubs/search?q=robotics")
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert "Robotics" in results[0]["name"]


def test_coordinator_update_own_club(client, seed_users):
    # 1. Create club
    res = client.post(
        "/clubs",
        json={
            "name": "AI & ML Club",
            "description": "Deep learning research group.",
            "category": "Technical"
        },
        headers=seed_users["coord_headers"]
    )
    club_id = res.json()["id"]

    # 2. Update club description
    update_res = client.patch(
        f"/clubs/{club_id}",
        json={"description": "Updated deep learning & computer vision research group."},
        headers=seed_users["coord_headers"]
    )
    assert update_res.status_code == 200
    assert "computer vision" in update_res.json()["description"]


def test_toggle_recruitment(client, seed_users):
    res = client.post(
        "/clubs",
        json={
            "name": "Music Society",
            "description": "Classical and rock bands.",
            "category": "Cultural",
            "recruitment_open": True
        },
        headers=seed_users["coord_headers"]
    )
    club_id = res.json()["id"]

    # Close recruitment
    toggle_res = client.patch(
        f"/clubs/{club_id}/recruitment",
        json={"recruitment_open": False},
        headers=seed_users["coord_headers"]
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["recruitment_open"] is False


def test_admin_delete_club(client, seed_users):
    res = client.post(
        "/clubs",
        json={
            "name": "Old Deprecated Club",
            "description": "To be deleted.",
            "category": "General"
        },
        headers=seed_users["coord_headers"]
    )
    club_id = res.json()["id"]

    # Student cannot delete (403)
    del_student = client.delete(f"/clubs/{club_id}", headers=seed_users["student_headers"])
    assert del_student.status_code == 403

    # Admin deletes successfully (200)
    del_admin = client.delete(f"/clubs/{club_id}", headers=seed_users["admin_headers"])
    assert del_admin.status_code == 200

    # Verification: Club no longer found
    check_res = client.get(f"/clubs/{club_id}")
    assert check_res.status_code == 404

