// js/admin.js - Logic for Club Admin Secretariat Dashboard

let adminMembers = [];

document.addEventListener("DOMContentLoaded", () => {
  initAdminData();
  initAdminTabs();
  initAdminFilters();
  initCreateEventModal();
  initAddClubModal();
  initAppDetailModal();
  refreshAdminDashboard();
});

function initAdminData() {
  if (typeof CAMPUS_MEMBERS !== "undefined") {
    adminMembers = [...CAMPUS_MEMBERS];
  } else {
    adminMembers = [
      { name: "Aditya Verma", email: "aditya.v@tint.edu.in", roll: "23/CS/104", clubName: "Google Developer Student Club", domain: "Core Technical", role: "President", joined: "2024-08-15" },
      { name: "Pooja Hegde", email: "pooja.h@tint.edu.in", roll: "23/IT/042", clubName: "Autonomous Robotics Society", domain: "Embedded Hardware", role: "Vice President", joined: "2024-08-20" },
      { name: "Rohit Sen", email: "rohit.s@tint.edu.in", roll: "22/ECE/018", clubName: "E-Cell TINT", domain: "Startup Incubation", role: "Convenor", joined: "2023-09-01" }
    ];
  }
}

function initAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab-btn");
  const tabPanes = document.querySelectorAll(".admin-tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");

      tabs.forEach(t => t.classList.remove("active"));
      tabPanes.forEach(p => p.style.display = "none");

      tab.classList.add("active");
      const activePane = document.getElementById(`admin-pane-${targetTab}`);
      if (activePane) activePane.style.display = "block";
    });
  });
}

function initAdminFilters() {
  const searchInput = document.getElementById("admin-app-search");
  const statusFilter = document.getElementById("admin-app-status-filter");

  if (searchInput) {
    searchInput.addEventListener("input", () => renderAdminApplications());
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", () => renderAdminApplications());
  }
}

function refreshAdminDashboard() {
  updateAdminMetrics();
  renderAdminApplications();
  renderAdminMembers();
  renderAdminEvents();
}

function updateAdminMetrics() {
  const applications = typeof Storage !== "undefined" ? Storage.getApplications() : [];
  const events = typeof Storage !== "undefined" ? Storage.getEvents() : [];

  const totalAppsEl = document.getElementById("admin-metric-apps");
  const totalMembersEl = document.getElementById("admin-metric-members");
  const totalEventsEl = document.getElementById("admin-metric-events");
  const acceptanceRateEl = document.getElementById("admin-metric-rate");

  const pendingCount = applications.filter(a => (a.status || "").toUpperCase() === "PENDING").length;

  if (totalAppsEl) totalAppsEl.textContent = pendingCount;
  if (totalMembersEl) totalMembersEl.textContent = adminMembers.length;
  if (totalEventsEl) totalEventsEl.textContent = events.length;

  if (acceptanceRateEl) {
    const accepted = applications.filter(a => {
      const s = (a.status || "").toUpperCase();
      return s === "ACCEPTED" || s === "APPROVED";
    }).length;
    const rate = applications.length > 0 ? Math.round((accepted / applications.length) * 100) : 0;
    acceptanceRateEl.textContent = `${rate}%`;
  }

  const badgeApps = document.getElementById("admin-tab-badge-apps");
  if (badgeApps) badgeApps.textContent = applications.length;
  const badgeMembers = document.getElementById("admin-tab-badge-members");
  if (badgeMembers) badgeMembers.textContent = adminMembers.length;
  const badgeEvents = document.getElementById("admin-tab-badge-events");
  if (badgeEvents) badgeEvents.textContent = events.length;
}

// ---------------- APPLICATIONS TABLE ----------------
function renderAdminApplications() {
  const tbody = document.getElementById("admin-apps-tbody");
  if (!tbody) return;

  const applications = typeof Storage !== "undefined" ? Storage.getApplications() : [];
  const searchInput = document.getElementById("admin-app-search");
  const statusFilter = document.getElementById("admin-app-status-filter");

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const filterStatus = statusFilter ? statusFilter.value : "ALL";

  let filtered = applications.filter(app => {
    const sName = app.studentName || "";
    const sRoll = app.rollNumber || app.studentRoll || "";
    const cName = app.clubName || "";
    const domain = app.domain || "";

    const matchQuery = !query || 
      sName.toLowerCase().includes(query) ||
      sRoll.toLowerCase().includes(query) ||
      cName.toLowerCase().includes(query) ||
      domain.toLowerCase().includes(query);

    const appStatus = (app.status || "PENDING").toUpperCase();
    const matchStatus = filterStatus === "ALL" || appStatus === filterStatus;
    return matchQuery && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No matching applications found in candidate registry.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(app => {
    let statusBadge = "badge-warning";
    let statusText = "Pending Review";
    const statusUpper = (app.status || "PENDING").toUpperCase();

    if (statusUpper === "APPROVED" || statusUpper === "ACCEPTED") {
      statusBadge = "badge-success";
      statusText = "Approved";
    } else if (statusUpper === "SHORTLISTED") {
      statusBadge = "badge-primary";
      statusText = "Shortlisted";
    } else if (statusUpper === "REJECTED") {
      statusBadge = "badge-danger";
      statusText = "Rejected";
    }

    const appliedDate = app.appliedAt || app.appliedDate || new Date().toISOString();
    const dateFormatted = new Date(appliedDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${escapeHTML(app.studentName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(app.rollNumber || app.studentRoll || '23/CS/104')} &bull; ${escapeHTML(app.email || 'student@tint.edu.in')}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHTML(app.clubName)}</div>
          <div style="font-size: 0.75rem; color: var(--primary-color); font-weight: 600;">Wing: ${escapeHTML(app.domain || 'General')}</div>
        </td>
        <td>
          <div style="font-size: 0.8125rem;">${escapeHTML(app.department || app.branch || 'CSE')}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Year ${escapeHTML(app.year || '2')}</div>
        </td>
        <td>
          <span class="badge ${statusBadge}">${statusText}</span>
        </td>
        <td>${dateFormatted}</td>
        <td>
          <div class="action-btn-group">
            <button class="btn btn-outline btn-sm" onclick="viewAppDetail('${app.id}')">
              Review
            </button>
            <button class="btn btn-primary btn-sm" onclick="quickUpdateStatus('${app.id}', 'APPROVED')">
              Approve
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function quickUpdateStatus(appId, newStatus) {
  if (typeof Storage !== "undefined") {
    Storage.updateApplicationStatus(appId, newStatus, `Approved by Club Secretariat on ${new Date().toLocaleDateString()}`);
  }
  refreshAdminDashboard();
  if (typeof UIStates !== "undefined") {
    UIStates.showToast(`Application marked as ${newStatus}`, "success");
  }
}

// ---------------- EVENTS MANAGER ----------------
function renderAdminEvents() {
  const tbody = document.getElementById("admin-events-tbody");
  if (!tbody) return;

  const events = typeof Storage !== "undefined" ? Storage.getEvents() : [];
  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No scheduled events in the campus calendar.</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(e => {
    const d = new Date(e.date || Date.now());
    const dateFormatted = d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${escapeHTML(e.title)}</div>
          <div style="font-size: 0.75rem; color: var(--primary-color);">${escapeHTML(e.clubName)}</div>
        </td>
        <td><span class="badge badge-teal">${escapeHTML(e.category)}</span></td>
        <td>
          <div>${dateFormatted}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(e.venue || 'Campus Auditorium')}</div>
        </td>
        <td>
          <strong>${e.registeredCount || 0}</strong> / ${e.capacity || 200}
        </td>
        <td>
          <div style="font-size: 0.8125rem;">Fee: ${escapeHTML(e.fee || 'Free')}</div>
          ${e.prizes ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(e.prizes)}</div>` : ''}
        </td>
        <td>
          <span class="badge badge-status-open">Active &bull; Published</span>
        </td>
      </tr>
    `;
  }).join("");
}

// ---------------- MEMBERS ROSTER ----------------
function renderAdminMembers() {
  const tbody = document.getElementById("admin-members-tbody");
  if (!tbody) return;

  tbody.innerHTML = adminMembers.map(m => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--text-primary);">${escapeHTML(m.name)}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(m.email)}</div>
      </td>
      <td>${escapeHTML(m.roll)}</td>
      <td>
        <div style="font-weight: 600;">${escapeHTML(m.clubName)}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHTML(m.domain)}</div>
      </td>
      <td><span class="badge badge-outline">${escapeHTML(m.role)}</span></td>
      <td>${escapeHTML(m.joined)}</td>
      <td><span class="badge badge-teal">Inducted</span></td>
    </tr>
  `).join("");
}

// ---------------- CREATE EVENT MODAL ----------------
function initCreateEventModal() {
  const openBtn = document.getElementById("open-create-event-btn");
  const modal = document.getElementById("create-event-modal");
  const form = document.getElementById("create-event-form");
  const closeBtn = document.getElementById("close-create-event-modal");
  const cancelBtn = document.getElementById("cancel-create-event-btn");

  if (!openBtn || !modal || !form) return;

  openBtn.onclick = () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.style.display = "block";
  };

  const closeModal = () => {
    if (typeof modal.close === "function") modal.close();
    else modal.style.display = "none";
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  form.onsubmit = (e) => {
    e.preventDefault();

    const title = document.getElementById("event-title-input").value.trim();
    const clubName = document.getElementById("event-club-input").value.trim();
    const category = document.getElementById("event-type-input").value;
    const date = document.getElementById("event-date-input").value;
    const venue = document.getElementById("event-venue-input").value.trim();
    const fee = document.getElementById("event-fee-input").value.trim() || "Free";
    const prizes = document.getElementById("event-prizes-input").value.trim();
    const description = document.getElementById("event-desc-input").value.trim();

    if (typeof Storage !== "undefined") {
      const events = Storage.getEvents();
      events.unshift({
        id: "evt-" + Date.now(),
        title,
        clubName,
        category,
        date: new Date(date).toISOString(),
        venue,
        fee,
        prizes,
        capacity: 200,
        registeredCount: 0,
        description,
        banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800"
      });
      Storage.saveEvents(events);
    }

    refreshAdminDashboard();
    closeModal();
    form.reset();

    if (typeof UIStates !== "undefined") {
      UIStates.showToast("Event published! Now live on Campus Events.", "success");
    }
  };
}

// ---------------- ADD NEW CLUB MODAL ----------------
function initAddClubModal() {
  const openBtn = document.getElementById("open-add-club-btn");
  const modal = document.getElementById("add-club-modal");
  const form = document.getElementById("add-club-form");
  const closeBtn = document.getElementById("close-add-club-modal");
  const cancelBtn = document.getElementById("cancel-add-club-btn");

  if (!openBtn || !modal || !form) return;

  openBtn.onclick = () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.style.display = "block";
  };

  const closeModal = () => {
    if (typeof modal.close === "function") modal.close();
    else modal.style.display = "none";
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  form.onsubmit = (e) => {
    e.preventDefault();

    const name = document.getElementById("new-club-name").value.trim();
    const acronym = document.getElementById("new-club-acronym").value.trim();
    const category = document.getElementById("new-club-category").value;
    const tagline = document.getElementById("new-club-tagline").value.trim();
    const description = document.getElementById("new-club-desc").value.trim();
    const meetingInfo = document.getElementById("new-club-meeting").value.trim();
    const domains = document.getElementById("new-club-domains").value.split(",").map(d => d.trim()).filter(Boolean);

    const newClub = {
      id: "club-" + Date.now(),
      name,
      acronym,
      category,
      tagline,
      description,
      meetingInfo,
      domains,
      memberCount: 20,
      established: 2026,
      status: "OPEN",
      logo: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=160",
      banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200",
      achievements: ["Newly chartered campus student society"],
      coordinators: [{ name: "Core Lead", role: "President", email: "lead@tint.edu.in" }],
      socials: { linkedin: "https://linkedin.com" },
      tags: [category, "New Club"],
      featured: true
    };

    if (typeof Storage !== "undefined") {
      Storage.addClub(newClub);
    }

    closeModal();
    form.reset();

    if (typeof UIStates !== "undefined") {
      UIStates.showToast(`Society '${name}' chartered and added to Clubs directory!`, "success");
    }
  };
}

// ---------------- APP DETAIL MODAL ----------------
function initAppDetailModal() {
  const modal = document.getElementById("admin-app-detail-modal");
  const closeBtn = document.getElementById("admin-modal-close");

  if (!modal) return;
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (typeof modal.close === "function") modal.close();
      else modal.style.display = "none";
    };
  }
}

function viewAppDetail(appId) {
  const applications = typeof Storage !== "undefined" ? Storage.getApplications() : [];
  const app = applications.find(a => a.id === appId);
  if (!app) return;

  const modal = document.getElementById("admin-app-detail-modal");
  const nameEl = document.getElementById("admin-modal-applicant-name");
  const body = document.getElementById("admin-modal-applicant-body");

  if (nameEl) nameEl.textContent = `${app.studentName} — Application Review`;
  if (body) {
    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 0.875rem;">
        <div>
          <div style="color: var(--text-muted); font-size: 0.75rem;">Target Society &amp; Wing:</div>
          <div style="font-weight: 700; color: var(--primary-color);">${escapeHTML(app.clubName)} &bull; ${escapeHTML(app.domain || 'Core Team')}</div>
        </div>
        <div>
          <div style="color: var(--text-muted); font-size: 0.75rem;">Candidate Statement of Purpose:</div>
          <div style="background: var(--bg-surface); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); line-height: 1.55; margin-top: 4px;">
            ${escapeHTML(app.statement || 'No statement provided.')}
          </div>
        </div>
        ${app.portfolio ? `
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem;">Portfolio / Profile URL:</div>
            <a href="${escapeHTML(app.portfolio)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); font-weight: 600;">${escapeHTML(app.portfolio)}</a>
          </div>
        ` : ''}

        <div style="margin-top: 6px;">
          <label class="form-label" for="modal-app-notes">Coordinator Feedback / Decision Note:</label>
          <textarea id="modal-app-notes" class="form-textarea" rows="2" placeholder="Interview remarks or onboarding notes...">${escapeHTML(app.interviewNotes || '')}</textarea>
        </div>

        <div class="modal-footer" style="margin-top: 8px;">
          <button class="btn btn-outline btn-sm" onclick="saveAppReview('${app.id}', 'REJECTED')">Reject</button>
          <button class="btn btn-outline btn-sm" onclick="saveAppReview('${app.id}', 'SHORTLISTED')">Shortlist</button>
          <button class="btn btn-primary btn-sm" onclick="saveAppReview('${app.id}', 'APPROVED')">Approve Candidate</button>
        </div>
      </div>
    `;
  }

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.style.display = "block";
}

function saveAppReview(appId, status) {
  const notes = document.getElementById("modal-app-notes") ? document.getElementById("modal-app-notes").value.trim() : "";
  if (typeof Storage !== "undefined") {
    Storage.updateApplicationStatus(appId, status, notes);
  }

  const modal = document.getElementById("admin-app-detail-modal");
  if (modal) {
    if (typeof modal.close === "function") modal.close();
    else modal.style.display = "none";
  }

  refreshAdminDashboard();
  if (typeof UIStates !== "undefined") {
    UIStates.showToast(`Candidate application updated to: ${status}`, "success");
  }
}

// Quick action handlers from secondary branch
function handleAccept(appId) {
  if (typeof Storage !== "undefined") {
    Storage.updateApplicationStatus(appId, "APPROVED", "Profile accepted. Welcome aboard!");
    if (typeof UIStates !== "undefined") {
      UIStates.showToast("Application approved!", "success");
    }
    refreshAdminDashboard();
  }
}

function handleReject(appId) {
  if (typeof Storage !== "undefined") {
    Storage.updateApplicationStatus(appId, "REJECTED", "Position filled. Thank you for your interest.");
    if (typeof UIStates !== "undefined") {
      UIStates.showToast("Application marked as not shortlisted.", "info");
    }
    refreshAdminDashboard();
  }
}

function handleShortlist(appId) {
  if (typeof Storage !== "undefined") {
    Storage.updateApplicationStatus(appId, "SHORTLISTED", "Selected for interview stage.");
    if (typeof UIStates !== "undefined") {
      UIStates.showToast("Application shortlisted for interviews.", "info");
    }
    refreshAdminDashboard();
  }
}
