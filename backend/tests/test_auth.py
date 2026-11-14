"""
backend/tests/test_auth.py
Automated Tests for Authentication: Registration, Login, Token Generation, and Current User.
"""

def test_student_registration_success(client):
    payload = {
        "full_name": "Riya Sen",
        "email": "riya.sen@tint.edu.in",
        "password": "strongPassword123!",
        "department": "Electronics & Communication",
        "year": 2
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "riya.sen@tint.edu.in"
    assert data["user"]["role"] == "student"  # Strictly 'student'
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_student_registration_duplicate_email(client, seed_users):
    payload = {
        "full_name": "Duplicate Student",
        "email": "student@tint.edu.in",  # already exists in seed_users
        "password": "Password123!",
        "department": "Civil Engineering",
        "year": 1
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client, seed_users):
    payload = {
        "email": "student@tint.edu.in",
        "password": "student123"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Test Student"


def test_login_invalid_password(client, seed_users):
    payload = {
        "email": "student@tint.edu.in",
        "password": "wrongpassword"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_nonexistent_email(client, seed_users):
    payload = {
        "email": "nobody@tint.edu.in",
        "password": "Password123!"
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 401


def test_get_current_user_profile(client, seed_users):
    headers = seed_users["student_headers"]
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "student@tint.edu.in"
    assert data["role"] == "student"


def test_unauthenticated_access_rejected(client):
    response = client.get("/auth/me")
    assert response.status_code == 401

