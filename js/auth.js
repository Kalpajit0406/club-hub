// js/auth.js - Real User Authentication Controller for ClubHub

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
  initPasswordToggles();
  initDemoCredentials();
});

// ---------------- DEMO CREDENTIALS AUTOFILL ----------------
function initDemoCredentials() {
  const aparnaBtn = document.getElementById("aparna-fill-btn");
  if (aparnaBtn) {
    aparnaBtn.addEventListener("click", () => {
      const emailInput = document.getElementById("login-email");
      const passInput = document.getElementById("login-password");
      if (emailInput && passInput) {
        emailInput.value = "aparnamaity2609@campus.edu";
        passInput.value = "password123";
        showAuthAlert("Aparna Maity student credentials inserted. Click Sign In to continue.", "success");
      }
    });
  }

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

// ---------------- LOGIN FORM HANDLER ----------------
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const demoFillBtn = document.getElementById("demo-fill-btn");
  if (demoFillBtn) {
    demoFillBtn.addEventListener("click", () => {
      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");
      if (emailInput) emailInput.value = "aditya.cs23@campus.edu";
      if (passwordInput) passwordInput.value = "password123";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "Sign In";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showAuthAlert("Please enter both your email address and password.", "error");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Authenticating...";
      }

      const res = await API.login(email, password);
      showAuthAlert(`Welcome back, ${res.user.full_name}! Logged in successfully. Redirecting...`, "success");

      // Check redirect URL in query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect");

      setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (res.user.role === "coordinator" || res.user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 500);

    } catch (err) {
      showAuthAlert(err.message || "Invalid credentials. Please try again.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
}

// ---------------- REGISTRATION FORM HANDLER ----------------
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "Create Account";

    const full_name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const department = document.getElementById("reg-branch").value.trim();
    const yearRaw = document.getElementById("reg-year").value;
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password") ? document.getElementById("reg-confirm-password").value : password;

    if (!full_name || !email || !department || !yearRaw || !password) {
      showAuthAlert("Please fill in all required fields.", "error");
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

    // Convert year string (e.g. "2nd Year" or "2") to integer
    let yearNum = parseInt(yearRaw, 10);
    if (isNaN(yearNum)) {
      if (yearRaw.includes("1")) yearNum = 1;
      else if (yearRaw.includes("2")) yearNum = 2;
      else if (yearRaw.includes("3")) yearNum = 3;
      else if (yearRaw.includes("4")) yearNum = 4;
      else yearNum = 1;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Creating account...";
      }

      const res = await API.register({
        full_name,
        email,
        department,
        year: yearNum,
        password
      });

      showAuthAlert("Account created successfully! Welcome to ClubHub. Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);

    } catch (err) {
      showAuthAlert(err.message || "Registration failed. Please check your information.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
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
