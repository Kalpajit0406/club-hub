// js/storage.js - LocalStorage Persistence Layer for ClubHub Smart Campus OS

const STORAGE_KEYS = {
  CLUBS: "clubhub_clubs_v2",
  APPLICATIONS: "clubhub_applications_v2",
  BOOKMARKS: "clubhub_bookmarks_v2",
  EVENTS: "clubhub_events_v2",
  EVENT_REGISTRATIONS: "clubhub_event_registrations_v2",
  MARKETPLACE: "clubhub_marketplace_v2",
  NETWORK_POSTS: "clubhub_network_posts_v2",
  JOBS: "clubhub_jobs_v2",
  JOB_APPLICATIONS: "clubhub_job_applications_v2",
  VERIFIED_BADGES: "clubhub_verified_badges_v2",
  AUTH_USER: "clubhub_auth_user_v2",
  USERS_LIST: "clubhub_users_list_v2",
  INITIALIZED: "clubhub_initialized_v2"
};

const Storage = {
  // Initialize seeded data on very first run
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      if (typeof CLUBS_DATA !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(CLUBS_DATA));
      }
      if (typeof SEEDED_APPLICATIONS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(SEEDED_APPLICATIONS));
      }
      if (typeof SEEDED_EVENTS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(SEEDED_EVENTS));
      }
      if (typeof SEEDED_EVENT_REGISTRATIONS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.EVENT_REGISTRATIONS, JSON.stringify(SEEDED_EVENT_REGISTRATIONS));
      }
      if (typeof SEEDED_MARKETPLACE !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.MARKETPLACE, JSON.stringify(SEEDED_MARKETPLACE));
      }
      if (typeof SEEDED_NETWORK_POSTS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.NETWORK_POSTS, JSON.stringify(SEEDED_NETWORK_POSTS));
      }
      if (typeof SEEDED_JOBS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(SEEDED_JOBS));
      }
      if (typeof SEEDED_JOB_APPLICATIONS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.JOB_APPLICATIONS, JSON.stringify(SEEDED_JOB_APPLICATIONS));
      }
      if (typeof SEEDED_VERIFIED_BADGES !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.VERIFIED_BADGES, JSON.stringify(SEEDED_VERIFIED_BADGES));
      }
      if (typeof SEEDED_USERS !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(SEEDED_USERS));
        // Default logged-in as demo student Aditya Verma
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(SEEDED_USERS[0]));
      }
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(["gdsc", "dhwani-music"]));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    }
  },

  // ---------------- AUTHENTICATION & USERS ----------------
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
      return data ? JSON.parse(data) : (typeof SEEDED_USERS !== "undefined" ? SEEDED_USERS : []);
    } catch (e) {
      return [];
    }
  },

  loginUser(email, password) {
    this.init();
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return { success: false, message: "No account found with this email address." };
    }
    if (user.password !== password) {
      return { success: false, message: "Incorrect password. Please try again." };
    }
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    return { success: true, user };
  },

  loginAsDemoRole(role) {
    this.init();
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.role === role) || users[0];
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    return user;
  },

  registerUser(newUserData) {
    this.init();
    const users = this.getRegisteredUsers();
    const exists = users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase().trim());
    if (exists) {
      return { success: false, message: "An account with this email already exists. Please sign in." };
    }
    users.push(newUserData);
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(newUserData));
    return { success: true, user: newUserData };
  },

  logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  // ---------------- CLUBS ----------------
  getClubs() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLUBS);
      return data ? JSON.parse(data) : (typeof CLUBS_DATA !== "undefined" ? CLUBS_DATA : []);
    } catch (e) {
      return [];
    }
  },

  addClub(club) {
    const clubs = this.getClubs();
    clubs.push(club);
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
    return club;
  },

  getClubById(id) {
    const clubs = this.getClubs();
    return clubs.find(c => c.id === id) || null;
  },

  // ---------------- APPLICATIONS ----------------
  getApplications() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getApplicationById(id) {
    const apps = this.getApplications();
    return apps.find(a => a.id === id) || null;
  },

  saveApplication(appData) {
    const apps = this.getApplications();
    const newApp = {
      id: "app-" + Date.now(),
      status: "PENDING",
      appliedDate: new Date().toISOString(),
      interviewNotes: "Application submitted. Under review by coordinators.",
      ...appData
    };
    apps.unshift(newApp);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return newApp;
  },

  updateApplicationStatus(id, newStatus, notes) {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      apps[idx].status = newStatus;
      if (notes !== undefined) apps[idx].interviewNotes = notes;
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      return apps[idx];
    }
    return null;
  },

  deleteApplication(id) {
    let apps = this.getApplications();
    apps = apps.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return true;
  },

  // ---------------- BOOKMARKS ----------------
  getBookmarks() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  toggleBookmark(clubId) {
    let bookmarks = this.getBookmarks();
    const idx = bookmarks.indexOf(clubId);
    let isBookmarked = false;
    if (idx !== -1) {
      bookmarks.splice(idx, 1);
      isBookmarked = false;
    } else {
      bookmarks.push(clubId);
      isBookmarked = true;
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return isBookmarked;
  },

  isBookmarked(clubId) {
    return this.getBookmarks().includes(clubId);
  },

  // ---------------- EVENTS & REGISTRATIONS ----------------
  getEvents() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getEventById(id) {
    const events = this.getEvents();
    return events.find(e => e.id === id) || null;
  },

  addEvent(eventData) {
    const events = this.getEvents();
    const newEvent = {
      id: "evt-" + Date.now(),
      registeredCount: 0,
      status: "UPCOMING",
      ...eventData
    };
    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return newEvent;
  },

  getEventRegistrations() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  registerForEvent(eventId, studentData) {
    const registrations = this.getEventRegistrations();
    const event = this.getEventById(eventId);
    if (!event) return { success: false, message: "Event not found" };

    const existing = registrations.find(r => r.eventId === eventId && r.studentEmail === studentData.studentEmail);
    if (existing) {
      return { success: false, message: "You are already registered for this event!", pass: existing };
    }

    const passCode = "PASS-" + Math.floor(1000 + Math.random() * 9000) + "-" + event.id.toUpperCase();
    const newReg = {
      id: "reg-" + Date.now(),
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      venue: event.venue,
      studentName: studentData.studentName,
      studentRoll: studentData.studentRoll,
      studentEmail: studentData.studentEmail,
      passCode,
      registeredAt: new Date().toISOString(),
      status: "CONFIRMED"
    };

    registrations.unshift(newReg);
    localStorage.setItem(STORAGE_KEYS.EVENT_REGISTRATIONS, JSON.stringify(registrations));

    // Increment registered count
    const events = this.getEvents();
    const evIdx = events.findIndex(e => e.id === eventId);
    if (evIdx !== -1) {
      events[evIdx].registeredCount = (events[evIdx].registeredCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }

    return { success: true, pass: newReg };
  },

  isRegisteredForEvent(eventId, studentEmail) {
    const registrations = this.getEventRegistrations();
    return registrations.some(r => r.eventId === eventId && r.studentEmail === studentEmail);
  },

  // ---------------- MARKETPLACE ----------------
  getMarketplaceItems() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MARKETPLACE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addMarketplaceItem(itemData) {
    const items = this.getMarketplaceItems();
    const newItem = {
      id: "mkt-" + Date.now(),
      status: "AVAILABLE",
      postedDate: new Date().toISOString(),
      ...itemData
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.MARKETPLACE, JSON.stringify(items));
    return newItem;
  },

  updateMarketplaceItemStatus(id, newStatus) {
    const items = this.getMarketplaceItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx].status = newStatus;
      localStorage.setItem(STORAGE_KEYS.MARKETPLACE, JSON.stringify(items));
      return items[idx];
    }
    return null;
  },

  // ---------------- NETWORK & COLLAB FEED ----------------
  getNetworkPosts() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NETWORK_POSTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  createNetworkPost(postData) {
    const posts = this.getNetworkPosts();
    const newPost = {
      id: "post-" + Date.now(),
      upvotes: 1,
      userUpvoted: true,
      comments: [],
      timestamp: new Date().toISOString(),
      ...postData
    };
    posts.unshift(newPost);
    localStorage.setItem(STORAGE_KEYS.NETWORK_POSTS, JSON.stringify(posts));
    return newPost;
  },

  togglePostUpvote(postId) {
    const posts = this.getNetworkPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      if (posts[idx].userUpvoted) {
        posts[idx].upvotes = Math.max(0, posts[idx].upvotes - 1);
        posts[idx].userUpvoted = false;
      } else {
        posts[idx].upvotes += 1;
        posts[idx].userUpvoted = true;
      }
      localStorage.setItem(STORAGE_KEYS.NETWORK_POSTS, JSON.stringify(posts));
      return posts[idx];
    }
    return null;
  },

  addPostComment(postId, commentData) {
    const posts = this.getNetworkPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      const comment = {
        id: "c-" + Date.now(),
        author: commentData.author,
        text: commentData.text,
        time: "Just now"
      };
      posts[idx].comments.push(comment);
      localStorage.setItem(STORAGE_KEYS.NETWORK_POSTS, JSON.stringify(posts));
      return comment;
    }
    return null;
  },

  // ---------------- JOBS & INTERNSHIPS ----------------
  getJobs() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOBS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getJobById(id) {
    const jobs = this.getJobs();
    return jobs.find(j => j.id === id) || null;
  },

  addJob(jobData) {
    const jobs = this.getJobs();
    const newJob = {
      id: "job-" + Date.now(),
      applicantsCount: 0,
      ...jobData
    };
    jobs.unshift(newJob);
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    return newJob;
  },

  getJobApplications() {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOB_APPLICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  applyForJob(jobId, applicationData) {
    const applications = this.getJobApplications();
    const job = this.getJobById(jobId);
    if (!job) return { success: false, message: "Job opening not found" };

    const existing = applications.find(a => a.jobId === jobId && a.studentEmail === applicationData.studentEmail);
    if (existing) {
      return { success: false, message: "You have already applied for this opening!" };
    }

    const newApp = {
      id: "job-app-" + Date.now(),
      jobId: job.id,
      company: job.company,
      role: job.role,
      status: "UNDER_REVIEW",
      appliedDate: new Date().toISOString(),
      recruiterNotes: "Application received and submitted to university talent pool.",
      ...applicationData
    };

    applications.unshift(newApp);
    localStorage.setItem(STORAGE_KEYS.JOB_APPLICATIONS, JSON.stringify(applications));

    // Increment applicants counter
    const jobs = this.getJobs();
    const jIdx = jobs.findIndex(j => j.id === jobId);
    if (jIdx !== -1) {
      jobs[jIdx].applicantsCount = (jobs[jIdx].applicantsCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    }

    return { success: true, application: newApp };
  },

  updateJobApplicationStatus(appId, newStatus, notes) {
    const apps = this.getJobApplications();
    const idx = apps.findIndex(a => a.id === appId);
    if (idx !== -1) {
      apps[idx].status = newStatus;
      if (notes) apps[idx].recruiterNotes = notes;
      localStorage.setItem(STORAGE_KEYS.JOB_APPLICATIONS, JSON.stringify(apps));
      return apps[idx];
    }
    return null;
  },

  // ---------------- VERIFIED BADGES ----------------
  getVerifiedBadges(studentEmail) {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VERIFIED_BADGES);
      const all = data ? JSON.parse(data) : [];
      if (!studentEmail) return all;
      return all.filter(b => b.studentEmail.toLowerCase() === studentEmail.toLowerCase());
    } catch (e) {
      return [];
    }
  }
};

// Auto-initialize Storage immediately
Storage.init();
