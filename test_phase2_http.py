"""
test_phase2_http.py
Tests the running server at http://127.0.0.1:8000 using standard library urllib.
"""

import json
import urllib.request
import urllib.error

# Disable proxy for localhost in test client
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
    print("Testing running ClubHub server at", BASE)

    # 1. Health check
    code, data = req("/health")
    assert code == 200, f"Health check failed: {code} {data}"
    print("[PASS] 1. Health check operational:", data["status"])

    # 2. Login Student
    code, student_auth = req("/auth/login", method="POST", data={
        "email": "rahul@tint.edu.in",
        "password": "Student@123",
        "section": "student"
    })
    assert code == 200, f"Student login failed: {code} {student_auth}"
    student_token = student_auth["access_token"]
    student_hdr = {"Authorization": f"Bearer {student_token}"}
    print("[PASS] 2. Student logged in:", student_auth["user"]["full_name"])

    # 3. Login Admin
    code, admin_auth = req("/auth/login", method="POST", data={
        "email": "coord@tint.edu.in",
        "password": "Coord@123",
        "section": "admin"
    })
    assert code == 200, f"Admin login failed: {code} {admin_auth}"
    admin_token = admin_auth["access_token"]
    admin_hdr = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 3. Club Admin logged in:", admin_auth["user"]["full_name"])

    # 4. View profile
    code, prof = req("/students/profile", headers=student_hdr)
    assert code == 200
    assert prof["email"] == "rahul@tint.edu.in"
    print("[PASS] 4. GET /students/profile returns active profile")

    # 5. Update profile
    code, updated = req("/students/profile", method="PATCH", headers=student_hdr, data={
        "full_name": "Rahul Verma Phase2",
        "department": "Electronics & Communication",
        "year": 3
    })
    assert code == 200
    assert updated["full_name"] == "Rahul Verma Phase2"
    assert updated["role"] == "student"
    print("[PASS] 5. PATCH /students/profile updated name, department, year. Role remained strictly 'student'.")

    # 6. Duplicate email rejection
    code, err = req("/students/profile", method="PATCH", headers=student_hdr, data={
        "email": "coord@tint.edu.in"
    })
    assert code == 400
    print("[PASS] 6. Duplicate email update rejected with 400:", err.get("detail"))

    # 7. Multipart file upload test
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    
    parts = []
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(b'Content-Disposition: form-data; name="file"; filename="test_avatar.png"\r\n')
    parts.append(b'Content-Type: image/png\r\n\r\n')
    parts.append(image_bytes)
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    multipart_data = b"".join(parts)

    upload_req = urllib.request.Request(
        f"{BASE}/upload",
        data=multipart_data,
        headers={
            "Authorization": f"Bearer {student_token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        },
        method="POST"
    )
    with urllib.request.urlopen(upload_req) as resp:
        assert resp.getcode() == 201
        upload_json = json.loads(resp.read().decode())
        avatar_url = upload_json["url"]
        print("[PASS] 7. POST /upload succeeded, generated:", avatar_url)

    # 8. Verify static serving of uploaded image
    code, img_res = req(avatar_url)
    assert code == 200
    print("[PASS] 8. Static file serving at /uploads/ is functional")

    # 9. Set and Remove Avatar
    code, avatar_set = req("/students/profile", method="PATCH", headers=student_hdr, data={"avatar_url": avatar_url})
    assert code == 200
    assert avatar_set["avatar_url"] == avatar_url
    print("[PASS] 9. Profile updated with avatar URL")

    code, avatar_del = req("/students/profile", method="PATCH", headers=student_hdr, data={"avatar_url": ""})
    assert code == 200
    assert avatar_del["avatar_url"] is None
    print("[PASS] 10. Profile picture removed and set to None")

    # 10. Create, Edit, Delete Collab Post
    code, post = req("/network/posts", method="POST", headers=student_hdr, data={
        "title": "Need Fullstack Teammates for Hackathon",
        "tag": "#HackathonTeam",
        "content": "Looking for Node/React teammates."
    })
    assert code == 201
    post_id = post["id"]
    print(f"[PASS] 11. Created post ID {post_id}")

    # Edit post by author
    code, edited_post = req(f"/network/posts/{post_id}", method="PATCH", headers=student_hdr, data={
        "title": "Need 2 Fullstack Teammates for HackTINT 2026",
        "tag": "#HackathonTeam",
        "content": "Updated: need 1 frontend and 1 backend teammate."
    })
    assert code == 200
    assert edited_post["title"] == "Need 2 Fullstack Teammates for HackTINT 2026"
    print("[PASS] 12. Author edited post successfully")

    # Unauthorized edit rejection
    code, unauth_edit = req(f"/network/posts/{post_id}", method="PATCH", headers=admin_hdr, data={
        "title": "Unauthorized title"
    })
    assert code == 403
    print("[PASS] 13. Unauthorized edit rejected with 403 Forbidden")

    # Author deletes post
    code, del_resp = req(f"/network/posts/{post_id}", method="DELETE", headers=student_hdr)
    assert code == 200
    print("[PASS] 14. Author deleted post successfully")

    # 11. Club Admin: Event Registration Block
    code, events = req("/events")
    assert code == 200
    assert len(events) > 0
    evt_id = events[0]["id"]

    code, admin_evt_reg = req(f"/events/{evt_id}/register", method="POST", headers=admin_hdr)
    assert code == 400
    assert "Club Admins have direct organizer access" in admin_evt_reg.get("detail", "")
    print("[PASS] 15. Club Admin event registration blocked (Admin Access badge applies)")

    # 12. Dedicated Join Requests Tracker data
    code, my_clubs = req("/students/my-clubs", headers=student_hdr)
    assert code == 200
    assert "all_requests" in my_clubs
    assert "pending_requests" in my_clubs
    assert "rejected_requests" in my_clubs
    assert "approved_requests" in my_clubs
    print("[PASS] 16. GET /students/my-clubs provides full join requests tracker data")

    print("\n" + "=" * 65)
    print("  ALL 16 E2E HTTP TESTS PASSED AGAINST LOCALHOST:8000!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
