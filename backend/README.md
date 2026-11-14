# ClubClash (CampusConnect) – Complete Backend

A production-ready, modular RESTful API built for university club discovery, membership recruitment workflows, event scheduling, and administrative governance.

Built for the **TINT Hackathon MVP** with zero unnecessary complexity and high maintainability.

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **API Framework** | **FastAPI** (v0.110+) | High-performance async ASGI web framework with automatic OpenAPI docs |
| **Database** | **SQLite** (`clubclash.db`) | Lightweight, self-contained relational database requiring zero external server setup |
| **ORM** | **SQLAlchemy** (v2.0+) | Python SQL toolkit, object-relational mapping, and safe transaction handling |
| **Data Validation** | **Pydantic** (v2.6+) | Request payload validation, schema definition, and response serialization |
| **Authentication** | **PyJWT** & **bcrypt** | Secure salted password hashing and stateless RFC 7519 JWT Bearer tokens |
| **Server** | **Uvicorn** | Lightning-fast ASGI server implementation |
| **Test Suite** | **pytest** & **TestClient** | In-memory unit and integration tests covering auth, RBAC, and business logic |
| **Cloud Services** | **Firebase Admin SDK** | Integration for Google Sign-In & Cloud Storage (`club-hub-9c2de`) |

---

## 📂 Project Folder Structure

```
backend/
├── main.py                 # FastAPI application factory, CORS, lifespan, and route registration
├── database.py             # SQLAlchemy engine, session factory, and get_db dependency
├── models.py               # Database entities: Student, Club, Application, Membership, Event, Announcement
├── schemas.py              # Pydantic v2 validation models, request schemas, and responses
├── auth.py                 # Bcrypt password hashing & JWT token encoding/decoding
├── dependencies.py         # Role-based access control (RBAC) and get_current_user dependencies
├── seed.py                 # Safe database seeder for demo accounts and initial campus data
├── firebase_auth.py        # Firebase Authentication & Storage bridge (club-hub-9c2de)
├── requirements.txt        # Python package dependencies
├── .env.example            # Environment variables template
├── .env                    # Active environment configuration
├── README.md               # Backend documentation, setup guide, and integration manual
│
├── routers/
│   ├── __init__.py
│   ├── auth.py             # Student registration, login, JWT token, and profile endpoints
│   ├── students.py         # Student profile lookups, memberships, and application history
│   ├── clubs.py            # Public catalog, category filters, recruitment toggle, member rosters
│   ├── applications.py     # Membership applications, duplicate check, and coordinator review
│   ├── events.py           # Campus events, hackathons, and workshop management
│   ├── dashboard.py        # Role-specific analytics (Student, Coordinator, Admin)
│   └── admin.py            # University Secretariat: user roles, coordinator assignments, stats
│
└── tests/
    ├── __init__.py
    ├── conftest.py         # In-memory SQLite test fixtures and mock authentication tokens
    ├── test_auth.py        # 7 tests: Registration, login, invalid credentials, and profile
    ├── test_clubs.py       # 7 tests: Catalog, search, RBAC creation, updates, and deletion
    ├── test_applications.py# 5 tests: Application submission, duplicate prevention, and approval
    └── test_events.py      # 5 tests: Event creation, retrieval, updates, and telemetry
```

---

## 🚀 Setup & Execution

### 1. Prerequisites
- Python 3.10+ installed (`python --version`)

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy the template `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key settings in `.env`:
```env
DATABASE_URL=sqlite:///./clubclash.db
SECRET_KEY=your-random-32-character-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,https://club-hub-inky.vercel.app
FIREBASE_PROJECT_ID=club-hub-9c2de
```

### 4. Seed Initial Demo Accounts & Clubs
Run the safe seeder script to populate initial users, clubs, and sample events:
```bash
python seed.py
```

#### Pre-seeded Demo Credentials:
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| 🎓 **Student** | `aditya@tint.edu.in` | `student123` | Apply to clubs, view memberships, register for events |
| ⚡ **Coordinator** | `gdsc.lead@tint.edu.in` | `coordinator123` | Manage GDSC, review applications, schedule club events |
| 🛡️ **Admin** | `admin@tint.edu.in` | `admin123` | Platform-wide Secretariat, assign coordinators, system stats |

### 5. Start the API Server
From the project root:
```bash
uvicorn backend.main:app --reload --port 8000
```
Or from inside `backend/`:
```bash
uvicorn main:app --reload --port 8000
```

The server will start at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📖 API Endpoints Reference

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new student (role is strictly `student`) | Public |
| `POST` | `/auth/login` | Sign in with email and password (returns JWT Bearer token) | Public |
| `POST` | `/auth/token` | OAuth2 form login for Swagger UI authorization | Public |
| `GET` | `/auth/me` | Get currently authenticated user profile | Authenticated |

### 👥 Students (`/students`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/students/me/memberships` | View all clubs joined by logged-in student | Student |
| `GET` | `/students/me/applications` | View all applications submitted by logged-in student | Student |
| `GET` | `/students/{student_id}` | View student profile by ID | Self / Coordinator / Admin |

### 🏛️ Clubs (`/clubs`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/clubs` | Browse all clubs (supports search, category, pagination) | Public |
| `GET` | `/clubs/search?q={query}` | Autocomplete search clubs by name or category | Public |
| `GET` | `/clubs/{club_id}` | Retrieve specific club details and coordinator info | Public |
| `GET` | `/clubs/{club_id}/members/count` | Get public count of active members in a club | Public |
| `GET` | `/clubs/{club_id}/events` | View all upcoming events hosted by this club | Public |
| `POST` | `/clubs` | Charter a new club | Coordinator / Admin |
| `PATCH` | `/clubs/{club_id}` | Update club details | Assigned Coordinator / Admin |
| `PATCH` | `/clubs/{club_id}/recruitment` | Toggle recruitment status (`open` / `closed`) | Assigned Coordinator / Admin |
| `DELETE` | `/clubs/{club_id}` | Permanently delete a club | Admin only |
| `GET` | `/clubs/{club_id}/members` | View full student member roster | Assigned Coordinator / Admin |
| `GET` | `/clubs/{club_id}/applications` | View all recruitment applications received | Assigned Coordinator / Admin |

### 📝 Applications (`/applications`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/applications` | Submit a club membership application | Student |
| `GET` | `/applications/my` | View all applications submitted by logged-in student | Student |
| `GET` | `/applications/{app_id}` | View application details | Applicant / Coordinator / Admin |
| `PATCH` | `/applications/{app_id}/status` | Review application (`Approved`, `Shortlisted`, `Rejected`) | Assigned Coordinator / Admin |

> **Business Logic Guarantee**: When an application status is set to `Approved`, the system executes a safe atomic database transaction that automatically creates a `Membership` record for the student in that club. Rejections never create memberships, and duplicate applications are strictly blocked.

### 📅 Events (`/events`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/events` | List all upcoming campus events and workshops | Public |
| `GET` | `/events/{event_id}` | View event details | Public |
| `POST` | `/events` | Schedule a new event | Assigned Coordinator / Admin |
| `PATCH` | `/events/{event_id}` | Update event details | Assigned Coordinator / Admin |
| `DELETE` | `/events/{event_id}` | Delete an event | Assigned Coordinator / Admin |

### 📊 Dashboard Analytics (`/dashboard`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/student` | Student metrics: total applications, pending, approved, clubs joined | Student |
| `GET` | `/dashboard/coordinator` | Coordinator metrics: applications received, member count, upcoming events | Coordinator / Admin |
| `GET` | `/dashboard/admin` | Global metrics: students, coordinators, clubs, applications, events | Admin only |

### 🛡️ Administration (`/admin`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/students` | List all registered users (filters: role, department, search) | Admin only |
| `PATCH` | `/admin/students/{id}/role` | Promote/demote a user (`student`, `coordinator`, `admin`) | Admin only |
| `POST` | `/admin/coordinators` | Create a verified coordinator account directly | Admin only |
| `PATCH` | `/admin/clubs/{id}/coordinator` | Assign/reassign a coordinator to a club | Admin only |
| `GET` | `/admin/applications` | Global review table of all applications | Admin only |
| `GET` | `/admin/memberships` | Global roster of all student memberships | Admin only |
| `GET` | `/admin/stats` | Overall university platform telemetry | Admin only |

---

## 🧪 Automated Testing

The backend includes a comprehensive automated test suite powered by `pytest` and FastAPI's `TestClient` using an isolated in-memory SQLite database (`sqlite:///:memory:`).

To execute the test suite:
```bash
python -m pytest -v backend/tests
```

### Test Coverage Summary:
* ✅ **24 / 24 Tests Passing (100% Success Rate)**
* `test_auth.py`: 7 tests verifying student registration, login, bad passwords, duplicate emails, and JWT validation.
* `test_clubs.py`: 7 tests verifying public discovery, search queries, RBAC on creation/updates, recruitment toggling, and admin-only deletion.
* `test_applications.py`: 5 tests verifying application submission, recruitment closed restrictions, duplicate application prevention, and automatic membership creation on approval.
* `test_events.py`: 5 tests verifying event scheduling, updates, deletion, and role-based dashboard telemetry.

---

## 🔌 Frontend Integration Guide

The existing frontend uses pure HTML5, CSS3, and ES6 JavaScript.

### 1. API Client Helper (`js/api.js`)
Create a lightweight API wrapper in your frontend:

```javascript
// js/api.js
const API_BASE_URL = "http://127.0.0.1:8000";

// Helper for authenticated requests
async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("clubclash_access_token");
  const headers = { "Content-Type": "application/json" };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "API request failed");
  }
  return data;
}
```

### 2. User Authentication Example
```javascript
// Login
async function login(email, password) {
  const result = await apiRequest("/auth/login", "POST", { email, password });
  localStorage.setItem("clubclash_access_token", result.access_token);
  localStorage.setItem("clubclash_user", JSON.stringify(result.user));
  return result.user;
}

// Register
async function register(studentData) {
  const result = await apiRequest("/auth/register", "POST", studentData);
  localStorage.setItem("clubclash_access_token", result.access_token);
  return result.user;
}
```

### 3. Submitting a Club Application
```javascript
async function applyToClub(clubId, reason, skills) {
  return await apiRequest("/applications", "POST", {
    club_id: clubId,
    reason_for_joining: reason,
    skills: skills
  });
}
```

### 4. Coordinator Approving Application
```javascript
async function approveApplication(applicationId) {
  return await apiRequest(`/applications/${applicationId}/status`, "PATCH", {
    status: "Approved"
  });
}
```

---

## 🔥 Firebase Integration Guide (`club-hub-9c2de`)

Firebase can be incorporated into ClubClash for enhanced cloud capabilities:
Project console: [https://console.firebase.google.com/project/club-hub-9c2de/](https://console.firebase.google.com/project/club-hub-9c2de/)

### What Firebase Provides:
1. **Firebase Authentication (Google & College SSO Sign-In)**:
   - Students can sign in with their `@tint.edu.in` Google account via the Firebase Web Client SDK.
   - The frontend obtains a Firebase ID Token (JWT) and passes it to the backend.
   - The backend validates the ID token using `backend/firebase_auth.py`, retrieves verified student credentials, and maps or creates a `Student` record in SQLite.
2. **Firebase Cloud Storage (Club Logos & Banners)**:
   - Storage bucket: `club-hub-9c2de.appspot.com`
   - Store club logos, event posters, and proof attachments with secure CDN download URLs stored in `image_url`.
3. **Firebase Cloud Messaging (FCM Push Notifications)**:
   - Send instant browser notifications to students when their application is **Approved** or **Shortlisted**.

### How to Enable Firebase in Backend:
1. In your Firebase Console for `club-hub-9c2de`, navigate to **Project Settings** &rarr; **Service Accounts**.
2. Click **Generate new private key** and download `serviceAccountKey.json`.
3. Save it to `backend/serviceAccountKey.json` (do not commit to Git).
4. In `backend/.env`, set:
   ```env
   FIREBASE_ENABLED=True
   FIREBASE_PROJECT_ID=club-hub-9c2de
   FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
   FIREBASE_STORAGE_BUCKET=club-hub-9c2de.appspot.com
   ```
5. Install `firebase-admin`:
   ```bash
   pip install firebase-admin
   ```
6. The provided `backend/firebase_auth.py` will automatically initialize and verify Firebase tokens.
