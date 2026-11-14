// js/auth.js - Real User Authentication Controller for ClubHub (Student & Admin Sections)

let currentRole = "student"; // 'student' or 'admin'

document.addEventListener("DOMContentLoaded", () => {
  initRoleTabs();
  initLoginForm();
  initRegisterForm();
  initPasswordToggles();
});

// ---------------- ROLE TABS & DYNAMIC SECTION CONTROLLER ----------------
function initRoleTabs() {
  const tabStudent = document.getElementById("role-tab-student");
  const tabAdmin = document.getElementById("role-tab-admin");

  if (tabStudent) {
    tabStudent.addEventListener("click", () => setRole("student"));
  }
  if (tabAdmin) {
    tabAdmin.addEventListener("click", () => setRole("admin"));
  }

  // Check URL query parameters: ?section=admin or ?role=admin
  const urlParams = new URLSearchParams(window.location.search);
  const sectionParam = (urlParams.get("section") || urlParams.get("role") || "").toLowerCase();

  if (sectionParam === "admin" || sectionParam === "coordinator" || sectionParam === "lead") {
    setRole("admin");
  } else {
    setRole("student");
>>>>>>> f4e188a5903bf50311058ac818e59efb6e8348fd
  }
}

function setRole(role) {
  currentRole = role === "admin" ? "admin" : "student";

  const tabStudent = document.getElementById("role-tab-student");
  const tabAdmin = document.getElementById("role-tab-admin");
  const roleInput = document.getElementById("login-role");
  const banner = document.getElementById("role-info-banner");
  const tag = document.getElementById("role-info-tag");
  const note = document.getElementById("role-info-note");
  const desc = document.getElementById("role-info-desc");
  const submitBtn = document.getElementById("auth-submit-btn");

  if (roleInput) roleInput.value = currentRole;

  if (currentRole === "admin") {
    if (tabStudent) {
      tabStudent.classList.remove("active");
      tabStudent.setAttribute("aria-selected", "false");
    }
    if (tabAdmin) {
      tabAdmin.classList.add("active");
      tabAdmin.setAttribute("aria-selected", "true");
    }

    if (banner) {
      banner.className = "role-info-banner admin-mode";
    }
    if (tag) tag.textContent = "🛡️ Club Secretariat & Admin Portal";
    if (note) note.textContent = "Review candidacy & accept requests";
    if (desc) {
      desc.textContent = "Sign in as a club coordinator or member to review pending student join requests, accept/reject candidates, schedule campus events, and manage club rosters.";
    }
    if (submitBtn) {
      submitBtn.textContent = "Sign In to Admin Portal →";
    }
  } else {
    if (tabAdmin) {
      tabAdmin.classList.remove("active");
      tabAdmin.setAttribute("aria-selected", "false");
    }
    if (tabStudent) {
      tabStudent.classList.add("active");
      tabStudent.setAttribute("aria-selected", "true");
    }

    if (banner) {
      banner.className = "role-info-banner student-mode";
    }
    if (tag) tag.textContent = "🎓 Student Portal";
    if (note) note.textContent = "Browse clubs & apply to join";
    if (desc) {
      desc.textContent = "Sign in as a student to explore university clubs, apply to join any campus society, register for tech workshops, and earn verified achievement badges.";
    }
    if (submitBtn) {
      submitBtn.textContent = "Sign In as Student →";
    }
  }

  renderDemoCredentials();
}

function renderDemoCredentials() {
  const container = document.getElementById("demo-credentials-container");
  if (!container) return;

  if (currentRole === "admin") {
    container.innerHTML = `
      <div style="font-size: 0.75rem; font-weight: 700; color: #D97706; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.04em;">
        ⚡ 1-Click Club Admin &amp; Member Logins
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>👑 <strong>Club Lead (Priya):</strong> <code>coord@tint.edu.in</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('coord@tint.edu.in', 'Coord@123', 'Club Lead (Priya Sharma) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🛡️ <strong>Secretariat (Prof. Roy):</strong> <code>admin@tint.edu.in</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('admin@tint.edu.in', 'Admin@123', 'Admin (Prof. Amitav Roy) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>⚡ <strong>Admin (Aparna):</strong> <code>aparnamaity2609@gmail.com</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('aparnamaity2609@gmail.com', 'password123', 'Admin (Aparna Maity) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 0.72rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 6px;">
        💡 <em>Club leads &amp; members can view all student candidacy applications and click Accept or Reject.</em>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.04em;">
        ⚡ 1-Click Student Logins
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🎓 <strong>Student (Aparna):</strong> <code>aparnamaity2609@campus.edu</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('aparnamaity2609@campus.edu', 'password123', 'Student (Aparna Maity) credentials filled. Has pending request!')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🎓 <strong>Student (Aditya):</strong> <code>aditya.cs23@campus.edu</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('aditya.cs23@campus.edu', 'password123', 'Student (Aditya Sen) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🎓 <strong>Student (Rahul):</strong> <code>rahul@tint.edu.in</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('rahul@tint.edu.in', 'Student@123', 'Student (Rahul Verma) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 0.72rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 6px;">
        💡 <em>As a student, you can apply to join any club with one click on the Clubs catalog.</em>
      </div>
    `;
  }
}

window.quickFill = function(email, password, message) {
  const emailInput = document.getElementById("login-email");
  const passInput = document.getElementById("login-password");
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  showAuthAlert(message || "Credentials filled. Click submit to sign in.", "success");
};

// ---------------- LOGIN FORM HANDLER ----------------
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const submitBtn = document.getElementById("auth-submit-btn");
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
        submitBtn.innerHTML = `<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; vertical-align:middle; margin-right:6px;"></span> Authenticating...`;
      }

      const res = await API.login(email, password, currentRole);
      const roleDisplayName = (res.user.role === "coordinator" || res.user.role === "admin" || currentRole === "admin")
        ? "Club Secretariat / Admin"
        : "Student";

      showAuthAlert(`Welcome back, ${res.user.full_name}! Signed in as ${roleDisplayName}. Redirecting...`, "success");

      // Check redirect URL in query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect");

      setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (currentRole === "admin" || res.user.role === "coordinator" || res.user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          // If student, send directly to clubs page so they can apply to join any club
          window.location.href = "clubs.html";
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

      showAuthAlert("Account created successfully! Welcome to ClubHub. Redirecting to clubs...", "success");

      setTimeout(() => {
        window.location.href = "clubs.html";
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
