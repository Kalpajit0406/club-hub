// js/auth.js - ClubHub Smart Campus Authentication Controller

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
  initPasswordToggles();
  initDemoLogins();
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
      showAuthAlert("Please enter both your email address and password.", "error");
      return;
    }

    if (typeof Storage !== "undefined") {
      const result = Storage.loginUser(email, password);
      if (result.success) {
        showAuthAlert(`Signed in as ${result.user.name}. Redirecting...`, "success");
        redirectByRole(result.user);
      } else {
        showAuthAlert(result.message || "Invalid credentials provided.", "error");
      }
    }
  });
}

function redirectByRole(user) {
  setTimeout(() => {
    const roleUpper = (user.role || "").toUpperCase();
    if (roleUpper === "ADMIN" || roleUpper === "COORDINATOR") {
      window.location.href = "admin.html";
    } else if (roleUpper === "RECRUITER") {
      window.location.href = "recruiter-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  }, 450);
}

// ---------------- 1-CLICK DEMO LOGINS ----------------
function initDemoLogins() {
  document.querySelectorAll("[data-demo-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      let role = btn.getAttribute("data-demo-role");
      if (role === "secretariat") role = "admin";

      if (typeof Storage !== "undefined") {
        const user = Storage.loginAsDemoRole(role);
        showAuthAlert(`Authenticated as ${user.name} (${user.role.toUpperCase()})! Redirecting...`, "success");
        redirectByRole(user);
      }
    });
  });
}

function initDemoCredentials() {
  const fillBtn = document.getElementById("demo-fill-btn");
  if (fillBtn) {
    fillBtn.addEventListener("click", () => {
      const emailInput = document.getElementById("login-email");
      const passInput = document.getElementById("login-password");
      if (emailInput && passInput) {
        emailInput.value = "aditya.cs23@campus.edu";
        passInput.value = "password123";
        showAuthAlert("Demo student credentials inserted. Click Sign In to continue.", "success");
      }
    });
  }
}

// ---------------- REGISTRATION FORM HANDLER ----------------
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAuthAlert();

    const name = document.getElementById("reg-name").value.trim();
    const roll = document.getElementById("reg-roll") ? document.getElementById("reg-roll").value.trim().toUpperCase() : "";
    const branch = document.getElementById("reg-branch") ? document.getElementById("reg-branch").value.trim() : "Computer Science & Engineering";
    const year = document.getElementById("reg-year") ? document.getElementById("reg-year").value : "2nd Year";
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;
    const confirmEl = document.getElementById("reg-confirm-password");
    const confirmPassword = confirmEl ? confirmEl.value : password;

    const terms = document.getElementById("terms-agree") || document.getElementById("reg-terms");
    if (terms && !terms.checked) {
      showAuthAlert("Please accept the Campus Honor Code & ClubHub Terms.", "error");
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
      id: "usr-" + Date.now(),
      name,
      rollNumber: roll,
      roll: roll,
      department: branch,
      branch: branch,
      year: year,
      email: email,
      role: "Student",
      password: password,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
    };

    if (typeof Storage !== "undefined") {
      const result = Storage.registerUser(newUser);
      if (result.success) {
        showAuthAlert("Account created successfully! Redirecting to command center...", "success");
        redirectByRole(newUser);
      } else {
        showAuthAlert(result.message || "An account with this email already exists.", "error");
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
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });
}

// ---------------- ALERTS ----------------
function showAuthAlert(message, type = "error") {
  const alertEl = document.getElementById("auth-alert");
  if (!alertEl) return;
  alertEl.className = `auth-alert ${type}`;
  alertEl.textContent = message;
  alertEl.style.display = "block";
}

function clearAuthAlert() {
  const alertEl = document.getElementById("auth-alert");
  if (!alertEl) return;
  alertEl.style.display = "none";
  alertEl.textContent = "";
}
