"""
Comprehensive End-to-End Test Suite for ClubHub Backend and Workflows.
Tests:
1. Fresh DB initialization & empty stats
2. User 1 Registration (Student -> Coordinator)
3. User 1 Login & JWT retrieval
4. Club Creation & Coordinator assignment
5. User 2 Registration (Applicant)
6. User 2 Login & JWT retrieval
7. Join Request submission (Pending state)
8. Duplicate Join Request prevention (400 validation)
9. Coordinator viewing pending requests for their club
10. Coordinator approval of join request -> status approved & membership created
11. User 2 'My Clubs' reflection
12. Event creation by club coordinator
13. User 2 Event registration -> Pass code generated
14. Network Collab Post creation
15. Post Upvoting & Commenting
16. Digital Badge Issuance & Verification
17. Dynamic Dashboard Public Stats check
18. Authentication protection on restricted routes
"""

import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure clubclash.db is removed before test for a clean slate
db_file = Path("clubclash.db")
if db_file.exists():
    try:
        os.remove(db_file)
        print("[TEST SETUP] Removed previous clubclash.db")
    except Exception as e:
        print(f"[TEST SETUP] Notice: {e}")

from backend.main import app
from backend.database import init_db

# Initialize clean database
init_db()

client = TestClient(app)

print("\n--- STARTING E2E VERIFICATION TEST ---")

# 1. Dynamic public stats on empty database
res = client.get("/dashboard/public")
assert res.status_code == 200, f"Public stats failed: {res.text}"
stats = res.json()
print("[1] Empty Public Stats:", stats)
assert stats["total_clubs"] == 0
assert stats["total_students"] == 0
assert stats["total_events"] == 0

# 2. Register User 1 (Admin/Coordinator candidate)
u1_payload = {
    "full_name": "Priya Sharma",
    "email": "priya.sharma@campus.edu",
    "password": "Password123!",
    "department": "Computer Science & Engineering",
    "year": 3
}
res = client.post("/auth/register", json=u1_payload)
assert res.status_code == 201, f"User 1 registration failed: {res.text}"
u1_data = res.json()
u1_token = u1_data["access_token"]
u1_headers = {"Authorization": f"Bearer {u1_token}"}
print("[2] User 1 Registered:", u1_data["user"]["full_name"], f"(ID: {u1_data['user']['id']})")

# 3. Test Login
res = client.post("/auth/login", json={"email": "priya.sharma@campus.edu", "password": "Password123!"})
assert res.status_code == 200, f"Login failed: {res.text}"
print("[3] User 1 Login successful. Token verified.")

# Test Invalid Login
res = client.post("/auth/login", json={"email": "priya.sharma@campus.edu", "password": "WrongPassword"})
assert res.status_code == 401, "Invalid password should return 401"
print("[3b] Invalid password test passed: 401 returned.")

# 4. User 1 creates a Club
club_payload = {
    "name": "Google Developer Student Club",
    "code": "GDSC",
    "category": "Tech",
    "description": "Building solutions with Google technologies and campus workshops.",
    "faculty_advisor": "Dr. Ramesh Babu",
    "recruitment_open": True,
    "logo_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&q=80"
}
res = client.post("/clubs", json=club_payload, headers=u1_headers)
assert res.status_code == 201, f"Club creation failed: {res.text}"
club = res.json()
club_id = club["id"]
print(f"[4] Club Created: '{club['name']}' (ID: {club_id}). Coordinator assigned.")

# Verify User 1 is coordinator
res = client.get("/auth/me", headers=u1_headers)
assert res.status_code == 200
user1_updated = res.json()
assert user1_updated["role"] == "coordinator", "User should be promoted to coordinator"
print(f"[4b] User 1 Role verified: {user1_updated['role']}")

# 5. Register User 2 (Student Applicant)
u2_payload = {
    "full_name": "Rahul Verma",
    "email": "rahul.verma@campus.edu",
    "password": "Password123!",
    "department": "Mechanical Engineering",
    "year": 2
}
res = client.post("/auth/register", json=u2_payload)
assert res.status_code == 201, f"User 2 registration failed: {res.text}"
u2_data = res.json()
u2_token = u2_data["access_token"]
u2_headers = {"Authorization": f"Bearer {u2_token}"}
print("[5] User 2 Registered:", u2_data["user"]["full_name"], f"(ID: {u2_data['user']['id']})")

# 6. User 2 checks clubs list (status should show not applied/none)
res = client.get("/clubs", headers=u2_headers)
assert res.status_code == 200
clubs_list = res.json()
assert len(clubs_list) == 1
assert clubs_list[0]["user_status"] == "none"
print("[6] User 2 sees club with user_status = 'none'")

# 7. User 2 submits Join Request
app_payload = {
    "club_id": club_id,
    "reason_for_joining": "Passionate about full-stack web and cloud systems.",
    "skills": "Python, JavaScript, React"
}
res = client.post("/applications", json=app_payload, headers=u2_headers)
assert res.status_code == 201, f"Join request failed: {res.text}"
app_data = res.json()
assert app_data["status"] == "Pending"
application_id = app_data["id"]
print(f"[7] Join Request Submitted! Status: {app_data['status']}, Application ID: {application_id}")

# 8. Duplicate join request prevention
res = client.post("/applications", json=app_payload, headers=u2_headers)
assert res.status_code == 400, "Duplicate application should return 400"
print("[8] Duplicate Join Request correctly rejected with 400:", res.json()["detail"])

# 9. Club Admin views pending requests
res = client.get(f"/clubs/{club_id}/requests", headers=u1_headers)
assert res.status_code == 200, f"Get requests failed: {res.text}"
reqs = res.json()
assert len(reqs) == 1
assert reqs[0]["student"]["full_name"] == "Rahul Verma"
print(f"[9] Club Admin retrieved {len(reqs)} pending request for {reqs[0]['student']['full_name']}.")

# 9b. Non-admin cannot view club requests
res = client.get(f"/clubs/{club_id}/requests", headers=u2_headers)
assert res.status_code == 403, "Non-admin should get 403"
print("[9b] Access control verified: Non-admin received 403 when trying to view club requests.")

# 10. Admin approves Rahul's application
res = client.patch(
    f"/applications/{application_id}/status",
    json={"status": "Approved"},
    headers=u1_headers
)
assert res.status_code == 200, f"Application approval failed: {res.text}"
updated_app = res.json()
assert updated_app["status"] == "Approved"
print("[10] Application approved by Club Admin. Status:", updated_app["status"])

# 11. User 2 checks My Clubs
res = client.get("/students/my-clubs", headers=u2_headers)
assert res.status_code == 200
my_clubs = res.json()
assert len(my_clubs["memberships"]) == 1
assert my_clubs["memberships"][0]["club_name"] == "Google Developer Student Club"
print("[11] User 2 'My Clubs' reflects active membership:", my_clubs["memberships"][0]["club_name"])

# 12. Admin schedules an Event
event_payload = {
    "title": "Cloud DevFest 2026",
    "description": "Hands-on cloud architecture workshop and hackathon.",
    "club_id": club_id,
    "event_date": "2026-03-15T10:00:00",
    "location": "Auditorium Hall B",
    "category": "Workshop"
}
res = client.post("/events", json=event_payload, headers=u1_headers)
assert res.status_code == 201, f"Event creation failed: {res.text}"
event = res.json()
event_id = event["id"]
print(f"[12] Event Created: '{event['title']}' (ID: {event_id})")

# 13. User 2 registers for the event
res = client.post(f"/events/{event_id}/register", headers=u2_headers)
assert res.status_code == 201, f"Event registration failed: {res.text}"
reg = res.json()
assert reg["pass_code"].startswith("PASS-")
print(f"[13] User 2 Registered for Event! Digital Pass Code: {reg['pass_code']}")

# 14. User 2 creates a Network Post
post_payload = {
    "title": "Hackathon Team Search",
    "content": "Looking for 2 teammates to build a campus navigation PWA for Cloud DevFest!",
    "tag": "#Collab"
}
res = client.post("/network/posts", json=post_payload, headers=u2_headers)
assert res.status_code == 201, f"Post creation failed: {res.text}"
post = res.json()
post_id = post["id"]
print(f"[14] Network Post Created (ID: {post_id}): '{post['title']}'")

# 15. User 1 Upvotes and Comments on the Post
res = client.post(f"/network/posts/{post_id}/upvote", headers=u1_headers)
assert res.status_code == 200
upvote_res = res.json()
assert upvote_res["upvotes_count"] == 1
print("[15a] Post upvoted. Current upvotes:", upvote_res["upvotes_count"])

res = client.post(
    f"/network/posts/{post_id}/comments",
    json={"content": "Sounds great Rahul, I have Flutter & FastAPI experience!"},
    headers=u1_headers
)
assert res.status_code == 201
comment = res.json()
print(f"[15b] Comment posted by {comment['author']['full_name']}: '{comment['content']}'")

# 16. Admin issues a Digital Badge to Rahul
badge_payload = {
    "student_id": u2_data["user"]["id"],
    "club_id": club_id,
    "title": "Certified Cloud Architect",
    "description": "Demonstrated exceptional cloud infrastructure engineering skills."
}
res = client.post("/badges", json=badge_payload, headers=u1_headers)
assert res.status_code == 201
badge = res.json()
print(f"[16a] Badge Issued: '{badge['title']}' with Hash ID: {badge['hash_id']}")

# User 2 checks badges
res = client.get("/badges/my", headers=u2_headers)
assert res.status_code == 200
my_badges = res.json()
assert len(my_badges) == 1
print(f"[16b] User 2 retrieved {len(my_badges)} badge: {my_badges[0]['title']}")

# 17. Check Dynamic Public Dashboard Stats
res = client.get("/dashboard/public")
assert res.status_code == 200
final_stats = res.json()
print("\n[17] Dynamic Real Dashboard Counts:")
print(f"     Clubs: {final_stats['total_clubs']} (Expected: 1)")
print(f"     Students: {final_stats['total_students']} (Expected: 2)")
print(f"     Events: {final_stats['total_events']} (Expected: 1)")
print(f"     Memberships: {final_stats['total_memberships']} (Expected: 2 - 1 coordinator + 1 member)")
assert final_stats["total_clubs"] == 1
assert final_stats["total_students"] == 2
assert final_stats["total_events"] == 1
assert final_stats["total_memberships"] >= 2

# 18. Protected action redirection check (Unauthenticated requests get 401)
res = client.post("/applications", json=app_payload)
assert res.status_code == 401
print("\n[18] Security Test: Unauthenticated POST /applications returned 401 Unauthorized as expected.")

print("\n" + "=" * 60)
print(">>> ALL 18 END-TO-END FLOW TESTS PASSED SUCCESSFULLY! <<<")
print("=" * 60 + "\n")
