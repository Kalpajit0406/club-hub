// js/storage.js - Storage Bridge & Session State for ClubHub
// Connects with API client and ensures no default user is hardcoded.

const Storage = {
  init() {
    // No-op: Dummy data initialization removed. All data loads from backend SQLite.
  },

  getCurrentUser() {
    if (typeof API !== "undefined") {
      return API.getCurrentUser();
    }
    try {
      const data = localStorage.getItem("clubhub_user");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  logoutUser() {
    if (typeof API !== "undefined") {
      API.logout();
    } else {
      localStorage.removeItem("clubhub_token");
      localStorage.removeItem("clubhub_user");
    }
  },

  getBookmarks() {
    try {
      const data = localStorage.getItem("clubhub_bookmarks");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  toggleBookmark(clubId) {
    const marks = this.getBookmarks();
    const strId = String(clubId);
    const index = marks.indexOf(strId);
    let added = false;
    if (index > -1) {
      marks.splice(index, 1);
    } else {
      marks.push(strId);
      added = true;
    }
    localStorage.setItem("clubhub_bookmarks", JSON.stringify(marks));
    return added;
  },

  isBookmarked(clubId) {
    const marks = this.getBookmarks();
    return marks.includes(String(clubId));
  }
};
