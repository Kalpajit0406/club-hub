// js/common.js - Shared UI utilities, mobile navigation, toast system, and formatters

// Initialize UI behaviors on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  if (typeof initPaletteEngine === "function") {
    initPaletteEngine();
  }
  initMobileNav();
  highlightActiveNavLink();
  initToastContainer();
  updateNavBadges();
  renderNavAuth();
  renderThemeToggleBtn();
});

// ---------------- DARK / LIGHT THEME TOGGLE ----------------
const THEME_STORAGE_KEY = "clubhub_theme_mode_v2";

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
  if (document.querySelector(".theme-toggle-btn")) return;

  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theme-toggle-btn";
  btn.setAttribute("aria-label", currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  btn.setAttribute("title", currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  btn.innerHTML = `
    <svg class="moon-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg class="sun-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
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
    navActions.appendChild(btn);
  } else {
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
      : "CU";

    let roleBadge = "Student";
    let targetDashboard = "dashboard.html";

    if (currentUser.role === "admin") {
      roleBadge = "Club Lead";
      targetDashboard = "admin.html";
    } else if (currentUser.role === "recruiter") {
      roleBadge = "Recruiter";
      targetDashboard = "recruiter-dashboard.html";
    }

    container.innerHTML = `
      <div class="nav-user-pill">
        <a href="${targetDashboard}" class="nav-user-profile" title="View ${roleBadge} Dashboard">
          <span class="nav-user-avatar">${initials}</span>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.1;">
            <span class="nav-user-name" style="font-weight: 600;">${escapeHTML(currentUser.name.split(" ")[0])}</span>
            <span style="font-size: 10px; color: var(--primary); font-weight: 500;">${roleBadge}</span>
          </div>
        </a>
        <button type="button" class="nav-logout-btn" title="Sign Out" onclick="handleNavLogout()" aria-label="Sign Out">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="nav-auth-buttons">
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
      window.location.href = "login.html";
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

  toast.querySelector(".toast-close").addEventListener("click", () => {
    removeToast(toast);
  });

  const timer = setTimeout(() => {
    removeToast(toast);
  }, duration);

  toast.dataset.timer = timer;
}

function removeToast(toast) {
  toast.style.animation = "slideOut 0.25s forwards ease-in";
  toast.addEventListener("animationend", () => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  });
}

// ---------------- UTILITY HELPERS ----------------
function escapeHTML(str) {
  if (typeof str !== "string") return str || "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function debounce(func, wait = 250) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
