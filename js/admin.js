// js/admin.js - Logic for Club Admin Dashboard (Section 9)

let adminEvents = [];
let adminMembers = [];

document.addEventListener("DOMContentLoaded", () => {
  initAdminData();
  initAdminTabs();
  initAdminFilters();
  initCreateEventModal();
  refreshAdminDashboard();
});

function initAdminData() {
  if (typeof CAMPUS_EVENTS !== "undefined") {
    adminEvents = [...CAMPUS_EVENTS];
  }
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

function refreshAdminDashboard() {
  updateAdminMetrics();
  renderAdminApplications();
  renderAdminMembers();
  renderAdminEvents();
}

function updateAdminMetrics() {
  if (typeof Storage === "undefined") return;

  const applications = Storage.getApplications();
  const totalAppsEl = document.getElementById("admin-metric-apps");
  const totalMembersEl = document.getElementById("admin-metric-members");
  const totalEventsEl = document.getElementById("admin-metric-events");
  const acceptanceRateEl = document.getElementById("admin-metric-rate");

  if (totalAppsEl) totalAppsEl.textContent = applications.length;
  if (totalMembersEl) totalMembersEl.textContent = adminMembers.length;
  if (totalEventsEl) totalEventsEl.textContent = adminEvents.length;

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
  if (badgeEvents) badgeEvents.textContent = adminEvents.length;
}

// ============================================================
// APPLICATION MANAGEMENT TABLE & ACTIONS
// ============================================================
function renderAdminApplications() {
  const tbody = document.getElementById("admin-apps-tbody");
  if (!tbody || typeof Storage === "undefined") return;

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
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          No candidate applications found matching your criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(app => {
    return `
      <tr>
        <td>
          <div class="candidate-detail-item">
            <span class="candidate-name">${escapeHTML(app.studentName)}</span>
            <span class="candidate-roll">${escapeHTML(app.studentRoll || 'N/A')} • ${escapeHTML(app.branch || '')}</span>
          </div>
        </td>
        <td><strong>${escapeHTML(app.clubName)}</strong></td>
        <td><span class="badge badge-cat">${escapeHTML(app.domain || 'General')}</span></td>
        <td>${formatDate(app.appliedDate)}</td>
        <td>${getApplicationStatusBadge(app.status)}</td>
        <td>
          <div class="table-action-group">
            <button 
              type="button" 
              class="btn btn-success btn-sm" 
              title="Approve candidate and induct into society"
              onclick="handleAdminApprove('${app.id}', '${escapeHTML(app.studentName)}')"
            >
              Approve
            </button>
            <button 
              type="button" 
              class="btn btn-warning btn-sm" 
              title="Shortlist for interview rounds"
              onclick="handleAdminShortlist('${app.id}', '${escapeHTML(app.studentName)}')"
            >
              Shortlist
            </button>
            <button 
              type="button" 
              class="btn btn-danger btn-sm" 
              title="Reject application"
              onclick="handleAdminReject('${app.id}', '${escapeHTML(app.studentName)}')"
            >
              Reject
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function handleAdminApprove(appId, studentName) {
  if (typeof Storage === "undefined") return;
  Storage.updateApplicationStatus(appId, "ACCEPTED", "Candidate has been approved and inducted into the collegiate society.");
  refreshAdminDashboard();
  showToast(`Approved ${studentName}! Induction confirmed.`, "success");
}

function handleAdminShortlist(appId, studentName) {
  if (typeof Storage === "undefined") return;
  Storage.updateApplicationStatus(appId, "SHORTLISTED", "Candidate is shortlisted for Round 1 technical & creative interviews.");
  refreshAdminDashboard();
  showToast(`Shortlisted ${studentName} for evaluation rounds.`, "info");
}

function handleAdminReject(appId, studentName) {
  const confirmed = window.confirm(`Are you sure you want to decline the candidacy of ${studentName}?`);
  if (!confirmed) return;
  if (typeof Storage === "undefined") return;
  Storage.updateApplicationStatus(appId, "REJECTED", "Thank you for applying. We are unable to offer membership this term.");
  refreshAdminDashboard();
  showToast(`Declined application for ${studentName}.`, "error");
}

// ============================================================
// MEMBER MANAGEMENT TABLE & ACTIONS
// ============================================================
function renderAdminMembers() {
  const tbody = document.getElementById("admin-members-tbody");
  if (!tbody) return;

  const searchInput = document.getElementById("admin-member-search");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  let filtered = adminMembers.filter(m => {
    return !query ||
      m.name.toLowerCase().includes(query) ||
      m.roll.toLowerCase().includes(query) ||
      m.clubName.toLowerCase().includes(query) ||
      m.domain.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          No members found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    return `
      <tr>
        <td>
          <div class="candidate-detail-item">
            <span class="candidate-name">${escapeHTML(m.name)}</span>
            <span class="candidate-roll">${escapeHTML(m.roll)}</span>
          </div>
        </td>
        <td><strong>${escapeHTML(m.clubName)}</strong></td>
        <td><span class="badge badge-cat">${escapeHTML(m.role)}</span></td>
        <td>${escapeHTML(m.domain)}</td>
        <td><span class="badge badge-status-open">Active Scholar</span></td>
        <td>
          <div class="table-action-group">
            <button 
              type="button" 
              class="btn btn-outline btn-sm"
              onclick="showToast('Member role edit enabled.', 'info')"
            >
              Edit Role
            </button>
            <button 
              type="button" 
              class="btn btn-danger btn-sm"
              onclick="handleRemoveMember('${m.id}', '${escapeHTML(m.name)}')"
            >
              Remove
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function handleRemoveMember(memberId, name) {
  const confirmed = window.confirm(`Are you sure you want to revoke active society membership for ${name}?`);
  if (!confirmed) return;

  adminMembers = adminMembers.filter(m => m.id !== memberId);
  refreshAdminDashboard();
  showToast(`Revoked membership for ${name}.`, "info");
}

// ============================================================
// EVENT MANAGEMENT TABLE & ACTIONS
// ============================================================
function renderAdminEvents() {
  const tbody = document.getElementById("admin-events-tbody");
  if (!tbody) return;

  if (adminEvents.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          No scheduled events. Click "Create Event" to schedule an assembly.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = adminEvents.map(evt => {
    const d = new Date(evt.date);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return `
      <tr>
        <td><strong>${escapeHTML(evt.title)}</strong></td>
        <td>${escapeHTML(evt.clubName)}</td>
        <td>${dateStr}</td>
        <td>📍 ${escapeHTML(evt.venue)}</td>
        <td>
          <div class="table-action-group">
            <button 
              type="button" 
              class="btn btn-outline btn-sm"
              onclick="showToast('Event modification mode opened.', 'info')"
            >
              Edit
            </button>
            <button 
              type="button" 
              class="btn btn-danger btn-sm"
              onclick="handleDeleteEvent('${evt.id}', '${escapeHTML(evt.title)}')"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function handleDeleteEvent(eventId, title) {
  const confirmed = window.confirm(`Are you sure you want to cancel the event "${title}"?`);
  if (!confirmed) return;

  adminEvents = adminEvents.filter(e => e.id !== eventId);
  refreshAdminDashboard();
  showToast(`Cancelled event: ${title}`, "info");
}

// ============================================================
// CREATE EVENT MODAL
// ============================================================
function initCreateEventModal() {
  const modal = document.getElementById("create-event-modal");
  const form = document.getElementById("create-event-form");
  const openBtn = document.getElementById("open-create-event-btn");
  const closeBtn = document.getElementById("modal-event-close-x");
  const cancelBtn = document.getElementById("modal-event-cancel-btn");

  if (!modal || !form) return;

  if (openBtn) openBtn.onclick = () => modal.showModal();
  if (closeBtn) closeBtn.onclick = () => modal.close();
  if (cancelBtn) cancelBtn.onclick = () => modal.close();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("evt-title").value.trim();
    const clubName = document.getElementById("evt-society").value;
    const date = document.getElementById("evt-date").value;
    const venue = document.getElementById("evt-venue").value.trim();
    const type = document.getElementById("evt-type").value;

    const newEvt = {
      id: "evt-" + Date.now(),
      clubId: "gdsc",
      clubName,
      title,
      date: date || new Date().toISOString(),
      venue: venue || "Main Auditorium",
      type,
      status: "UPCOMING",
      attendees: 50,
      banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80"
    };

    adminEvents.unshift(newEvt);
    modal.close();
    form.reset();
    refreshAdminDashboard();
    showToast(`Published event "${title}" successfully!`, "success");
  });
}

function initAdminFilters() {
  const appSearch = document.getElementById("admin-app-search");
  const appStatus = document.getElementById("admin-app-status-filter");
  const memberSearch = document.getElementById("admin-member-search");

  if (appSearch) {
    appSearch.addEventListener("input", renderAdminApplications);
  }
  if (appStatus) {
    appStatus.addEventListener("change", renderAdminApplications);
  }
  if (memberSearch) {
    memberSearch.addEventListener("input", renderAdminMembers);
  }
}
