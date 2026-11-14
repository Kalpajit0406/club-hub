// js/admin.js - CampusConnect Admin & Club Leadership Portal Controller

const adminState = {
  clubFilter: "ALL",
  statusFilter: "ALL",
  searchQuery: ""
};

document.addEventListener("DOMContentLoaded", () => {
  initAdminTabs();
  populateClubDropdownFilter();
  initToolbarFilters();
  refreshAdminView();
  initViewModal();
});

function initAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab-btn");
  const panes = document.querySelectorAll(".admin-tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.style.display = "none");

      tab.classList.add("active");
      const targetPane = document.getElementById(`pane-${target}`);
      if (targetPane) targetPane.style.display = "block";
    });
  });
}

function populateClubDropdownFilter() {
  const select = document.getElementById("admin-club-filter");
  if (!select || typeof CLUBS_DATA === "undefined") return;

  select.innerHTML = `<option value="ALL">All Clubs & Chapters</option>` +
    CLUBS_DATA.map(c => `<option value="${c.id}">${escapeHTML(c.name)} (${c.acronym || c.category})</option>`).join("");
}

function initToolbarFilters() {
  const clubSelect = document.getElementById("admin-club-filter");
  const statusSelect = document.getElementById("admin-status-filter");
  const searchInput = document.getElementById("admin-search-input");

  if (clubSelect) {
    clubSelect.addEventListener("change", (e) => {
      adminState.clubFilter = e.target.value;
      renderApplicationsTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      adminState.statusFilter = e.target.value;
      renderApplicationsTable();
    });
  }

  if (searchInput) {
    let debounce;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        adminState.searchQuery = e.target.value.trim().toLowerCase();
        renderApplicationsTable();
      }, 150);
    });
  }
}

function refreshAdminView() {
  updateAdminMetrics();
  renderApplicationsTable();
  renderMembersTable();
  renderEventsTable();
}

// ---------------- UPDATE METRICS ----------------
function updateAdminMetrics() {
  if (typeof Storage === "undefined") return;

  const apps = Storage.getApplications();
  const total = apps.length;
  const pending = apps.filter(a => a.status === "PENDING").length;
  const shortlisted = apps.filter(a => a.status === "SHORTLISTED").length;
  const approved = apps.filter(a => a.status === "ACCEPTED" || a.status === "APPROVED").length;

  document.getElementById("admin-metric-total").textContent = total;
  document.getElementById("admin-metric-pending").textContent = pending;
  document.getElementById("admin-metric-shortlisted").textContent = shortlisted;
  document.getElementById("admin-metric-approved").textContent = approved;

  document.getElementById("tab-count-admin-apps").textContent = total;
}

// ---------------- RENDER APPLICATIONS TABLE ----------------
function renderApplicationsTable() {
  const tbody = document.getElementById("admin-applications-tbody");
  if (!tbody || typeof Storage === "undefined") return;

  let apps = Storage.getApplications();

  // Filter by Club
  if (adminState.clubFilter !== "ALL") {
    apps = apps.filter(a => a.clubId === adminState.clubFilter);
  }

  // Filter by Status
  if (adminState.statusFilter !== "ALL") {
    apps = apps.filter(a => a.status === adminState.statusFilter);
  }

  // Search filter
  if (adminState.searchQuery) {
    const q = adminState.searchQuery;
    apps = apps.filter(a => {
      const matchName = (a.studentName || "").toLowerCase().includes(q);
      const matchRoll = (a.studentRoll || "").toLowerCase().includes(q);
      const matchDomain = (a.domain || "").toLowerCase().includes(q);
      const matchClub = (a.clubName || "").toLowerCase().includes(q);
      return matchName || matchRoll || matchDomain || matchClub;
    });
  }

  if (apps.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
          <div style="font-size: 1rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem;">No matching applications found</div>
          <p style="font-size: 0.85rem;">Try resetting your filters or search keywords.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(app.studentName)}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHTML(app.studentRoll || '')} • ${escapeHTML(app.year || '')}</div>
          <div style="font-size: 0.8rem; color: var(--primary);">${escapeHTML(app.email || '')}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--navy);">${escapeHTML(app.clubName)}</div>
          <div style="font-size: 0.8125rem; color: var(--text-secondary);">${escapeHTML(app.domain || 'General')}</div>
        </td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">
          ${formatDate(app.appliedDate)}
        </td>
        <td>
          ${getApplicationStatusBadge(app.status)}
        </td>
        <td>
          <div class="table-action-btns">
            <button 
              type="button" 
              class="btn btn-outline btn-sm" 
              title="View Application Details"
              onclick="viewApplicationDetails('${app.id}')"
            >
              View
            </button>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              style="color: var(--primary);" 
              title="Shortlist for Interview"
              onclick="handleStatusUpdate('${app.id}', 'SHORTLISTED')"
            >
              Shortlist
            </button>
            <button 
              type="button" 
              class="btn btn-success btn-sm" 
              title="Approve & Accept"
              onclick="handleStatusUpdate('${app.id}', 'ACCEPTED')"
            >
              Approve
            </button>
            <button 
              type="button" 
              class="btn btn-danger btn-sm" 
              title="Reject"
              onclick="handleStatusUpdate('${app.id}', 'REJECTED')"
            >
              Reject
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Action handlers
function handleStatusUpdate(appId, newStatus) {
  if (typeof Storage === "undefined") return;

  const updated = Storage.updateApplicationStatus(appId, newStatus);
  if (updated) {
    refreshAdminView();
    updateNavBadges();
    showToast(`Applicant status changed to ${newStatus}`, "success");
  }
}

// ---------------- RENDER MEMBERS TABLE ----------------
function renderMembersTable() {
  const tbody = document.getElementById("admin-members-tbody");
  if (!tbody || typeof CAMPUS_MEMBERS === "undefined") return;

  document.getElementById("tab-count-admin-members").textContent = CAMPUS_MEMBERS.length;

  tbody.innerHTML = CAMPUS_MEMBERS.map(mem => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(mem.name)}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHTML(mem.roll)}</div>
      </td>
      <td>
        <div style="font-weight: 600; color: var(--navy);">${escapeHTML(mem.clubName)}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHTML(mem.domain)}</div>
      </td>
      <td>
        <span class="badge badge-cat badge-cat-technical">${escapeHTML(mem.role)}</span>
      </td>
      <td style="font-size: 0.85rem; color: var(--text-secondary);">
        ${escapeHTML(mem.joined)}
      </td>
      <td>
        <span class="badge badge-status-open"><span class="badge-dot"></span> Active</span>
      </td>
    </tr>
  `).join("");
}

// ---------------- RENDER EVENTS TABLE ----------------
function renderEventsTable() {
  const container = document.getElementById("admin-events-grid");
  if (!container || typeof CAMPUS_EVENTS === "undefined") return;

  document.getElementById("tab-count-admin-events").textContent = CAMPUS_EVENTS.length;

  container.innerHTML = CAMPUS_EVENTS.map(evt => {
    const d = new Date(evt.date);
    const dateFormatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

    return `
      <div class="application-card" style="margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem;">
          <div>
            <span class="badge badge-cat badge-cat-technical" style="margin-bottom: 0.35rem;">${escapeHTML(evt.type)}</span>
            <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.25rem;">
              ${escapeHTML(evt.title)}
            </h3>
            <div style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">${escapeHTML(evt.clubName)}</div>
          </div>
          <span class="badge badge-status-open">Upcoming</span>
        </div>

        <div class="app-details-grid" style="margin-bottom: 0.85rem;">
          <div class="app-detail-item">
            <span class="app-detail-label">Schedule</span>
            <span class="app-detail-val">📅 ${dateFormatted}</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Location</span>
            <span class="app-detail-val">📍 ${escapeHTML(evt.venue)}</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Registered Attendees</span>
            <span class="app-detail-val">👥 ${evt.attendees} Students</span>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="showToast('Event details notification dispatched to registered attendees', 'info')">Send Announcement</button>
          <button class="btn btn-secondary btn-sm" onclick="showToast('Event settings opened', 'info')">Edit Event</button>
        </div>
      </div>
    `;
  }).join("");
}

// ---------------- VIEW APPLICATION DETAIL MODAL ----------------
function initViewModal() {
  const modal = document.getElementById("viewAppModal");
  const closeBtn = document.getElementById("modal-view-close-btn");
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener("click", () => modal.close());

  modal.addEventListener("click", (e) => {
    const dims = modal.getBoundingClientRect();
    if (
      e.clientX < dims.left ||
      e.clientX > dims.right ||
      e.clientY < dims.top ||
      e.clientY > dims.bottom
    ) {
      modal.close();
    }
  });
}

function viewApplicationDetails(appId) {
  if (typeof Storage === "undefined") return;
  const app = Storage.getApplicationById(appId);
  const modal = document.getElementById("viewAppModal");
  if (!app || !modal) return;

  document.getElementById("view-modal-name").textContent = app.studentName;
  document.getElementById("view-modal-club").textContent = `${app.clubName} • ${app.domain}`;
  document.getElementById("view-modal-roll").textContent = app.studentRoll || "N/A";
  document.getElementById("view-modal-dept").textContent = `${app.branch || ''} (${app.year || ''})`;
  document.getElementById("view-modal-email").textContent = app.email || "N/A";
  document.getElementById("view-modal-date").textContent = formatDate(app.appliedDate);
  document.getElementById("view-modal-status").innerHTML = getApplicationStatusBadge(app.status);
  document.getElementById("view-modal-sop").textContent = app.statement || "No statement provided.";

  const portfolioContainer = document.getElementById("view-modal-portfolio");
  if (app.portfolioUrl) {
    portfolioContainer.innerHTML = `<a href="${escapeHTML(app.portfolioUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); font-weight: 600; text-decoration: underline;">${escapeHTML(app.portfolioUrl)} &nearr;</a>`;
  } else {
    portfolioContainer.textContent = "None provided.";
  }

  // Quick Action Buttons inside View Modal
  const actionsBox = document.getElementById("view-modal-actions");
  actionsBox.innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" onclick="handleStatusUpdate('${app.id}', 'SHORTLISTED'); document.getElementById('viewAppModal').close();">Shortlist</button>
    <button type="button" class="btn btn-success btn-sm" onclick="handleStatusUpdate('${app.id}', 'ACCEPTED'); document.getElementById('viewAppModal').close();">Approve</button>
    <button type="button" class="btn btn-danger btn-sm" onclick="handleStatusUpdate('${app.id}', 'REJECTED'); document.getElementById('viewAppModal').close();">Reject</button>
  `;

  modal.showModal();
}
