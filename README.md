# ClubHub — All-in-One Smart Campus Operating System

[![Live Production](https://img.shields.io/badge/Live%20Deployment-Vercel-black?style=for-the-badge&logo=vercel)](https://club-hub-inky.vercel.app)

* **Official Live Production URL:** [https://club-hub-inky.vercel.app](https://club-hub-inky.vercel.app) *(Note: Firebase domain `club-hub-9c2de.web.app` automatically 301 redirects here).*

**ClubHub** is an interactive, production-ready smart campus SaaS platform built using pure **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. It unifies extracurricular club management, central campus event ticketing, student-to-student peer marketplace, collaboration feed, corporate placement drives, and cryptographically verifiable digital achievement badges.

---

## 🎨 Live Coolors Theme & Palette Engine

ClubHub features a real-time **Theme & Palette Switcher** in the top navigation bar. When selected, the entire platform updates instantly across all pages with zero lag, persisted automatically to `localStorage`.

### Included Palettes:
1. **ClubHub Royal Blue** *(Default collegiate royal `#2563EB`, Navy `#1E3A8A`, Light `#F8FAFC`)*
2. **Olive & Earthy** *(Alabaster `#EFF1ED`, Olive Green `#717744`, Army Dark `#373D20`, Sage `#BCBD8B`, Wood Umber `#766153`)*
3. **Solar Blue & Amber** *(Teal Cyan `#219EBC`, Prussian Blue `#023047`, Sunburst Gold `#FFB703`, Amber `#FB8500`, Sky `#8ECAE6`)*
4. **Deep Ocean Gradient** *(Royal Blue `#0077B6`, Deep Navy `#023E8A`, Rich Midnight `#03045E`, Aqua `#00B4D8`, Ice `#CAF0F8`)*
5. **Nordic Sage & Pine** *(Midnight Green `#124559`, Rich Black `#01161E`, Sage Oat `#AEC3B0`, Air Force `#598392`, Cream `#EFF6E0`)*
6. **Warm Slate & Cream** *(Oxford Blue `#1D2D44`, Night `#0D1321`, Slate `#3E5C76`, Frost `#748CAB`, Eggshell `#F0EBD8`)*
7. **Indigo Steel Spectrum** *(Cobalt Blue `#0466C8`, Dark Cobalt `#0353A4`, Midnight `#002855`, Cool Grey `#5C677D`, Steel `#7D8597`)*
8. **Dusk & Lavender** *(Ultra Violet `#474973`, Deep Night `#161B33`, Rose Quartz `#A69CAC`, Peach Almond `#F1DAC4`)*
9. **Classic Oxford Blues** *(Prussian `#1D3461`, Lapis Lazuli `#1F487E`, Air Force `#376996`, Carolina `#6290C8`, Shadow `#829CBC`)*

---

## 🚀 Key Modules & Pages

### 1. Landing Page (`index.html`)
* Comprehensive smart campus overview showcasing clubs, upcoming hackathons, marketplace exchange, and corporate internships.
* High-level statistics: *30+ Active Clubs*, *2,400+ Registered Students*, *₹15L+ Hackathon & Stipend Pool*.
* Direct routing into all campus suites.

### 2. Campus Events & Workshops Hub (`events.html`)
* Discover campus hackathons (*HackTINT 2026*), combat robowars, full-stack codelabs, and acoustic cultural concerts.
* Filter by category chips (*Hackathon*, *Robowars & Contests*, *Workshops*, *Cultural*, *Entrepreneurship*) and real-time search.
* Interactive **Digital Entry Pass Generator** with unique pass codes (e.g. `PASS-8492-EVT-01`) and simulated QR code matrix for entry verification.
* Ability for club coordinators and admins to schedule and publish new campus events.

### 3. Student Campus Marketplace (`marketplace.html`)
* Peer-to-peer student marketplace for engineering essentials:
  * Textbooks: *Higher Engineering Mathematics (B.S. Grewal)*, *Operating System Concepts (Galvin)*.
  * Instruments: *Casio FX-991CW Scientific Calculator*, *Omega Precision Mini Drafter*, *Chemistry Lab Apron*.
  * Electronics: *Arduino UNO Kit with 30+ Sensors*.
* Filter by categories (*Books*, *Equipment*, *Electronics*) and sort by Price or Recency.
* Direct **Contact Seller Modal** with instant WhatsApp direct-chat link and email prompts.
* **"List an Item for Sale" Modal** with immediate persistence.

### 4. Student Peer Network & Collab Feed (`network.html`)
* Active campus discussion feed with topic chips: `#HackathonTeam`, `#StudyGroup`, `#ProjectCollab`, `#CampusLife`.
* Find hackathon partners for Smart India Hackathon (SIH 2026), organize MAKAUT exam study circles, or recruit drone/robotics hardware collaborators.
* Real-time post creation, live upvoting counter, and interactive comment replies.

### 5. Campus Placement & Recruiter Portal (`recruiters.html`)
* Campus hiring drives from enterprise partners: *Microsoft India*, *Google India*, *Tata Consultancy Services (TCS)*, *Swiggy Engineering*.
* Detailed listings: Stipends (up to *₹1,25,000/mo*), eligibility, skills, and deadlines.
* Interactive **"Apply for Internship" Modal** allowing students to attach their verified campus achievement badges alongside their resume and GPA.

### 6. Corporate Recruiter Dashboard (`recruiter-dashboard.html`)
* Dedicated talent acquisition portal for recruiters (*Priya Raman, Microsoft India*).
* Live metrics: Active Drives, Total Student Applicants, Shortlisted Candidates.
* Candidate screening table displaying applicant CGPA, GitHub profiles, verified credential badges, and direct recruitment status updating (*Under Review*, *Shortlisted*, *Accepted*).
* Modal to post new campus hiring drives.

### 7. Student Command Center (`dashboard.html`)
* Unified 6-tab student portal:
  1. **Club Applications**: Candidacy tracking with status badges (*Pending Review*, *Shortlisted*, *Approved*, *Rejected*) and withdrawal option.
  2. **Registered Event Passes**: Digital pass viewer with simulated QR badges.
  3. **My Marketplace Items**: Track listed products and mark items as Sold.
  4. **My Collab Posts**: Monitor post upvotes and replies.
  5. **Internship Applications**: Track recruiter review notes and interview selections.
  6. **Verified Credentials & Badges**: Cryptographically verifiable badges (*TINT SIH Winner*, *GDSC Lead*, *Dean's List*) with unique hash IDs.

### 8. Club Admin Secretariat (`admin.html`)
* Candidate application review table with live status updates and interview notes.
* Integrated Events Manager to schedule and publish events directly to `events.html`.
* "Add New Club" modal to charter new student societies dynamically.

### 9. 1-Click Instant Demo Authentication (`login.html` & `register.html`)
* Role-based routing supporting:
  * 🎓 **Student Demo**: `aditya@tint.edu.in` &rarr; Redirects to `dashboard.html`
  * ⚡ **Club Lead Demo**: `gdsc.lead@tint.edu.in` &rarr; Redirects to `admin.html`
  * 💼 **Recruiter Demo**: `campus.hiring@microsoft.com` &rarr; Redirects to `recruiter-dashboard.html`

---

## 💻 How to Run Locally

No build tools, compilation steps, or runtime package managers (`npm`, `pnpm`, `docker`) required!

### Option 1: Direct File Opening
Double-click `index.html` in your file manager or right-click `index.html` &rarr; **Open with Browser**.

### Option 2: Local HTTP Server (Python)
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in any modern web browser.

---

## 📂 File Architecture

```text
club-hub/
├── index.html                 # Smart Campus Suite Landing Page
├── clubs.html                 # University Societies Catalog
├── club-details.html          # Dynamic Club Profile & Application Modal
├── events.html                # Campus Events & Digital Pass Ticketing Hub
├── marketplace.html           # Peer-to-Peer Student Marketplace
├── network.html               # Collab Feed & Teammate Finder
├── recruiters.html            # Campus Placements & Internship Drives
├── recruiter-dashboard.html   # Recruiter Talent Acquisition Portal
├── dashboard.html             # Unified 6-Tab Student Command Center
├── admin.html                 # Club Coordinator Secretariat & Event Scheduler
├── login.html                 # 1-Click Demo & Student Sign In
├── register.html              # Student Registration Page
├── css/
│   ├── style.css              # Global variables, typography & layout
│   ├── palette.css            # 8 Coolors custom palettes & dropdown styling
│   ├── components.css         # Buttons, badges, modals, form controls
│   ├── home.css               # Landing page layouts
│   ├── clubs.css              # Clubs directory styling
│   ├── club-details.css       # Club detail & banner layouts
│   ├── events.css             # Event cards, date badges & pass cards
│   ├── marketplace.css        # Product cards & pricing badges
│   ├── network.css            # Social post feed & comments drawer
│   ├── recruiters.css         # Job cards, applicant review tables
│   ├── dashboard.css          # Student command center & badges grid
│   ├── admin.css              # Secretariat tables & management
│   └── auth.css               # Sign in & registration layouts
└── js/
    ├── data.js                # Curated TINT/engineering seed data & badges
    ├── storage.js             # LocalStorage reactive persistence layer
    ├── palette.js             # Live Coolors theme switcher engine
    ├── common.js              # Navbar auth, mobile drawer, toasts & formatting
    ├── home.js                # Landing page interactive logic
    ├── clubs.js               # Club catalog search & filter controller
    ├── club-details.js        # Dynamic club profile controller
    ├── events.js              # Events hub, registration & digital pass logic
    ├── marketplace.js         # Marketplace filtering, listing & contact logic
    ├── network.js             # Collab feed upvotes, comments & post creation
    ├── recruiters.js          # Internship portal & student application logic
    ├── recruiter-dashboard.js  # Recruiter candidate review & job posting logic
    ├── dashboard.js           # Student 6-tab command center controller
    ├── admin.js               # Club secretariat candidate & event manager
    └── auth.js                # Role authentication & demo switcher
```
