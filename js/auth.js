// js/auth.js - CampusConnect Authentication Controller

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
  initPasswordToggles();
  initDemoCredentials();
});

// ---------------- LOGIN FORM HANDLER ----------------
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAuthAlert();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showAuthAlert("Please enter both your college email and password.", "error");
      return;
    }

    if (typeof Storage !== "undefined") {
      const result = Storage.loginUser(email, password);
      if (result.success) {
        showAuthAlert("Signing you in...", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      } else {
        showAuthAlert(result.message, "error");
      }
    }
  });
}

// ---------------- REGISTRATION FORM HANDLER ----------------
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAuthAlert();

    const name = document.getElementById("reg-name").value.trim();
    const roll = document.getElementById("reg-roll").value.trim().toUpperCase();
    const branch = document.getElementById("reg-branch").value.trim();
    const year = document.getElementById("reg-year").value;
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value;
    const terms = document.getElementById("reg-terms");

    if (terms && !terms.checked) {
      showAuthAlert("Please accept the Campus Student Code of Conduct to proceed.", "error");
      return;
    }

    if (password.length < 6) {
      showAuthAlert("Password must be at least 6 characters long.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert("Passwords do not match. Please re-enter.", "error");
      return;
    }

    const newUser = {
      name,
      roll,
      branch,
      year,
      email,
      password
    };

    if (typeof Storage !== "undefined") {
      const result = Storage.registerUser(newUser);
      if (result.success) {
        showAuthAlert("Account created successfully! Redirecting to your dashboard...", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 650);
      } else {
        showAuthAlert(result.message, "error");
      }
    }
  });
}

// ---------------- PASSWORD VISIBILITY TOGGLE ----------------
function initPasswordToggles() {
  document.querySelectorAll(".toggle-password-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      btn.innerHTML = isPassword 
        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });
}

// ---------------- DEMO CREDENTIALS AUTOFILL ----------------
function initDemoCredentials() {
  const fillBtn = document.getElementById("demo-fill-btn");
  if (fillBtn) {
    fillBtn.addEventListener("click", () => {
      const emailInput = document.getElementById("login-email");
      const passInput = document.getElementById("login-password");
      if (emailInput && passInput) {
        emailInput.value = "aditya.cs23@campus.edu";
        passInput.value = "password123";
        showAuthAlert("Demo credentials inserted. Click Sign In to continue.", "success");
      }
    });
  }
}

// ---------------- ALERT HELPERS ----------------
function showAuthAlert(message, type = "error") {
  const alertEl = document.getElementById("auth-alert");
  if (!alertEl) return;

  alertEl.className = `auth-alert auth-alert-${type} show`;
  alertEl.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink: 0;">
      ${type === "success" 
        ? '<polyline points="20 6 9 17 4 12"/>' 
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
      }
    </svg>
    <span>${escapeHTML(message)}</span>
  `;
}

function clearAuthAlert() {
  const alertEl = document.getElementById("auth-alert");
  if (alertEl) {
    alertEl.className = "auth-alert";
    alertEl.innerHTML = "";
  }
}
