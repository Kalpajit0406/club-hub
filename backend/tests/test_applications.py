"""
backend/tests/test_applications.py
Automated Tests for Membership Applications: Submission, Duplicate Prevention,
Recruitment Closed Restrictions, Coordinator Review, and Membership Creation.
"""

def test_submit_application_success(client, seed_users):
    # 1. Create a club with recruitment open
    club_res = client.post(
        "/clubs",
        json={
            "name": "GDSC TINT",
            "description": "Tech student community.",
            "category": "Technical",
            "recruitment_open": True
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    # 2. Student applies
    payload = {
        "club_id": club_id,
        "reason_for_joining": "I want to contribute to web and AI projects on campus.",
        "skills": "Python, FastAPI, Git, React"
    }
    app_res = client.post("/applications", json=payload, headers=seed_users["student_headers"])
    assert app_res.status_code == 201
    data = app_res.json()
    assert data["status"] == "Pending"  # Must be Pending on creation
    assert data["club_id"] == club_id
    assert data["student_id"] == seed_users["student"].id


def test_prevent_duplicate_applications(client, seed_users):
    club_res = client.post(
        "/clubs",
        json={
            "name": "Design Society",
            "description": "UI/UX & Graphic design.",
            "category": "Arts",
            "recruitment_open": True
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    payload = {
        "club_id": club_id,
        "reason_for_joining": "I am passionate about Figma design and branding.",
        "skills": "Figma, Adobe Illustrator"
    }

    # First application succeeds
    res1 = client.post("/applications", json=payload, headers=seed_users["student_headers"])
    assert res1.status_code == 201

    # Second application must be rejected
    res2 = client.post("/applications", json=payload, headers=seed_users["student_headers"])
    assert res2.status_code == 400
    assert "Duplicate applications are not permitted" in res2.json()["detail"]


def test_apply_when_recruitment_closed_rejected(client, seed_users):
    club_res = client.post(
        "/clubs",
        json={
            "name": "Closed Club",
            "description": "Recruitment closed for this semester.",
            "category": "General",
            "recruitment_open": False
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    payload = {
        "club_id": club_id,
        "reason_for_joining": "I want to join anyway.",
        "skills": "General skills"
    }
    res = client.post("/applications", json=payload, headers=seed_users["student_headers"])
    assert res.status_code == 400
    assert "currently closed" in res.json()["detail"]


def test_approve_application_creates_membership(client, seed_users):
    # 1. Create club
    club_res = client.post(
        "/clubs",
        json={
            "name": "Competitive Programming Club",
            "description": "DSA and LeetCode grinding club.",
            "category": "Technical",
            "recruitment_open": True
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    # 2. Student applies
    app_res = client.post(
        "/applications",
        json={
            "club_id": club_id,
            "reason_for_joining": "Ranked Candidate Master on Codeforces.",
            "skills": "C++, Algorithms"
        },
        headers=seed_users["student_headers"]
    )
    app_id = app_res.json()["id"]

    # 3. Coordinator approves application
    status_res = client.patch(
        f"/applications/{app_id}/status",
        json={"status": "Approved"},
        headers=seed_users["coord_headers"]
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Approved"

    # 4. Verify membership was created
    members_res = client.get(f"/clubs/{club_id}/members", headers=seed_users["coord_headers"])
    assert members_res.status_code == 200
    members = members_res.json()
    assert len(members) == 1
    assert members[0]["student_id"] == seed_users["student"].id


def test_reject_application_does_not_create_membership(client, seed_users):
    club_res = client.post(
        "/clubs",
        json={
            "name": "Aero Club",
            "description": "RC planes and drones.",
            "category": "Technical",
            "recruitment_open": True
        },
        headers=seed_users["coord_headers"]
    )
    club_id = club_res.json()["id"]

    app_res = client.post(
        "/applications",
        json={
            "club_id": club_id,
            "reason_for_joining": "Interested in flying drones.",
            "skills": "Beginner"
        },
        headers=seed_users["student_headers"]
    )
    app_id = app_res.json()["id"]

    # Coordinator rejects
    status_res = client.patch(
        f"/applications/{app_id}/status",
        json={"status": "Rejected"},
        headers=seed_users["coord_headers"]
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Rejected"

    # Verify no membership exists
    count_res = client.get(f"/clubs/{club_id}/members/count")
    assert count_res.json()["member_count"] == 0

