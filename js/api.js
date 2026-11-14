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
    const res = await this.request("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    this.setAuth(res.access_token, res.user);
    return res;
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
    return await this.request("/dashboard/public");
  },

  // Student Dashboard Stats
  async getStudentDashboardStats() {
    return await this.request("/dashboard/student");
  },

  // Coordinator Clubs
  async getCoordinatedClubs() {
    return await this.request("/dashboard/coordinator-clubs");
  },

  // My Clubs & Memberships
  async getMyClubs() {
    return await this.request("/students/my-clubs");
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
    return await this.request(`/clubs${qs}`);
  },

  async getClub(id) {
    return await this.request(`/clubs/${id}`);
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
    return await this.request(`/events${qs}`);
  },

  async getEvent(id) {
    return await this.request(`/events/${id}`);
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
    return await this.request("/events/my-registrations");
  },

  // Network / Collab Feed
  async getNetworkPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.tag && params.tag !== "all") query.set("tag", params.tag);
    if (params.search) query.set("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    return await this.request(`/network/posts${qs}`);
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
    return await this.request("/badges/my");
  },

  async issueBadge(payload) {
    return await this.request("/badges", {
      method: "POST",
      body: payload
    });
  }
};
