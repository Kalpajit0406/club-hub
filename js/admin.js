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
    searchInput.addEventListener("input", debounce(renderAdminApplications, 200));
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", renderAdminApplications);
  }
}

function refreshAdminDashboard() {
  updateAdminMetrics();
  renderAdminApplications();
  renderAdminMembers();
  renderAdminEvents();
}

function updateAdminMetrics() {
  const applications = Storage.getApplications();
  const events = Storage.getEvents();

  const totalAppsEl = document.getElementById("admin-metric-apps");
  const totalMembersEl = document.getElementById("admin-metric-members");
  const totalEventsEl = document.getElementById("admin-metric-events");
  const acceptanceRateEl = document.getElementById("admin-metric-rate");

  if (totalAppsEl) totalAppsEl.textContent = applications.length;
  if (totalMembersEl) totalMembersEl.textContent = adminMembers.length;
  if (totalEventsEl) totalEventsEl.textContent = events.length;

  if (acceptanceRateEl) {
    const accepted = applications.filter(a => a.status === "ACCEPTED" || a.status === "APPROVED").length;
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

  const applications = Storage.getApplications();
  const searchInput = document.getElementById("admin-app-search");
  const statusFilter = document.getElementById("admin-app-status-filter");

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const filterStatus = statusFilter ? statusFilter.value : "ALL";

  let filtered = applications.filter(app => {
    const matchQuery = !query || 
      (app.studentName && app.studentName.toLowerCase().includes(query)) ||
      (app.studentRoll && app.studentRoll.toLowerCase().includes(query)) ||
      (app.clubName && app.clubName.toLowerCase().includes(query)) ||
      (app.domain && app.domain.toLowerCase().includes(query));

    const matchStatus = filterStatus === "ALL" || app.status === filterStatus;
    return matchQuery && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No matching applications found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(app => {
    let statusBadge = "badge-warning";
    let statusText = "Pending Review";

    if (app.status === "APPROVED" || app.status === "ACCEPTED") {
      statusBadge = "badge-success";
      statusText = "Approved";
    } else if (app.status === "SHORTLISTED") {
      statusBadge = "badge-primary";
      statusText = "Shortlisted";
    } else if (app.status === "REJECTED") {
      statusBadge = "badge-danger";
      statusText = "Rejected";
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(app.studentName)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(app.studentRoll)} &bull; ${escapeHTML(app.email)}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHTML(app.clubName)}</div>
          <div style="font-size: 11px; color: var(--primary); font-weight: 600;">Wing: ${escapeHTML(app.domain)}</div>
        </td>
        <td>
          <div style="font-size: 12px;">${escapeHTML(app.branch)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(app.year)}</div>
        </td>
        <td>
          <span class="badge ${statusBadge}">${statusText}</span>
        </td>
        <td>${formatDate(app.appliedDate)}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 11px;" onclick="viewAppDetail('${app.id}')">
              Review
            </button>
            <button class="btn btn-primary btn-sm" style="padding: 2px 8px; font-size: 11px; background: var(--success); border-color: var(--success);" onclick="quickUpdateStatus('${app.id}', 'APPROVED')">
              Approve
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function quickUpdateStatus(appId, newStatus) {
  Storage.updateApplicationStatus(appId, newStatus, `Approved by Club Coordinator on ${new Date().toLocaleDateString()}`);
  refreshAdminDashboard();
  showToast(`Application #${appId} marked as ${newStatus}`, "success");
}

// ---------------- EVENTS MANAGER ----------------
function renderAdminEvents() {
  const tbody = document.getElementById("admin-events-tbody");
  if (!tbody) return;

  const events = Storage.getEvents();
  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No scheduled events.</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(e => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(e.title)}</div>
        <div style="font-size: 11px; color: var(--primary);">${escapeHTML(e.clubName)}</div>
      </td>
      <td><span class="badge badge-primary">${escapeHTML(e.category)}</span></td>
      <td>
        <div>${formatDateTime(e.date)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(e.venue)}</div>
      </td>
      <td>
        <strong>${e.registeredCount || 0}</strong> / ${e.capacity || 200}
      </td>
      <td>
        <div style="font-size: 12px;">Fee: ${escapeHTML(e.fee || 'Free')}</div>
        ${e.prizes ? `<div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(e.prizes)}</div>` : ''}
      </td>
      <td>
        <span class="badge badge-success">ACTIVE &bull; PUBLISHED</span>
      </td>
    </tr>
  `).join("");
}

// ---------------- MEMBERS ROSTER ----------------
function renderAdminMembers() {
  const tbody = document.getElementById("admin-members-tbody");
  if (!tbody) return;

  tbody.innerHTML = adminMembers.map(m => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(m.name)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(m.email)}</div>
      </td>
      <td>${escapeHTML(m.roll)}</td>
      <td>
        <div style="font-weight: 600;">${escapeHTML(m.clubName)}</div>
        <div style="font-size: 11px; color: var(--text-secondary);">${escapeHTML(m.domain)}</div>
      </td>
      <td><span class="badge badge-primary">${escapeHTML(m.role)}</span></td>
      <td>${escapeHTML(m.joined)}</td>
      <td><span class="badge badge-success">ACTIVE</span></td>
    </tr>
  `).join("");
}

// ---------------- CREATE EVENT MODAL ----------------
function initCreateEventModal() {
  const openBtn = document.getElementById("open-create-event-btn");
  const modal = document.getElementById("create-event-modal");
  const form = document.getElementById("create-event-form");
  const closeBtn = document.getElementById("close-create-event-modal");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("event-title-input").value.trim();
    const clubName = document.getElementById("event-club-input").value.trim();
    const category = document.getElementById("event-type-input").value;
    const date = document.getElementById("event-date-input").value;
    const venue = document.getElementById("event-venue-input").value.trim();
    const fee = document.getElementById("event-fee-input").value.trim() || "Free";
    const prizes = document.getElementById("event-prizes-input").value.trim();
    const description = document.getElementById("event-desc-input").value.trim();

    Storage.addEvent({
      title,
      clubName,
      category,
      date,
      venue,
      fee,
      prizes,
      description,
      banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
      tags: [category, "Campus Event"]
    });

    refreshAdminDashboard();
    modal.style.display = "none";
    form.reset();
    showToast("Event published! Now live on the Campus Events page.", "success");
  });
}

// ---------------- ADD NEW CLUB MODAL ----------------
function initAddClubModal() {
  const openBtn = document.getElementById("open-add-club-btn");
  const modal = document.getElementById("add-club-modal");
  const form = document.getElementById("add-club-form");
  const closeBtn = document.getElementById("close-add-club-modal");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
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
      coordinators: [{ name: "Core Coordinator", role: "Club Lead", email: "coordinator@tint.edu.in" }],
      socials: { linkedin: "https://linkedin.com" },
      tags: [category, "New Club"],
      featured: true
    };

    Storage.addClub(newClub);
    modal.style.display = "none";
    form.reset();
    showToast(`Society '${name}' officially chartered and added to the Clubs catalog!`, "success");
  });
}

// ---------------- APP DETAIL MODAL ----------------
function initAppDetailModal() {
  const modal = document.getElementById("admin-app-detail-modal");
  const closeBtn = document.getElementById("admin-modal-close");

  if (!modal) return;
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

function viewAppDetail(appId) {
  const app = Storage.getApplicationById(appId);
  if (!app) return;

  const modal = document.getElementById("admin-app-detail-modal");
  const nameEl = document.getElementById("admin-modal-applicant-name");
  const body = document.getElementById("admin-modal-applicant-body");

  nameEl.textContent = `${app.studentName} — Application Review`;
  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
      <div>
        <div style="color: var(--text-muted); font-size: 11px;">Target Society &amp; Wing:</div>
        <div style="font-weight: 700; color: var(--primary);">${escapeHTML(app.clubName)} &bull; ${escapeHTML(app.domain)}</div>
      </div>
      <div>
        <div style="color: var(--text-muted); font-size: 11px;">Candidate Statement of Purpose:</div>
        <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border); line-height: 1.5;">
          ${escapeHTML(app.statement || 'No statement provided.')}
        </div>
      </div>
      ${app.portfolioUrl ? `
        <div>
          <div style="color: var(--text-muted); font-size: 11px;">Portfolio / GitHub:</div>
          <a href="${escapeHTML(app.portfolioUrl)}" target="_blank" style="color: var(--primary); font-weight: 600;">${escapeHTML(app.portfolioUrl)}</a>
        </div>
      ` : ''}

      <div style="margin-top: 10px;">
        <label class="form-label">Coordinator Feedback / Interview Notes:</label>
        <textarea id="modal-app-notes" class="form-textarea" rows="2">${escapeHTML(app.interviewNotes || '')}</textarea>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
        <button class="btn btn-outline btn-sm" onclick="saveAppReview('${app.id}', 'REJECTED')">Reject</button>
        <button class="btn btn-outline btn-sm" onclick="saveAppReview('${app.id}', 'SHORTLISTED')">Shortlist</button>
        <button class="btn btn-primary btn-sm" style="background: var(--success); border-color: var(--success);" onclick="saveAppReview('${app.id}', 'APPROVED')">Approve Candidate</button>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function saveAppReview(appId, status) {
  const notes = document.getElementById("modal-app-notes") ? document.getElementById("modal-app-notes").value.trim() : "";
  Storage.updateApplicationStatus(appId, status, notes);
  document.getElementById("admin-app-detail-modal").style.display = "none";
  refreshAdminDashboard();
  showToast(`Candidate application updated to ${status}`, "success");
}
