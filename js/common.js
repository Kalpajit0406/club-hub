// js/common.js - Shared UI utilities, mobile navigation, toast system, and formatters

// Initialize UI behaviors on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileNav();
  highlightActiveNavLink();
  initToastContainer();
  updateNavBadges();
  renderNavAuth();
  renderThemeToggleBtn();
});

// ---------------- DARK / LIGHT THEME TOGGLE ----------------
const THEME_STORAGE_KEY = "campus_connect_theme_v1";

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

  const btn = document.querySelector(".theme-toggle-btn");
  if (btn) {
    btn.setAttribute("title", nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("aria-label", nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
}

function renderThemeToggleBtn() {
  // Prevent duplicate insertion
  if (document.querySelector(".theme-toggle-btn")) return;

  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theme-toggle-btn";
  btn.setAttribute("aria-label", currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  btn.setAttribute("title", currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  btn.innerHTML = `
    <svg class="moon-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg class="sun-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  `;
  btn.addEventListener("click", toggleTheme);

  const navActions = document.querySelector(".nav-actions");
  if (navActions) {
    navActions.insertBefore(btn, navActions.firstChild);
  } else {
    // Standalone pages (login, register)
    btn.classList.add("theme-toggle-floating");
    document.body.appendChild(btn);
  }
}

// ---------------- MOBILE NAVIGATION DRAWER ----------------
function initMobileNav() {
  const toggleBtn = document.querySelector(".mobile-nav-toggle");
  const navMenu = document.querySelector(".nav-links");

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener("click", () => {
    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", !isExpanded);
    navMenu.classList.toggle("open");
  });

  // Close menu when clicking outside or clicking any nav link
  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains("open")) {
      navMenu.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// ---------------- ACTIVE NAV LINK HIGHLIGHTER ----------------
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const linkPath = href.split("/").pop();

    if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ---------------- NAVIGATION COUNTER BADGES ----------------
function updateNavBadges() {
  const badgeEl = document.getElementById("nav-app-count");
  if (badgeEl && typeof Storage !== "undefined") {
    const apps = Storage.getApplications();
    if (apps.length > 0) {
      badgeEl.textContent = apps.length;
      badgeEl.style.display = "inline-flex";
    } else {
      badgeEl.style.display = "none";
    }
  }
}

// ---------------- NAVBAR AUTH BUTTONS / USER PROFILE ----------------
function renderNavAuth() {
  const container = document.getElementById("nav-auth-box");
  if (!container || typeof Storage === "undefined") return;

  const currentUser = Storage.getCurrentUser();
  if (currentUser) {
    const initials = currentUser.name
      ? currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
      : "ST";

    container.innerHTML = `
      <div class="nav-user-pill">
        <a href="dashboard.html" class="nav-user-profile" title="View Student Dashboard">
          <span class="nav-user-avatar">${initials}</span>
          <span class="nav-user-name">${escapeHTML(currentUser.name.split(" ")[0])}</span>
        </a>
        <button type="button" class="nav-logout-btn" title="Sign Out" onclick="handleNavLogout()" aria-label="Sign Out">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Register</a>
      </div>
    `;
  }
}

function handleNavLogout() {
  if (typeof Storage !== "undefined") {
    Storage.logoutUser();
    showToast("You have been signed out successfully.", "info");
    setTimeout(() => {
      window.location.reload();
    }, 450);
  }
}

// ---------------- TOAST NOTIFICATION SYSTEM ----------------
function initToastContainer() {
  if (!document.getElementById("toast-container")) {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
}

function showToast(message, type = "success", duration = 3500) {
  initToastContainer();
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconSvg = type === "success" 
    ? `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : type === "error"
    ? `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-content">${escapeHTML(message)}</div>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  container.appendChild(toast);

  // Trigger smooth enter animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  const closeToast = () => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 250);
  };

  toast.querySelector(".toast-close").addEventListener("click", closeToast);
  setTimeout(closeToast, duration);
}

// ---------------- UTILITY HELPERS ----------------
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(isoString) {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch (e) {
    return isoString;
  }
}

function getCategoryBadge(category) {
  const safeCat = escapeHTML(category);
  const catClass = category.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `<span class="badge badge-cat badge-cat-${catClass}">${safeCat}</span>`;
}

function getStatusBadge(status) {
  if (status === "OPEN") {
    return `<span class="badge badge-status badge-status-open"><span class="badge-dot"></span> Recruiting Now</span>`;
  } else if (status === "CLOSED") {
    return `<span class="badge badge-status badge-status-closed">Recruitment Closed</span>`;
  }
  return `<span class="badge badge-status badge-status-neutral">${escapeHTML(status)}</span>`;
}

function getVerifiedBadgeSvg() {
  return `<svg class="verified-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" title="Verified Campus Organization"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
}

function getApplicationStatusBadge(status) {
  switch (status) {
    case "PENDING":
      return `<span class="badge badge-app badge-app-pending">Pending Review</span>`;
    case "SHORTLISTED":
      return `<span class="badge badge-app badge-app-shortlisted">Shortlisted</span>`;
    case "ACCEPTED":
    case "APPROVED":
      return `<span class="badge badge-app badge-app-accepted">Approved & Accepted</span>`;
    case "REJECTED":
      return `<span class="badge badge-app badge-app-rejected">Not Shortlisted</span>`;
    default:
      return `<span class="badge badge-app badge-app-neutral">${escapeHTML(status)}</span>`;
  }
}
