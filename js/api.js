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
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const errorMsg = (data && data.detail) || (data && data.message) || res.statusText || "Request failed";
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
      return res;
    } catch (err) {
      // Offline / Demo Account Fallback
      const normalizedEmail = (email || "").trim().toLowerCase();
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
    try {
      const data = await this.request(`/clubs${qs}`);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.warn("Backend /clubs endpoint unavailable, using collegiate seed catalog:", e.message || e);
    }

    if (typeof CLUBS_DATA !== "undefined" && CLUBS_DATA.length > 0) {
      return this.filterFallbackClubs(CLUBS_DATA, params);
    }
    return [];
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
    try {
      return await this.request(`/clubs/${id}`);
    } catch (e) {
      if (typeof CLUBS_DATA !== "undefined") {
        const found = CLUBS_DATA.find(c => String(c.id) === String(id));
        if (found) return found;
      }
      throw e;
    }
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
    return await this.request("/applications", {
      method: "POST",
      body: {
        club_id: Number(clubId),
        reason_for_joining: reason || "Interested in joining society",
        skills: skills || "General"
      }
    });
  },

  async getMyApplications() {
    return await this.request("/applications/my");
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
