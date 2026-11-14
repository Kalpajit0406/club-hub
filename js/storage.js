// js/storage.js - LocalStorage Persistence Layer for Club Hub

const STORAGE_KEYS = {
  APPLICATIONS: "club_hub_applications_v1",
  BOOKMARKS: "club_hub_bookmarks_v1",
  INITIALIZED: "club_hub_initialized_v1",
  AUTH_USER: "campus_connect_user_v1",
  USERS_LIST: "campus_connect_users_v1"
};

const DEFAULT_USER = {
  name: "Aditya Verma",
  email: "aditya.cs23@campus.edu",
  roll: "2023CSB1042",
  branch: "Computer Science & Engineering",
  year: "2nd Year",
  password: "password123"
};

const Storage = {
  // Initialize seeded data on very first run
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      if (typeof SEEDED_APPLICATIONS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(SEEDED_APPLICATIONS));
      }
      // Seed default bookmarks: GDSC and Dhwani
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(["gdsc", "dhwani-music"]));
      // Seed default users and logged-in user
      localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify([DEFAULT_USER]));
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(DEFAULT_USER));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    }
  },

  // ---------------- AUTHENTICATION ----------------
  getCurrentUser() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  getRegisteredUsers() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
      return data ? JSON.parse(data) : [DEFAULT_USER];
    } catch (e) {
      return [DEFAULT_USER];
    }
  },

  loginUser(email, password) {
    this.init();
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return { success: false, message: "No account found with this college email address." };
    }
    if (user.password !== password) {
      return { success: false, message: "Incorrect password. Please try again." };
    }
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    return { success: true, user };
  },

  registerUser(newUserData) {
    this.init();
    const users = this.getRegisteredUsers();
    const exists = users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase().trim());
    if (exists) {
      return { success: false, message: "An account with this college email already exists. Please log in." };
    }
    users.push(newUserData);
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newUserData));
    return { success: true, user: newUserData };
  },

  logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  // ---------------- APPLICATIONS ----------------
  getApplications() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading applications from localStorage:", e);
      return [];
    }
  },

  getApplicationById(id) {
    return this.getApplications().find(app => app.id === id);
  },

  hasApplied(clubId) {
    return this.getApplications().some(app => app.clubId === clubId);
  },

  saveApplication(newApp) {
    this.init();
    const apps = this.getApplications();
    // Add unique ID and date if missing
    const application = {
      id: newApp.id || "app-" + Date.now(),
      appliedDate: newApp.appliedDate || new Date().toISOString(),
      status: newApp.status || "PENDING",
      interviewNotes: newApp.interviewNotes || "Application submitted. Under review by club leads.",
      ...newApp
    };
    apps.unshift(application);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return application;
  },

  withdrawApplication(appId) {
    let apps = this.getApplications();
    apps = apps.filter(app => app.id !== appId);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return apps;
  },

  updateApplicationStatus(appId, newStatus, notes = "") {
    let apps = this.getApplications();
    const appIndex = apps.findIndex(app => app.id === appId);
    if (appIndex !== -1) {
      apps[appIndex].status = newStatus;
      if (notes) {
        apps[appIndex].interviewNotes = notes;
      } else if (newStatus === "ACCEPTED") {
        apps[appIndex].interviewNotes = "Congratulations! You have been accepted into the club.";
      } else if (newStatus === "SHORTLISTED") {
        apps[appIndex].interviewNotes = "Your profile is shortlisted for Round 1 interviews.";
      } else if (newStatus === "REJECTED") {
        apps[appIndex].interviewNotes = "Thank you for applying. At this time, we are unable to offer you a position.";
      }
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      return apps[appIndex];
    }
    return null;
  },

  // ---------------- BOOKMARKS / FAVORITES ----------------
  getBookmarks() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading bookmarks from localStorage:", e);
      return [];
    }
  },

  isBookmarked(clubId) {
    return this.getBookmarks().includes(clubId);
  },

  toggleBookmark(clubId) {
    let bookmarks = this.getBookmarks();
    const isSaved = bookmarks.includes(clubId);
    if (isSaved) {
      bookmarks = bookmarks.filter(id => id !== clubId);
    } else {
      bookmarks.push(clubId);
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return !isSaved; // returns new bookmarked state (true/false)
  }
};

// Auto-run init on script evaluation
Storage.init();
