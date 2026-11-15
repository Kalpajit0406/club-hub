"""
test_verification.py - Comprehensive In-Memory Backend & RBAC Verification Suite for ClubHub
"""

import os
import sys
import json
import tempfile
import asyncio
from pathlib import Path
from urllib.parse import urlparse

# Set testing environment variables before importing backend modules
test_db_path = Path(tempfile.gettempdir()) / "test_verify.db"
if test_db_path.exists():
    try:
        os.remove(test_db_path)
    except Exception:
        pass

os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path.as_posix()}"

from backend.main import app
from backend.database import init_db

# Initialize database schema
init_db()


class Response:
    def __init__(self, status_code, text, json_data, headers):
        self.status_code = status_code
        self.text = text
        self._json = json_data
        self.headers = headers

    def json(self):
        if self._json is None:
            raise ValueError(f"Response did not contain valid JSON. Body: {self.text}")
        return self._json


async def request(method: str, path: str, headers: dict = None, json_body: dict = None) -> Response:
    headers = headers or {}
    header_list = [(k.lower().encode("latin1"), v.encode("latin1")) for k, v in headers.items()]

    body = b""
    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        header_list.append((b"content-type", b"application/json"))

    parsed = urlparse(path)
    path_str = parsed.path
    query_string = parsed.query.encode("utf-8")

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method.upper(),
        "headers": header_list,
        "path": path_str,
        "raw_path": path_str.encode("utf-8"),
        "query_string": query_string,
        "scheme": "http",
        "server": ("testserver", 80),
        "client": ("127.0.0.1", 12345),
    }

    body_sent = False

    async def receive():
        nonlocal body_sent
        if not body_sent:
            body_sent = True
            return {"type": "http.request", "body": body, "more_body": False}
        return {"type": "http.request", "body": b"", "more_body": False}

    response_status = 200
    response_headers = {}
    response_body = []

    async def send(message):
        nonlocal response_status
        if message["type"] == "http.response.start":
            response_status = message["status"]
            for k, v in message.get("headers", []):
                response_headers[k.decode("latin1")] = v.decode("latin1")
        elif message["type"] == "http.response.body":
            response_body.append(message.get("body", b""))

    await app(scope, receive, send)

    res_bytes = b"".join(response_body)
    res_text = res_bytes.decode("utf-8", errors="replace")
    try:
        res_json = json.loads(res_text)
    except Exception:
        res_json = None

    return Response(response_status, res_text, res_json, response_headers)


async def run_tests():
    print("\n" + "=" * 65)
    print("   RUNNING CLUBHUB COMPREHENSIVE VERIFICATION SUITE")
    print("=" * 65 + "\n")

    # 1. Student Registration
    student_payload = {
        "full_name": "Aarav Gupta",
        "email": "aarav.gupta@campus.edu",
        "password": "Password123!",
        "department": "Computer Science & Engineering",
        "year": 2,
        "role": "student"
    }
    res = await request("POST", "/auth/register", json_body=student_payload)
    assert res.status_code == 201, f"Student registration failed: {res.text}"
    student_data = res.json()
    student_token = student_data["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    assert student_data["user"]["role"] == "student"
    print("[PASS] 1. Student Registration successful. Role: 'student'.")

    # 2. Duplicate Registration Rejection
    res = await request("POST", "/auth/register", json_body=student_payload)
    assert res.status_code == 400, f"Duplicate email registration must return 400: got {res.status_code}"
    print("[PASS] 2. Duplicate email registration rejected with 400.")

    # 3. Student Login
    res = await request("POST", "/auth/login", json_body={"email": "aarav.gupta@campus.edu", "password": "Password123!"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    login_data = res.json()
    assert login_data["user"]["role"] == "student"
    print("[PASS] 3. Student Login successful with correct credentials and role.")

    # 3b. Invalid Password Rejection
    res = await request("POST", "/auth/login", json_body={"email": "aarav.gupta@campus.edu", "password": "WrongPassword!"})
    assert res.status_code == 401, f"Invalid password must return 401: got {res.status_code}"
    print("[PASS] 3b. Invalid password rejected with 401 Unauthorized.")

    # 4. Club Admin Registration
    admin1_payload = {
        "full_name": "Pooja Hegde",
        "email": "pooja.admin@campus.edu",
        "password": "AdminPassword123!",
        "department": "Robotics & Automation (Lead Coordinator)",
        "year": 4,
        "role": "coordinator"
    }
    res = await request("POST", "/auth/register", json_body=admin1_payload)
    assert res.status_code == 201, f"Club Admin registration failed: {res.text}"
    admin1_data = res.json()
    admin1_token = admin1_data["access_token"]
    admin1_headers = {"Authorization": f"Bearer {admin1_token}"}
    assert admin1_data["user"]["role"] == "coordinator"
    print("[PASS] 4. Club Admin 1 Registration successful. Role: 'coordinator'.")

    # 5. Club Admin Login
    res = await request("POST", "/auth/login", json_body={"email": "pooja.admin@campus.edu", "password": "AdminPassword123!"})
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "coordinator"
    print("[PASS] 5. Club Admin Login successful with role 'coordinator'.")

    # 6. RBAC: Student cannot create clubs
    bad_club_payload = {
        "name": "Unauthorized Club",
        "category": "Technical",
        "description": "Student trying to charter a society",
        "recruitment_open": True
    }
    res = await request("POST", "/clubs", headers=student_headers, json_body=bad_club_payload)
    assert res.status_code == 403, f"Student should get 403 when creating a club: {res.status_code}"
    print("[PASS] 6. RBAC Enforced: Student cannot create clubs (403 Forbidden).")

    # 6b. RBAC: Student cannot access coordinator-clubs endpoint
    res = await request("GET", "/dashboard/coordinator-clubs", headers=student_headers)
    assert res.status_code == 403, f"Student should get 403 accessing coordinator clubs: {res.status_code}"
    print("[PASS] 6b. RBAC Enforced: Student cannot access coordinator-clubs (403 Forbidden).")

    # 7. Club Admin 1 creates a Club
    club_payload = {
        "name": "Robotics & Autonomous Systems Cell",
        "category": "Technical",
        "description": "Designing competitive robotics, drone telemetry, and IoT controllers.",
        "recruitment_open": True
    }
    res = await request("POST", "/clubs", headers=admin1_headers, json_body=club_payload)
    assert res.status_code == 201, f"Club Admin club creation failed: {res.text}"
    club1 = res.json()
    club1_id = club1["id"]
    assert club1["coordinator_id"] == admin1_data["user"]["id"]
    print(f"[PASS] 7. Club Admin 1 created club '{club1['name']}' (ID: {club1_id}).")

    # 8. Register Club Admin 2
    admin2_payload = {
        "full_name": "Rohan Mehta",
        "email": "rohan.admin@campus.edu",
        "password": "AdminPassword123!",
        "department": "Cultural Council",
        "year": 3,
        "role": "coordinator"
    }
    res = await request("POST", "/auth/register", json_body=admin2_payload)
    assert res.status_code == 201
    admin2_data = res.json()
    admin2_token = admin2_data["access_token"]
    admin2_headers = {"Authorization": f"Bearer {admin2_token}"}
    print("[PASS] 8. Club Admin 2 Registered.")

    # 8b. RBAC: Student cannot toggle recruitment or access club requests
    res = await request("PATCH", f"/clubs/{club1_id}/recruitment", headers=student_headers, json_body={"recruitment_open": False})
    assert res.status_code == 403, f"Student should get 403 toggling recruitment: got {res.status_code}"
    res = await request("GET", f"/clubs/{club1_id}/requests", headers=student_headers)
    assert res.status_code == 403, f"Student should get 403 viewing club requests: got {res.status_code}"
    print("[PASS] 8b. RBAC Enforced: Student cannot manage recruitment or view club requests (403 Forbidden).")

    # 9. Student Submits Join Request
    app_payload = {
        "club_id": club1_id,
        "reason_for_joining": "Passionate about embedded firmware and autonomous rovers.",
        "skills": "C++, Arduino, ROS2"
    }
    res = await request("POST", "/applications", headers=student_headers, json_body=app_payload)
    assert res.status_code == 201, f"Student join request failed: {res.text}"
    application = res.json()
    application_id = application["id"]
    assert application["status"] == "Pending"
    print(f"[PASS] 9. Student submitted join request (ID: {application_id}, Status: Pending).")

    # 9b. Duplicate Join Request Prevention
    res = await request("POST", "/applications", headers=student_headers, json_body=app_payload)
    assert res.status_code == 400, "Duplicate application must return 400"
    print("[PASS] 9b. Duplicate join request correctly rejected with 400 Bad Request.")

    # 10. Club Admin 1 Views Pending Requests
    res = await request("GET", f"/clubs/{club1_id}/requests", headers=admin1_headers)
    assert res.status_code == 200
    reqs = res.json()
    assert len(reqs) == 1
    assert reqs[0]["student"]["email"] == "aarav.gupta@campus.edu"
    assert reqs[0]["status"] == "Pending"
    print(f"[PASS] 10. Club Admin 1 retrieved pending join request for '{reqs[0]['student']['full_name']}'.")

    # 11. Club Admin 1 Approves Join Request
    res = await request(
        "PATCH",
        f"/applications/{application_id}/status",
        headers=admin1_headers,
        json_body={"status": "Approved"}
    )
    assert res.status_code == 200, f"Approval failed: {res.text}"
    assert res.json()["status"] == "Approved"
    print("[PASS] 11. Club Admin 1 Approved join request. Status: 'Approved'.")

    # 12. Student Dashboard reflects active membership
    res = await request("GET", "/students/my-clubs", headers=student_headers)
    assert res.status_code == 200
    my_clubs = res.json()
    member_club_names = [m["club_name"] for m in my_clubs["memberships"]]
    assert "Robotics & Autonomous Systems Cell" in member_club_names
    print("[PASS] 12. Student Dashboard 'My Clubs' reflects active membership in 'Robotics & Autonomous Systems Cell'.")

    # 12b. Club Admin views members roster
    res = await request("GET", f"/clubs/{club1_id}/members", headers=admin1_headers)
    assert res.status_code == 200
    members = res.json()
    member_emails = [m["student"]["email"] for m in members]
    assert "aarav.gupta@campus.edu" in member_emails
    print(f"[PASS] 12b. Inducted student '{members[0]['student']['full_name']}' appears on club members roster.")

    # 13. Event Management: Create, Edit, Register, Delete
    # 13a. RBAC: Student cannot create events
    event_payload = {
        "club_id": club1_id,
        "title": "National Aerial Drone Grand Prix",
        "category": "Workshop",
        "event_date": "2026-04-10T10:00:00",
        "location": "Main Campus Quadrangle",
        "description": "Hands-on drone assembly, FPV flying telemetry, and agility race."
    }
    res = await request("POST", "/events", headers=student_headers, json_body=event_payload)
    assert res.status_code == 403, "Student must not be able to create events"
    print("[PASS] 13a. RBAC Enforced: Student cannot create events (403 Forbidden).")

    # 13b. Club Admin 1 creates Event / Workshop
    res = await request("POST", "/events", headers=admin1_headers, json_body=event_payload)
    assert res.status_code == 201, f"Event creation failed: {res.text}"
    event = res.json()
    event_id = event["id"]
    print(f"[PASS] 13b. Club Admin 1 scheduled event: '{event['title']}' (ID: {event_id}).")

    # 13c. Club Admin 1 edits Event
    res = await request(
        "PATCH",
        f"/events/{event_id}",
        headers=admin1_headers,
        json_body={"title": "National Aerial Drone Grand Prix (Updated)", "location": "Advanced Tech Lab 2"}
    )
    assert res.status_code == 200, f"Event update failed: {res.text}"
    updated_event = res.json()
    assert updated_event["title"] == "National Aerial Drone Grand Prix (Updated)"
    assert updated_event["location"] == "Advanced Tech Lab 2"
    print(f"[PASS] 13c. Club Admin 1 edited event: '{updated_event['title']}' at '{updated_event['location']}'.")

    # 13d. Student Registers for Event and receives pass code
    res = await request("POST", f"/events/{event_id}/register", headers=student_headers)
    assert res.status_code == 201, f"Student registration failed: {res.text}"
    reg = res.json()
    assert reg["pass_code"].startswith("PASS-")
    print(f"[PASS] 13d. Student registered for event. Verifiable Pass Code: {reg['pass_code']}.")

    # 13e. Club Admin 1 deletes Event
    res = await request("DELETE", f"/events/{event_id}", headers=admin1_headers)
    assert res.status_code == 200
    print("[PASS] 13e. Club Admin 1 successfully deleted event.")

    # 14. Club Admin 1 edits Club Info
    res = await request(
        "PATCH",
        f"/clubs/{club1_id}",
        headers=admin1_headers,
        json_body={"description": "Updated society description with cutting-edge AI and robotics curriculum."}
    )
    assert res.status_code == 200
    assert "cutting-edge AI" in res.json()["description"]
    print("[PASS] 14. Club Admin 1 successfully edited club information.")

    # 15. Club Admin 1 removes member from roster
    res = await request("DELETE", f"/clubs/{club1_id}/members/{student_data['user']['id']}", headers=admin1_headers)
    assert res.status_code == 200
    print("[PASS] 15. Club Admin 1 successfully removed member from roster.")

    print("\n" + "=" * 65)
    print(">>> ALL 15 END-TO-END VERIFICATION SCENARIOS PASSED WITH 100% SUCCESS! <<<")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(run_tests())
