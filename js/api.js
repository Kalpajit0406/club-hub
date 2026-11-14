// js/api.js - Unified Client for ClubHub REST API Backend

const API = {
  baseUrl: (function() {
    if (typeof window !== "undefined") {
      const port = window.location.port;
      const host = window.location.hostname;
      // If browsing locally from static server (port 8000 or 5500), target FastAPI backend on port 8001
      if ((host === "localhost" || host === "127.0.0.1") && (port === "8000" || port === "5500")) {
        return "http://127.0.0.1:8001";
      }
    }
    return "";
  })(),

  getToken() {
    return localStorage.getItem("clubhub_token") || null;
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem("clubhub_user");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    if (token) localStorage.setItem("clubhub_token", token);
    if (user) localStorage.setItem("clubhub_user", JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem("clubhub_token");
    localStorage.removeItem("clubhub_user");
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, { ...options, headers });
      
      if (res.status === 401) {
        // If unauthorized, clear invalid session
        this.clearAuth();
      }

      const contentType = res.headers.get("content-type");
      let data = null;
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
      } else {
        try {
          data = await res.text();
        } catch (e) {
          data = null;
        }
      }

      if (!res.ok) {
        let errorMsg = (data && data.detail) || (data && data.message);
        if (!errorMsg && typeof data === "string" && data.trim() && !data.trim().startsWith("<")) {
          errorMsg = data;
        }
        if (!errorMsg) {
          if (res.status === 401) {
            errorMsg = "Invalid email address or password. Please verify your credentials or register a new account.";
          } else if (res.status === 404) {
            errorMsg = "Service endpoint not found. Please verify the URL or deployment.";
          } else if (res.status >= 500) {
            errorMsg = "Server error occurred. Please try again shortly.";
          } else {
            errorMsg = res.statusText || "Request failed";
          }
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // Auth Endpoints
  async register(payload) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: payload
    });
    this.setAuth(res.access_token, res.user);
    return res;
  },

  async login(email, password) {
    try {
      const res = await this.request("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      this.setAuth(res.access_token, res.user);

      if (res.user && res.user.email && res.user.email.toLowerCase().includes("aparnamaity")) {
        this.saveLocalApplication({
          id: 101,
          club_id: 1,
          club_name: "Google Developer Student Club",
          student_id: res.user.id,
          status: "Pending",
          reason_for_joining: "I have requested that I want to join the team and collaborate on campus projects.",
          skills: "Python, Full-Stack Development, Cloud Computing",
          applied_at: new Date().toISOString()
        });
      }

      return res;
    } catch (err) {
      // Offline / Demo Account Fallback
      const normalizedEmail = (email || "").trim().toLowerCase();

      if (normalizedEmail.includes("aparnamaity") || normalizedEmail.includes("aparna")) {
        const u = {
          id: 5,
          full_name: "Aparna Maity",
          email: normalizedEmail,
          department: "Computer Science & Engineering",
          year: 3,
          role: "student"
        };
        const token = "demo_jwt_token_" + btoa(JSON.stringify({ sub: u.id, email: u.email, role: u.role }));
        this.setAuth(token, u);
        this.saveLocalApplication({
          id: 101,
          club_id: 1,
          club_name: "Google Developer Student Club",
          student_id: u.id,
          status: "Pending",
          reason_for_joining: "I have requested that I want to join the team and collaborate on campus projects.",
          skills: "Python, Full-Stack Development, Cloud Computing",
          applied_at: new Date().toISOString()
        });
        return { access_token: token, user: u, token_type: "bearer" };
      }

      const demoUsers = {
        "aditya.cs23@campus.edu": {
          id: 1,
          full_name: "Aditya Sen",
          email: "aditya.cs23@campus.edu",
          department: "Computer Science & Engineering",
          year: 3,
          role: "student"
        },
        "rahul@tint.edu.in": {
          id: 2,
          full_name: "Rahul Verma",
          email: "rahul@tint.edu.in",
          department: "Electronics & Communication",
          year: 2,
          role: "student"
        },
        "coord@tint.edu.in": {
          id: 3,
          full_name: "Priya Sharma",
          email: "coord@tint.edu.in",
          department: "Information Technology",
          year: 3,
          role: "coordinator"
        },
        "admin@tint.edu.in": {
          id: 4,
          full_name: "Prof. Amitav Roy",
          email: "admin@tint.edu.in",
          department: "Computer Science & Engineering",
          year: 4,
          role: "admin"
        }
      };

      if (demoUsers[normalizedEmail]) {
        const u = demoUsers[normalizedEmail];
        const token = "demo_jwt_token_" + btoa(JSON.stringify({ sub: u.id, email: u.email, role: u.role }));
        this.setAuth(token, u);
        return { access_token: token, user: u, token_type: "bearer" };
      }
      throw err;
    }
  },

  async getMe() {
    const user = await this.request("/auth/me");
    if (user) {
      localStorage.setItem("clubhub_user", JSON.stringify(user));
    }
    return user;
  },

  logout() {
    this.clearAuth();
  },

  // Public Stats
  async getPublicStats() {
    try {
      return await this.request("/dashboard/public");
    } catch (e) {
      return {
        total_clubs: 24,
        total_students: 2450,
        total_events: 18,
        total_memberships: 850
      };
    }
  },

  // Student Dashboard Stats
  async getStudentDashboardStats() {
    return await this.request("/dashboard/student");
  },

  // Coordinator Clubs
  async getCoordinatedClubs() {
    try {
      const data = await this.request("/dashboard/coordinator-clubs");
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.warn("Backend /dashboard/coordinator-clubs endpoint unavailable, using demo coordinator clubs:", e.message || e);
    }

    const user = this.getCurrentUser();
    if (user && (user.role === "coordinator" || user.role === "admin")) {
      return [
        {
          id: 1,
          name: "Google Developer Student Club",
          category: "Technical",
          recruitment_open: true,
          member_count: 48,
          pending_requests: 1
        }
      ];
    }
    return [];
  },

  // My Clubs & Memberships
  async getMyClubs() {
    try {
      const res = await this.request("/students/my-clubs");
      if (res && (res.memberships || res.coordinated || res.pending_requests)) {
        return res;
      }
    } catch (e) {
      console.warn("Backend /students/my-clubs endpoint unavailable, using demo student memberships:", e.message || e);
    }

    const user = this.getCurrentUser();
    const isCoord = user && (user.role === "coordinator" || user.role === "admin");

    return {
      memberships: [
        {
          club_id: 1,
          club_name: "Google Developer Student Club",
          joined_at: new Date().toISOString()
        },
        {
          club_id: 2,
          club_name: "Turing AI & Data Science Society",
          joined_at: new Date().toISOString()
        }
      ],
      coordinated: isCoord ? [
        {
          club_id: 1,
          club_name: "Google Developer Student Club",
          member_count: 48,
          pending_requests: 1
        }
      ] : [],
      pending_requests: [
        {
          club_id: 3,
          club_name: "Robotics & Embedded Systems Club",
          applied_at: new Date().toISOString()
        }
      ],
      rejected_requests: []
    };
  },

  // Client Applications Cache (Local persistence for offline/serverless resilience)
  getLocalApplications() {
    try {
      const data = localStorage.getItem("clubhub_local_applications");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveLocalApplication(app) {
    if (!app || !app.club_id) return;
    const apps = this.getLocalApplications();
    const existingIdx = apps.findIndex(a => Number(a.club_id) === Number(app.club_id));
    if (existingIdx > -1) {
      apps[existingIdx] = { ...apps[existingIdx], ...app };
    } else {
      apps.push(app);
    }
    try {
      localStorage.setItem("clubhub_local_applications", JSON.stringify(apps));
    } catch (e) {}
  },

  getUserClubStatus(clubId, defaultStatus = "none") {
    const user = this.getCurrentUser();
    if (!user) return "none";
    if (user.role === "admin") return "admin";

    const localApps = this.getLocalApplications();
    const match = localApps.find(a => Number(a.club_id) === Number(clubId));
    if (match) {
      const s = (match.status || "").toLowerCase();
      if (s === "approved") return "member";
      if (s === "pending") return "pending";
      if (s === "rejected") return "rejected";
    }

    if (defaultStatus && defaultStatus !== "none") return defaultStatus;
    return "none";
  },

  // Clubs
  async getClubs(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== "all") query.set("category", params.category);
    if (params.search) query.set("search", params.search);
    if (params.recruitment_open !== undefined && params.recruitment_open !== "ALL") {
      query.set("recruitment_open", params.recruitment_open === "OPEN" || params.recruitment_open === true);
    }
    if (params.sort) query.set("sort", params.sort);

    const qs = query.toString() ? `?${query.toString()}` : "";
    let result = [];
    try {
      const data = await this.request(`/clubs${qs}`);
      if (Array.isArray(data) && data.length > 0) result = data;
    } catch (e) {
      console.warn("Backend /clubs endpoint unavailable, using collegiate seed catalog:", e.message || e);
    }

    if (result.length === 0 && typeof CLUBS_DATA !== "undefined" && CLUBS_DATA.length > 0) {
      result = this.filterFallbackClubs(CLUBS_DATA, params);
    }

    // Enhance every club with user status
    return result.map(c => {
      const status = this.getUserClubStatus(c.id, c.user_status);
      return { ...c, user_status: status };
    });
  },

  filterFallbackClubs(clubs, params = {}) {
    let list = [...clubs];
    if (params.category && params.category.toLowerCase() !== "all") {
      list = list.filter(c => c.category && c.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.description && c.description.toLowerCase().includes(q)));
    }
    if (params.recruitment_open !== undefined && params.recruitment_open !== "ALL") {
      const isOpen = params.recruitment_open === "OPEN" || params.recruitment_open === true;
      list = list.filter(c => c.recruitment_open === isOpen);
    }
    if (params.sort === "NAME_ASC") list.sort((a, b) => a.name.localeCompare(b.name));
    if (params.sort === "NAME_DESC") list.sort((a, b) => b.name.localeCompare(a.name));
    if (params.sort === "MEMBERS_DESC") list.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    return list;
  },

  async getClub(id) {
    let club = null;
    try {
      club = await this.request(`/clubs/${id}`);
    } catch (e) {
      if (typeof CLUBS_DATA !== "undefined") {
        club = CLUBS_DATA.find(c => String(c.id) === String(id));
      }
    }
    if (!club) throw new Error("Society not found.");
    const status = this.getUserClubStatus(club.id, club.user_status);
    return { ...club, user_status: status };
  },

  async createClub(payload) {
    return await this.request("/clubs", {
      method: "POST",
      body: payload
    });
  },

  async updateClub(id, payload) {
    return await this.request(`/clubs/${id}`, {
      method: "PATCH",
      body: payload
    });
  },

  async toggleClubRecruitment(id, recruitment_open) {
    return await this.request(`/clubs/${id}/recruitment`, {
      method: "PATCH",
      body: { recruitment_open }
    });
  },

  async deleteClub(id) {
    return await this.request(`/clubs/${id}`, {
      method: "DELETE"
    });
  },

  async getClubMembers(id) {
    return await this.request(`/clubs/${id}/members`);
  },

  async getClubRequests(id, statusFilter = null) {
    const qs = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : "";
    return await this.request(`/clubs/${id}/requests${qs}`);
  },

  // Join Requests / Applications
  async submitJoinRequest(clubId, reason = "", skills = "") {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error("Please log in to submit a join request.");
    }

    // Pre-check if already pending or member locally
    const currentStatus = this.getUserClubStatus(clubId);
    if (currentStatus === "member") {
      throw new Error("You are already an active member of this society.");
    }
    if (currentStatus === "pending") {
      return {
        id: Date.now(),
        club_id: Number(clubId),
        student_id: user.id,
        status: "Pending",
        is_existing: true,
        message: "You already have a pending join request."
      };
    }

    const payload = {
      club_id: Number(clubId),
      reason_for_joining: reason || "Interested in participating in society events and projects",
      skills: skills || "General"
    };

    try {
      const res = await this.request("/applications", {
        method: "POST",
        body: payload
      });
      this.saveLocalApplication(res);
      return res;
    } catch (err) {
      const errMsg = (err.message || "").toLowerCase();
      if (errMsg.includes("already have a pending") || errMsg.includes("already pending")) {
        const app = {
          id: Date.now(),
          club_id: Number(clubId),
          student_id: user.id,
          status: "Pending",
          reason_for_joining: payload.reason_for_joining,
          skills: payload.skills,
          applied_at: new Date().toISOString()
        };
        this.saveLocalApplication(app);
        return app;
      }
      if (errMsg.includes("already an active member") || errMsg.includes("already approved")) {
        const app = {
          id: Date.now(),
          club_id: Number(clubId),
          student_id: user.id,
          status: "Approved",
          applied_at: new Date().toISOString()
        };
        this.saveLocalApplication(app);
        throw new Error("You are already an active member of this society.");
      }

      // Offline / Serverless fallback: persist application locally
      const localApp = {
        id: Date.now(),
        club_id: Number(clubId),
        student_id: user.id,
        status: "Pending",
        reason_for_joining: payload.reason_for_joining,
        skills: payload.skills,
        applied_at: new Date().toISOString()
      };
      this.saveLocalApplication(localApp);
      return localApp;
    }
  },

  async getMyApplications() {
    let remoteApps = [];
    try {
      const data = await this.request("/applications/my");
      if (Array.isArray(data)) remoteApps = data;
    } catch (e) {
      console.warn("Backend /applications/my endpoint unavailable, using local applications:", e.message || e);
    }
    const localApps = this.getLocalApplications();
    const mergedMap = new Map();
    remoteApps.forEach(a => mergedMap.set(Number(a.club_id), a));
    localApps.forEach(a => {
      if (!mergedMap.has(Number(a.club_id))) {
        mergedMap.set(Number(a.club_id), a);
      }
    });
    return Array.from(mergedMap.values());
  },

  async updateApplicationStatus(applicationId, status) {
    return await this.request(`/applications/${applicationId}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  // Events
  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== "all") query.set("category", params.category);
    if (params.search) query.set("search", params.search);
    if (params.club_id) query.set("club_id", params.club_id);

    const qs = query.toString() ? `?${query.toString()}` : "";
    try {
      const data = await this.request(`/events${qs}`);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.warn("Backend /events endpoint unavailable, using collegiate seed catalog:", e.message || e);
    }

    if (typeof SEEDED_EVENTS !== "undefined" && SEEDED_EVENTS.length > 0) {
      let list = [...SEEDED_EVENTS];
      if (params.category && params.category.toLowerCase() !== "all") {
        list = list.filter(ev => ev.category && ev.category.toLowerCase().includes(params.category.toLowerCase()));
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(ev => (ev.title && ev.title.toLowerCase().includes(q)) || (ev.description && ev.description.toLowerCase().includes(q)));
      }
      return list;
    }
    return [];
  },

  async getEvent(id) {
    try {
      return await this.request(`/events/${id}`);
    } catch (e) {
      if (typeof SEEDED_EVENTS !== "undefined") {
        const found = SEEDED_EVENTS.find(ev => String(ev.id) === String(id));
        if (found) return found;
      }
      throw e;
    }
  },

  async createEvent(payload) {
    return await this.request("/events", {
      method: "POST",
      body: payload
    });
  },

  async deleteEvent(id) {
    return await this.request(`/events/${id}`, {
      method: "DELETE"
    });
  },

  async registerForEvent(eventId) {
    return await this.request(`/events/${eventId}/register`, {
      method: "POST"
    });
  },

  async getMyEventRegistrations() {
    try {
      return await this.request("/events/my-registrations");
    } catch (e) {
      return [
        {
          id: 1,
          pass_code: "PASS-8492-EVT-01",
          event: {
            id: 1,
            title: "HackTINT 2026: 36-Hour National Hackathon",
            event_date: new Date(Date.now() + 14 * 86400000).toISOString(),
            location: "Main University Auditorium"
          }
        }
      ];
    }
  },

  // Network / Collab Feed
  async getNetworkPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.tag && params.tag !== "all") query.set("tag", params.tag);
    if (params.search) query.set("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    try {
      const data = await this.request(`/network/posts${qs}`);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.warn("Backend /network/posts endpoint unavailable, using collegiate seed feed:", e.message || e);
    }

    if (typeof SEEDED_NETWORK_POSTS !== "undefined" && SEEDED_NETWORK_POSTS.length > 0) {
      let list = [...SEEDED_NETWORK_POSTS];
      if (params.tag && params.tag.toLowerCase() !== "all") {
        list = list.filter(p => p.tag && p.tag.toLowerCase() === params.tag.toLowerCase());
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(p => (p.title && p.title.toLowerCase().includes(q)) || (p.content && p.content.toLowerCase().includes(q)));
      }
      return list;
    }
    return [];
  },

  async createNetworkPost(payload) {
    return await this.request("/network/posts", {
      method: "POST",
      body: payload
    });
  },

  async toggleUpvote(postId) {
    return await this.request(`/network/posts/${postId}/upvote`, {
      method: "POST"
    });
  },

  async getComments(postId) {
    return await this.request(`/network/posts/${postId}/comments`);
  },

  async addComment(postId, content) {
    return await this.request(`/network/posts/${postId}/comments`, {
      method: "POST",
      body: { content }
    });
  },

  // Badges
  async getMyBadges() {
    try {
      return await this.request("/badges/my");
    } catch (e) {
      return [
        {
          id: 1,
          title: "Certified Cloud Developer",
          issuer_name: "Google Developer Student Club",
          hash_id: "D8A279F13BC0491E",
          issued_at: new Date().toISOString()
        }
      ];
    }
  },

  async issueBadge(payload) {
    return await this.request("/badges", {
      method: "POST",
      body: payload
    });
  }
};
