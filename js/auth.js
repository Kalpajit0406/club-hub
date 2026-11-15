// js/auth.js - Real User Authentication Controller for ClubHub (Student & Club Admin)

let currentRole = "student"; // 'student' or 'admin'
let currentRegRole = "student"; // 'student' or 'coordinator'

document.addEventListener("DOMContentLoaded", () => {
  initLoginRoleTabs();
  initRegisterRoleTabs();
  initLoginForm();
  initRegisterForm();
  initPasswordToggles();
});

// ---------------- LOGIN ROLE TABS & DYNAMIC SECTION CONTROLLER ----------------
function initLoginRoleTabs() {
  const tabStudent = document.getElementById("role-tab-student");
  const tabAdmin = document.getElementById("role-tab-admin");

  if (!tabStudent && !tabAdmin) return;

  if (tabStudent) {
    tabStudent.addEventListener("click", () => setLoginRole("student"));
  }
  if (tabAdmin) {
    tabAdmin.addEventListener("click", () => setLoginRole("admin"));
  }

  // Check URL query parameters: ?section=admin or ?role=admin
  const urlParams = new URLSearchParams(window.location.search);
  const sectionParam = (urlParams.get("section") || urlParams.get("role") || "").toLowerCase();

  if (sectionParam === "admin" || sectionParam === "coordinator" || sectionParam === "lead") {
    setLoginRole("admin");
  } else {
    setLoginRole("student");
  }
}

function setLoginRole(role) {
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
    if (tag) tag.textContent = "🛡️ Club Admin Portal";
    if (note) note.textContent = "Review candidacy & accept requests";
    if (desc) {
      desc.textContent = "Sign in as a verified Club Admin or Coordinator to manage societies, review candidate join requests, accept/reject applicants, and schedule campus events.";
    }
    if (submitBtn) {
      submitBtn.textContent = "Sign In as Club Admin →";
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
      desc.textContent = "Sign in as a student to explore university clubs, apply to join campus societies, register for tech workshops, and track joining request statuses.";
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
        ⚡ 1-Click Club Admin Logins
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>👑 <strong>Club Lead (Priya Sharma):</strong> <code>coord@tint.edu.in</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('coord@tint.edu.in', 'Coord@123', 'Club Lead (Priya Sharma) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🛡️ <strong>Secretariat (Prof. Roy):</strong> <code>admin@tint.edu.in</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('admin@tint.edu.in', 'Admin@123', 'Admin (Prof. Amitav Roy) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 0.72rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 6px;">
        💡 <em>Club Admins manage clubs, accept/reject student join requests, and schedule events.</em>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.04em;">
        ⚡ 1-Click Student Logins
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🎓 <strong>Student (Rahul Verma):</strong> <code>rahul@tint.edu.in</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('rahul@tint.edu.in', 'Student@123', 'Student (Rahul Verma) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🎓 <strong>Student (Ananya Das):</strong> <code>ananya@tint.edu.in</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('ananya@tint.edu.in', 'Student@123', 'Student (Ananya Das) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>🎓 <strong>Student (Aditya Sen):</strong> <code>aditya.cs23@campus.edu</code></span>
          <button type="button" class="btn btn-outline btn-sm" onclick="quickFill('aditya.cs23@campus.edu', 'password123', 'Student (Aditya Sen) credentials filled.')" style="padding: 2px 8px; font-size: 0.72rem;">Auto-fill</button>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 0.72rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 6px;">
        💡 <em>Students explore clubs, send join requests, and track request status.</em>
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
      const user = res.user;
      const userRole = (user && user.role) ? user.role.toLowerCase() : "student";
      const isClubAdmin = (userRole === "coordinator" || userRole === "admin");

      const roleDisplayName = isClubAdmin ? "Club Admin" : "Student";
      showAuthAlert(`Welcome back, ${user.full_name}! Signed in as ${roleDisplayName}. Redirecting...`, "success");

      // Check redirect URL in query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect");

      setTimeout(() => {
        if (redirectUrl && !redirectUrl.includes("login.html") && !redirectUrl.includes("register.html")) {
          // If student tried to access admin page via redirect parameter, enforce RBAC redirect
          if (!isClubAdmin && redirectUrl.includes("admin.html")) {
            window.location.href = "dashboard.html";
          } else {
            window.location.href = redirectUrl;
          }
        } else if (isClubAdmin) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 500);

    } catch (err) {
      showAuthAlert(err.message || "Invalid credentials. Please verify your email and password.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
}

// ---------------- REGISTRATION ROLE TABS ----------------
function initRegisterRoleTabs() {
  const tabStudent = document.getElementById("reg-role-tab-student");
  const tabAdmin = document.getElementById("reg-role-tab-admin");

  if (!tabStudent && !tabAdmin) return;

  if (tabStudent) {
    tabStudent.addEventListener("click", () => setRegisterRole("student"));
  }
  if (tabAdmin) {
    tabAdmin.addEventListener("click", () => setRegisterRole("coordinator"));
  }

  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = (urlParams.get("role") || urlParams.get("section") || "").toLowerCase();
  if (roleParam === "admin" || roleParam === "coordinator") {
    setRegisterRole("coordinator");
  } else {
    setRegisterRole("student");
  }
}

function setRegisterRole(role) {
  currentRegRole = (role === "coordinator" || role === "admin") ? "coordinator" : "student";

  const tabStudent = document.getElementById("reg-role-tab-student");
  const tabAdmin = document.getElementById("reg-role-tab-admin");
  const roleInput = document.getElementById("reg-role");
  const banner = document.getElementById("reg-role-info-banner");
  const tag = document.getElementById("reg-role-info-tag");
  const note = document.getElementById("reg-role-info-note");
  const desc = document.getElementById("reg-role-info-desc");
  const yearGroup = document.getElementById("reg-year-group");
  const desigGroup = document.getElementById("reg-designation-group");
  const branchLabel = document.getElementById("reg-branch-label");
  const submitBtn = document.getElementById("reg-submit-btn");

  if (roleInput) roleInput.value = currentRegRole;

  if (currentRegRole === "coordinator") {
    if (tabStudent) {
      tabStudent.classList.remove("active");
      tabStudent.setAttribute("aria-selected", "false");
    }
    if (tabAdmin) {
      tabAdmin.classList.add("active");
      tabAdmin.setAttribute("aria-selected", "true");
    }
    if (banner) banner.className = "role-info-banner admin-mode";
    if (tag) tag.textContent = "🛡️ Club Admin Registration";
    if (note) note.textContent = "Manage clubs & student requests";
    if (desc) {
      desc.textContent = "Register as a collegiate Club Admin or Coordinator to charter societies, review student join requests, approve memberships, and organize campus events.";
    }
    if (yearGroup) yearGroup.style.display = "none";
    if (desigGroup) desigGroup.style.display = "block";
    if (branchLabel) branchLabel.textContent = "Department / Council";
    if (submitBtn) submitBtn.textContent = "Register as Club Admin →";
  } else {
    if (tabAdmin) {
      tabAdmin.classList.remove("active");
      tabAdmin.setAttribute("aria-selected", "false");
    }
    if (tabStudent) {
      tabStudent.classList.add("active");
      tabStudent.setAttribute("aria-selected", "true");
    }
    if (banner) banner.className = "role-info-banner student-mode";
    if (tag) tag.textContent = "🎓 Student Registration";
    if (note) note.textContent = "Browse clubs & submit candidacy";
    if (desc) {
      desc.textContent = "Sign up as a student to explore university societies, submit joining requests, track candidacy status in real time, and earn digital event passes.";
    }
    if (yearGroup) yearGroup.style.display = "block";
    if (desigGroup) desigGroup.style.display = "none";
    if (branchLabel) branchLabel.textContent = "Academic Department";
    if (submitBtn) submitBtn.textContent = "Register as Student →";
  }
}

// ---------------- REGISTRATION FORM HANDLER ----------------
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const submitBtn = document.getElementById("reg-submit-btn") || form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "Create Account";

    const full_name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const departmentRaw = document.getElementById("reg-branch").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password") ? document.getElementById("reg-confirm-password").value : password;

    const isCoordinator = (currentRegRole === "coordinator");
    let department = departmentRaw;

    let yearNum = 1;
    if (isCoordinator) {
      const designationEl = document.getElementById("reg-designation");
      const desig = designationEl ? designationEl.value.trim() : "Lead Coordinator";
      department = `${departmentRaw} (${desig})`;
      yearNum = 4;
    } else {
      const yearEl = document.getElementById("reg-year");
      const yearRaw = yearEl ? yearEl.value : "1";
      yearNum = parseInt(yearRaw, 10);
      if (isNaN(yearNum)) yearNum = 1;
    }

    if (!full_name || !email || !department || !password) {
      showAuthAlert("Please fill in all required fields.", "error");
      return;
    }

    if (password.length < 6) {
      showAuthAlert("Password must be at least 6 characters long.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert("Passwords do not match. Please re-enter your password.", "error");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; vertical-align:middle; margin-right:6px;"></span> Creating Account...`;
      }

      const res = await API.register({
        full_name,
        email,
        department,
        year: yearNum,
        password,
        role: isCoordinator ? "coordinator" : "student"
      });

      const roleLabel = isCoordinator ? "Club Admin" : "Student";
      showAuthAlert(`Account created successfully as ${roleLabel}! Redirecting to dashboard...`, "success");

      setTimeout(() => {
        if (isCoordinator) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
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
