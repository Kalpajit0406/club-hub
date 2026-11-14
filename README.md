# CampusConnect — Modern College Club & Organization Platform

An interactive, production-ready SaaS platform built using pure **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. CampusConnect streamlines extracurricular student life, club discovery, recruitment drives, membership tracking, and leadership administration for university organizations.

---

## 🎨 Design System & Visual Identity

* **Brand Name**: CampusConnect
* **Design Philosophy**: Minimal, modern, trustworthy, student-friendly SaaS interface with subtle borders, elevation shadows, and whitespace.
* **Exact Color Palette**:
  * **Primary Blue**: `#2563EB`
  * **Deep Navy**: `#1E3A8A`
  * **Dark Text**: `#0F172A`
  * **Secondary Text**: `#64748B`
  * **Page Background**: `#F8FAFC`
  * **Card Background**: `#FFFFFF`
  * **Border**: `#E2E8F0`
  * **Success**: `#16A34A`
  * **Warning**: `#D97706`
  * **Danger**: `#DC2626`
* **Typography**:
  * Headings: **Plus Jakarta Sans** (48–56px for Hero, 30–36px for Sections, 18–20px for Cards)
  * Body, Navigation, Forms & Buttons: **Inter** (14–16px body, 12–13px labels)
* **Consistent Geometry**:
  * Max container width: `1200px`
  * Card radius: `14px` (consistent 12–16px system)
  * Button heights: `40px` (standard), `34px` (small), `48px` (large)
  * Input heights: `42px` with `0 0 0 3px rgba(37, 99, 235, 0.15)` focus rings
  * Micro-interactions: `translateY(-3px)` card hover with soft shadow transitions (150–220ms)

---

## 🚀 Key Pages & Features

### 1. Landing Page (`index.html`)
* Hero banner with Plus Jakarta Sans typography, recruitment season live badge, and subtle SaaS blueprint background pattern.
* Instant search bar with search icon and direct catalog routing.
* Elevated 3-metric statistics card (*30+ Active Clubs*, *1,800+ Student Members*, *60+ Annual Events*).
* Category exploration grid with soft blue icon boxes and live club count.
* Featured clubs cards with verified chapter badges, uniform aspect ratios, and "Apply Now" buttons.
* Value propositions ("Real-World Projects & Mentorship", "Live Application Tracking", "Official Campus Verification").
* High-contrast Deep Navy CTA banner.

### 2. Explore Clubs Directory (`clubs.html`)
* Real-time debounced live search across club names, acronyms (*GDSC*, *DebSoc*, *ARS*), domains, and tags.
* Category filter chips (*All*, *Technical*, *Cultural*, *Sports*, *Literary*, *Social*, *Entrepreneurship*).
* Secondary filters: Recruitment status dropdown (*Recruiting Now* vs. *Recruitment Closed*) and sorting (*Recommended*, *Alphabetical A–Z*, *Most Members*, *Newest*).
* Responsive club card grid with verified checkmark, category badge, pulsing recruitment indicator, and bookmark heart.

### 3. Club Details & Overview (`club-details.html?id=<club-id>`)
* Single dynamic page driven by URL query parameters.
* 260px cover banner with dark gradient vignette and overlapping 110px logo.
* Header with verified checkmark, category badge, members counter, established year, and official social handles.
* Organized sections:
  1. **About the Organization** & meeting schedule box.
  2. **Wings & Domains Open for Application** (interactive domain pills).
  3. **Upcoming Events & Workshops** (date badge, venue, and attendee counters).
  4. **Key Highlights & Recent Achievements**.
  5. **Leadership & Contacts** (Coordinator cards with direct email links).
* Sticky recruitment sidebar widget with eligibility criteria and primary "Apply Now" action.
* Native HTML5 `<dialog id="applyModal">` with multi-field validation (Roll No, Year, Branch, Domain, Statement of Purpose, Portfolio Link).

### 4. Student Dashboard & Application Tracker (`dashboard.html`)
* Student profile banner (Aditya Verma, Roll No: 2023CSB1042, Computer Science & Engineering).
* Redesigned 3-stat metric cards (*Applications Submitted*, *In Review / Shortlisted*, *Saved Bookmarks*).
* Tabbed view:
  * **My Applications**: Cards with live status badges (*Pending Review* in Warning Amber, *Shortlisted* in Primary Blue, *Approved & Accepted* in Success Green, *Not Shortlisted* in Danger Red), submission timestamps, and coordinator interview notes.
  * **Saved Bookmarks**: Quick access grid of bookmarked clubs with instant un-saving.
* Withdraw application workflow with confirmation prompt.

### 5. Authentication Frontend (`login.html` & `register.html`)
* **Student Sign In (`login.html`)**: College email validation, password show/hide toggle, "Remember me", and quick demo account auto-fill.
* **Student Registration (`register.html`)**: Clean 2-column input grid for student registration (Name, Roll Number, Year, Branch, College Email, Password confirmation).
* Client-side session persistence via `localStorage` with dynamic navbar avatar and logout controls.

---

## 💻 How to Run Locally

### Option 1: Direct File Opening
Double-click `index.html` in your file manager or right-click `index.html` -> **Open with Browser**.

### Option 2: Local HTTP Server (Python)
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 📂 File Architecture

```text
club-hub/
├── index.html                 # Homepage
├── clubs.html                 # Explore Clubs Catalog
├── club-details.html          # Dynamic Club Overview
├── dashboard.html             # Student Application Tracker
├── login.html                 # Student Sign In Page
├── register.html              # Student Registration Page
├── README.md                  # Documentation
├── css/
│   ├── style.css              # Global tokens, Plus Jakarta Sans & Inter, layout, header & footer
│   ├── components.css         # Buttons, badges, cards, native <dialog>, tables, toasts
│   ├── auth.css               # Centered SaaS auth card, password toggles, alert banners
│   ├── home.css               # Hero search, elevated stats card, value cards, CTA banner
│   ├── clubs.css              # Catalog filters, chips, secondary dropdowns, card grid
│   ├── club-details.css       # Cover image section, verified header, event cards, sticky widget
│   └── dashboard.css          # Student profile card, application tracking cards
└── js/
    ├── data.js                # Database: 8 clubs, categories, seeded applications, events, members
    ├── storage.js             # LocalStorage manager: applications, users, auth session, bookmarks
    ├── auth.js                # Login & Registration handlers, password toggles, validation
    ├── common.js              # Navbar auth state renderer, toast system, mobile drawer
    ├── home.js                # Home page stats counter, category cards, featured clubs
    ├── clubs.js               # Search debouncing, category/status filters, sorting
    ├── club-details.js        # Parameter routing (?id=...), event injector, apply modal
    └── dashboard.js           # Student application tracking, profile sync, withdraw action
```
