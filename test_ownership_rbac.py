"""
test_ownership_rbac.py
Automated End-to-End Verification of Edit/Delete operations and Strict RBAC.
"""

import json
import urllib.request
import urllib.error

# Direct loopback without sandbox proxy
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
urllib.request.install_opener(opener)

BASE = "http://localhost:8000"

def req(path, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    r = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as response:
            status_code = response.getcode()
            resp_bytes = response.read()
            try:
                resp_text = resp_bytes.decode("utf-8")
                try:
                    return status_code, json.loads(resp_text)
                except Exception:
                    return status_code, resp_text
            except UnicodeDecodeError:
                return status_code, resp_bytes
    except urllib.error.HTTPError as e:
        err_bytes = e.read()
        try:
            err_text = err_bytes.decode("utf-8")
            try:
                return e.code, json.loads(err_text)
            except Exception:
                return e.code, err_text
        except UnicodeDecodeError:
            return e.code, err_bytes

def run_tests():
    print("=" * 65)
    print("  TESTING EDIT/DELETE & RBAC FOR CLUBS AND EVENTS")
    print("=" * 65)

    # 1. Health check
    code, res = req("/health")
    assert code == 200, f"Server unreachable: {code}"
    print("[PASS] 1. Backend server healthy")

    # 2. Login Club Admin A (Coordinator)
    code, auth_a = req("/auth/login", method="POST", data={
        "email": "coord@tint.edu.in",
        "password": "Coord@123",
        "section": "admin"
    })
    assert code == 200, f"Login Admin A failed: {code} {auth_a}"
    token_a = auth_a["access_token"]
    user_a = auth_a["user"]
    hdr_a = {"Authorization": f"Bearer {token_a}"}
    print(f"[PASS] 2. Logged in as Club Admin A ({user_a['full_name']}, ID: {user_a['id']}, Role: {user_a['role']})")

    # 3. Register or Login Club Admin B (Coordinator)
    code, auth_b = req("/auth/login", method="POST", data={
        "email": "admin_b@tint.edu.in",
        "password": "AdminB@123",
        "section": "admin"
    })
    if code != 200:
        code, auth_b = req("/auth/register", method="POST", data={
            "full_name": "Coordinator B",
            "email": "admin_b@tint.edu.in",
            "password": "AdminB@123",
            "department": "Mechanical Engineering",
            "year": 4,
            "role": "coordinator"
        })
        assert code == 201, f"Register Admin B failed: {code} {auth_b}"
    token_b = auth_b["access_token"]
    user_b = auth_b["user"]
    hdr_b = {"Authorization": f"Bearer {token_b}"}
    print(f"[PASS] 3. Logged in as Club Admin B ({user_b['full_name']}, ID: {user_b['id']}, Role: {user_b['role']})")

    # 4. Login Student
    code, auth_s = req("/auth/login", method="POST", data={
        "email": "rahul@tint.edu.in",
        "password": "Student@123",
        "section": "student"
    })
    assert code == 200, f"Login Student failed: {code} {auth_s}"
    token_s = auth_s["access_token"]
    user_s = auth_s["user"]
    hdr_s = {"Authorization": f"Bearer {token_s}"}
    print(f"[PASS] 4. Logged in as Student ({user_s['full_name']}, ID: {user_s['id']}, Role: {user_s['role']})")

    # 5. Admin A charters Club A
    import uuid
    unique_suffix = uuid.uuid4().hex[:6]
    club_name = f"Robotics Society {unique_suffix}"
    code, club_a = req("/clubs", method="POST", headers=hdr_a, data={
        "name": club_name,
        "description": "High-octane collegiate robotics society building autonomous bots.",
        "category": "Technical",
        "recruitment_open": True
    })
    assert code == 201, f"Admin A create club failed: {code} {club_a}"
    club_a_id = club_a["id"]
    assert club_a["coordinator_id"] == user_a["id"]
    print(f"[PASS] 5. Admin A created club '{club_name}' (ID: {club_a_id}, coordinator_id: {club_a['coordinator_id']})")

    # 6. Admin A creates Event A under Club A
    code, ev_a = req("/events", method="POST", headers=hdr_a, data={
        "club_id": club_a_id,
        "title": f"Autonomous Bot Wars {unique_suffix}",
        "category": "Competition",
        "event_date": "2026-12-10T10:00:00",
        "location": "Robotics Arena Lab 102",
        "description": "Annual bot battling championship."
    })
    assert code == 201, f"Admin A create event failed: {code} {ev_a}"
    ev_a_id = ev_a["id"]
    print(f"[PASS] 6. Admin A created event '{ev_a['title']}' (ID: {ev_a_id}) under Club {club_a_id}")

    # 7. Admin A edits Club A
    updated_club_name = f"Robotics & Mechatronics Society {unique_suffix}"
    code, club_a_edited = req(f"/clubs/{club_a_id}", method="PATCH", headers=hdr_a, data={
        "name": updated_club_name,
        "description": "Updated mission: Autonomous rovers and advanced drones."
    })
    assert code == 200, f"Admin A edit club failed: {code} {club_a_edited}"
    assert club_a_edited["name"] == updated_club_name
    print(f"[PASS] 7. Admin A edited club successfully to '{updated_club_name}'")

    # 8. Student views updated club info
    code, student_view_club = req(f"/clubs/{club_a_id}", headers=hdr_s)
    assert code == 200
    assert student_view_club["name"] == updated_club_name
    assert student_view_club["user_status"] == "none"  # Not admin!
    print(f"[PASS] 8. Student views updated club information. user_status is '{student_view_club['user_status']}' (not admin).")

    # 9. Admin A edits Event A
    updated_ev_title = f"Autonomous Bot Wars Grand Finale {unique_suffix}"
    code, ev_a_edited = req(f"/events/{ev_a_id}", method="PATCH", headers=hdr_a, data={
        "title": updated_ev_title,
        "location": "Main University Sports Complex"
    })
    assert code == 200, f"Admin A edit event failed: {code} {ev_a_edited}"
    assert ev_a_edited["title"] == updated_ev_title
    print(f"[PASS] 9. Admin A edited event successfully to '{updated_ev_title}'")

    # 10. Student views updated event info
    code, student_view_ev = req(f"/events/{ev_a_id}", headers=hdr_s)
    assert code == 200
    assert student_view_ev["title"] == updated_ev_title
    assert student_view_ev["location"] == "Main University Sports Complex"
    print(f"[PASS] 10. Student views updated event globally.")

    # 11. RBAC CHECK: Student attempts to edit Club A -> 403 Forbidden
    code, err_student_club_patch = req(f"/clubs/{club_a_id}", method="PATCH", headers=hdr_s, data={"name": "Hacked Name"})
    assert code == 403, f"Expected 403 for student edit club, got {code}"
    print(f"[PASS] 11. Student edit club blocked by backend: 403 Forbidden")

    # 12. RBAC CHECK: Student attempts to delete Club A -> 403 Forbidden
    code, err_student_club_del = req(f"/clubs/{club_a_id}", method="DELETE", headers=hdr_s)
    assert code == 403, f"Expected 403 for student delete club, got {code}"
    print(f"[PASS] 12. Student delete club blocked by backend: 403 Forbidden")

    # 13. RBAC CHECK: Student attempts to edit Event A -> 403 Forbidden
    code, err_student_ev_patch = req(f"/events/{ev_a_id}", method="PATCH", headers=hdr_s, data={"title": "Hacked Event"})
    assert code == 403, f"Expected 403 for student edit event, got {code}"
    print(f"[PASS] 13. Student edit event blocked by backend: 403 Forbidden")

    # 14. RBAC CHECK: Student attempts to delete Event A -> 403 Forbidden
    code, err_student_ev_del = req(f"/events/{ev_a_id}", method="DELETE", headers=hdr_s)
    assert code == 403, f"Expected 403 for student delete event, got {code}"
    print(f"[PASS] 14. Student delete event blocked by backend: 403 Forbidden")

    # 15. RBAC CHECK: Admin B attempts to schedule event under Admin A's club -> 403 Forbidden
    code, err_admin_b_sched = req("/events", method="POST", headers=hdr_b, data={
        "club_id": club_a_id,
        "title": "Unauthorized Event",
        "category": "Workshop",
        "event_date": "2026-12-15T12:00:00",
        "location": "Room 101",
        "description": "Unauthorized attempt to schedule event"
    })
    assert code == 403, f"Expected 403 for Admin B scheduling under Admin A's club, got {code}"
    print(f"[PASS] 15. Admin B blocked from scheduling event under Admin A's club: 403 Forbidden")

    # 16. RBAC CHECK: Admin B attempts to edit Admin A's Event A -> 403 Forbidden
    code, err_admin_b_ev_patch = req(f"/events/{ev_a_id}", method="PATCH", headers=hdr_b, data={"title": "Tampered Event"})
    assert code == 403, f"Expected 403 for Admin B editing Admin A's event, got {code}"
    print(f"[PASS] 16. Admin B blocked from editing Admin A's event: 403 Forbidden")

    # 17. RBAC CHECK: Admin B attempts to delete Admin A's Event A -> 403 Forbidden
    code, err_admin_b_ev_del = req(f"/events/{ev_a_id}", method="DELETE", headers=hdr_b)
    assert code == 403, f"Expected 403 for Admin B deleting Admin A's event, got {code}"
    print(f"[PASS] 17. Admin B blocked from deleting Admin A's event: 403 Forbidden")

    # 18. RBAC CHECK: Admin B attempts to edit Admin A's Club A -> 403 Forbidden
    code, err_admin_b_club_patch = req(f"/clubs/{club_a_id}", method="PATCH", headers=hdr_b, data={"name": "Tampered Club"})
    assert code == 403, f"Expected 403 for Admin B editing Admin A's club, got {code}"
    print(f"[PASS] 18. Admin B blocked from editing Admin A's club: 403 Forbidden")

    # 19. RBAC CHECK: Admin B attempts to delete Admin A's Club A -> 403 Forbidden
    code, err_admin_b_club_del = req(f"/clubs/{club_a_id}", method="DELETE", headers=hdr_b)
    assert code == 403, f"Expected 403 for Admin B deleting Admin A's club, got {code}"
    print(f"[PASS] 19. Admin B blocked from deleting Admin A's club: 403 Forbidden")

    # 20. Admin A deletes Event A -> 200 OK
    code, del_ev_res = req(f"/events/{ev_a_id}", method="DELETE", headers=hdr_a)
    assert code == 200, f"Admin A delete event failed: {code} {del_ev_res}"
    print(f"[PASS] 20. Admin A deleted Event A successfully: {del_ev_res.get('message')}")

    # Verify Event A is gone from listings
    code, events_list = req("/events")
    assert all(e["id"] != ev_a_id for e in events_list)
    print(f"[PASS] 21. Event A verified removed from public event catalog")

    # 21. Admin A deletes Club A -> 200 OK
    code, del_club_res = req(f"/clubs/{club_a_id}", method="DELETE", headers=hdr_a)
    assert code == 200, f"Admin A delete club failed: {code} {del_club_res}"
    print(f"[PASS] 22. Admin A deleted Club A successfully: {del_club_res.get('message')}")

    # Verify Club A is gone from listings
    code, clubs_list = req("/clubs")
    assert all(c["id"] != club_a_id for c in clubs_list)
    print(f"[PASS] 23. Club A verified removed from public clubs catalog")

    print("\n" + "=" * 65)
    print("  ALL 23 TESTS PASSED! EDIT/DELETE & STRICT RBAC FULLY OPERATIONAL.")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
