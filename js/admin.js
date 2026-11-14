// js/admin.js - Club Admin Secretariat Dashboard Controller

let adminClubs = [];
let selectedClubId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  initAdminTabs();
  initAddClubModal();
  initCreateEventModal();
  initIssueBadgeModal();
  await loadAdminDashboard();
});

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

async function loadAdminDashboard() {
  const user = API.getCurrentUser();
  if (!user) return;

  try {
    adminClubs = await API.getCoordinatedClubs();

    const selectorWrap = document.getElementById("admin-club-selector-wrap");
    const clubSelect = document.getElementById("admin-club-select");
    const emptyState = document.getElementById("admin-no-clubs-view");
    const mainView = document.getElementById("admin-main-view");

    if (!adminClubs || adminClubs.length === 0) {
      if (mainView) mainView.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (mainView) mainView.style.display = "block";

    // Populate club dropdown selector
    if (clubSelect) {
      clubSelect.innerHTML = adminClubs.map(c => `
        <option value="${c.id}">${escapeHTML(c.name)} (${c.pending_requests} pending)</option>
      `).join("");

      if (!selectedClubId || !adminClubs.some(c => c.id === selectedClubId)) {
        selectedClubId = adminClubs[0].id;
      }
      clubSelect.value = selectedClubId;

      clubSelect.onchange = async () => {
        selectedClubId = Number(clubSelect.value);
        await refreshSelectedClub();
      };
    }

    await refreshSelectedClub();

  } catch (err) {
    showToast(err.message || "Failed to load admin portal.", "error");
  }
}

async function refreshSelectedClub() {
  if (!selectedClubId) return;

  const currentClubInfo = adminClubs.find(c => c.id === selectedClubId);

  // Update recruitment toggle button
  const toggleRecruitBtn = document.getElementById("toggle-recruitment-btn");
  if (toggleRecruitBtn && currentClubInfo) {
    const isOpen = currentClubInfo.recruitment_open;
    toggleRecruitBtn.className = isOpen ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm";
    toggleRecruitBtn.innerHTML = isOpen ? "Recruitment: <strong>OPEN</strong> (Click to Close)" : "Recruitment: <strong>CLOSED</strong> (Click to Open)";
    toggleRecruitBtn.onclick = async () => {
      try {
        await API.toggleClubRecruitment(selectedClubId, !isOpen);
        showToast(`Recruitment is now ${!isOpen ? 'OPEN' : 'CLOSED'}.`, "info");
        await loadAdminDashboard();
      } catch (e) {
        showToast(e.message, "error");
      }
    };
  }

  await Promise.all([
    renderClubRequests(selectedClubId),
    renderClubMembers(selectedClubId),
    renderClubEvents(selectedClubId)
  ]);
}

// ---------------- TAB 1: JOIN REQUESTS ----------------
async function renderClubRequests(clubId) {
  const container = document.getElementById("admin-requests-tbody");
  const countBadge = document.getElementById("admin-tab-badge-apps");
  const metricApps = document.getElementById("admin-metric-apps");

  if (!container) return;

  container.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-secondary);">Loading join requests...</td></tr>`;

  try {
    const requests = await API.getClubRequests(clubId);
    const pending = requests.filter(r => r.status === "Pending");

    if (countBadge) countBadge.textContent = pending.length;
    if (metricApps) metricApps.textContent = pending.length;

    if (!requests || requests.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px 20px; color: var(--text-secondary);">
            No join requests submitted yet for this society.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const student = req.student || {};
      const studentName = student.full_name || "Applicant";
      const studentEmail = student.email || "—";
      const studentDept = student.department || "—";
      const studentYear = student.year ? `${student.year} Year` : "—";
      const appliedDate = new Date(req.applied_at).toLocaleDateString();

      let statusBadge = "";
      let actionsHtml = "";

      if (req.status === "Pending") {
        statusBadge = `<span class="badge-status-pending" style="padding: 4px 10px; border-radius: 999px; font-size: 11px;">Pending</span>`;
        actionsHtml = `
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn btn-success btn-sm" onclick="handleRequestDecision(${req.id}, 'Approved', '${escapeHTML(studentName)}')">✓ Accept</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="handleRequestDecision(${req.id}, 'Rejected', '${escapeHTML(studentName)}')">✗ Reject</button>
          </div>
        `;
      } else if (req.status === "Approved") {
        statusBadge = `<span class="badge-status-approved" style="padding: 4px 10px; border-radius: 999px; font-size: 11px;">Accepted</span>`;
        actionsHtml = `<span style="font-size: 12px; color: var(--success); font-weight: 600;">Active Member</span>`;
      } else {
        statusBadge = `<span class="badge-status-rejected" style="padding: 4px 10px; border-radius: 999px; font-size: 11px;">Rejected</span>`;
        actionsHtml = `<button type="button" class="btn btn-outline btn-sm" onclick="handleRequestDecision(${req.id}, 'Approved', '${escapeHTML(studentName)}')">Accept</button>`;
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${escapeHTML(studentName)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(studentEmail)}</div>
          </td>
          <td>${escapeHTML(studentDept)}</td>
          <td>${escapeHTML(studentYear)}</td>
          <td>${appliedDate}</td>
          <td>
            <div style="font-size: 12px; color: var(--text-secondary); max-width: 240px;">
              <strong>Motivation:</strong> ${escapeHTML(req.reason_for_joining || '—')}<br>
              <strong>Skills:</strong> ${escapeHTML(req.skills || '—')}
            </div>
          </td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load requests: ${escapeHTML(err.message)}</td></tr>`;
  }
}

async function handleRequestDecision(requestId, decision, studentName) {
  try {
    showToast(`Marking request as ${decision}...`, "info");
    await API.updateApplicationStatus(requestId, decision);
    showToast(`Join request for ${studentName} was ${decision}!`, "success");
    await loadAdminDashboard();
  } catch (err) {
    showToast(err.message || "Failed to update request.", "error");
  }
}

// ---------------- TAB 2: EVENTS MANAGER ----------------
async function renderClubEvents(clubId) {
  const container = document.getElementById("admin-events-tbody");
  const countBadge = document.getElementById("admin-tab-badge-events");
  const metricEvents = document.getElementById("admin-metric-events");

  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-secondary);">Loading club events...</td></tr>`;

  try {
    const events = await API.getEvents({ club_id: clubId });

    if (countBadge) countBadge.textContent = events.length;
    if (metricEvents) metricEvents.textContent = events.length;

    if (!events || events.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 36px 20px; color: var(--text-secondary);">
            No events scheduled for this society yet. Click "+ Schedule Event" above to create one.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = events.map(ev => {
      const dateStr = new Date(ev.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      return `
        <tr>
          <td style="font-weight: 600; color: var(--text-main);">${escapeHTML(ev.title)}</td>
          <td><span class="badge" style="font-size: 11px;">${escapeHTML(ev.category)}</span></td>
          <td>${dateStr}</td>
          <td>${escapeHTML(ev.location)}</td>
          <td>
            <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="handleDeleteEvent(${ev.id}, '${escapeHTML(ev.title)}')">Delete</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load events: ${escapeHTML(err.message)}</td></tr>`;
  }
}

async function handleDeleteEvent(eventId, title) {
  if (!confirm(`Are you sure you want to delete the event '${title}'?`)) return;
  try {
    await API.deleteEvent(eventId);
    showToast(`Event '${title}' deleted successfully.`, "success");
    await renderClubEvents(selectedClubId);
  } catch (err) {
    showToast(err.message || "Failed to delete event.", "error");
  }
}

// ---------------- TAB 3: MEMBERS ROSTER ----------------
async function renderClubMembers(clubId) {
  const container = document.getElementById("admin-members-tbody");
  const countBadge = document.getElementById("admin-tab-badge-members");
  const metricMembers = document.getElementById("admin-metric-members");

  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-secondary);">Loading members roster...</td></tr>`;

  try {
    const members = await API.getClubMembers(clubId);

    if (countBadge) countBadge.textContent = members.length;
    if (metricMembers) metricMembers.textContent = members.length;

    if (!members || members.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 36px 20px; color: var(--text-secondary);">
            No inducted core members yet. Approved candidates will appear here.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = members.map(m => {
      const student = m.student || {};
      const joinedDate = new Date(m.joined_at).toLocaleDateString();
      const studentName = student.full_name || "Member";

      return `
        <tr>
          <td style="font-weight: 600; color: var(--text-main);">${escapeHTML(studentName)}</td>
          <td>${escapeHTML(student.email || '—')}</td>
          <td>${escapeHTML(student.department || '—')}</td>
          <td>${joinedDate}</td>
          <td>
            <button type="button" class="btn btn-outline btn-sm" onclick="openIssueBadgeModal(${student.id}, '${escapeHTML(studentName)}')">
              Award Badge
            </button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load members: ${escapeHTML(err.message)}</td></tr>`;
  }
}

// ---------------- MODAL: ADD CLUB ----------------
function initAddClubModal() {
  const openBtns = [document.getElementById("open-add-club-btn"), document.getElementById("empty-create-club-btn")];
  const modal = document.getElementById("add-club-modal");
  const closeBtn = document.getElementById("close-add-club-btn");
  const form = document.getElementById("add-club-form");

  if (!modal || !form) return;

  openBtns.forEach(btn => {
    if (btn) btn.addEventListener("click", () => modal.style.display = "flex");
  });

  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("new-club-name").value.trim();
    const category = document.getElementById("new-club-category").value;
    const description = document.getElementById("new-club-desc").value.trim();
    const imageUrl = document.getElementById("new-club-image") ? document.getElementById("new-club-image").value.trim() : null;

    try {
      await API.createClub({
        name,
        category,
        description,
        image_url: imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
        recruitment_open: true
      });

      showToast(`Club '${name}' created successfully! You are its coordinator.`, "success");
      modal.style.display = "none";
      form.reset();
      await loadAdminDashboard();
    } catch (err) {
      showToast(err.message || "Failed to charter club.", "error");
    }
  });
}

// ---------------- MODAL: CREATE EVENT ----------------
function initCreateEventModal() {
  const openBtn = document.getElementById("open-create-event-btn");
  const modal = document.getElementById("create-event-modal");
  const closeBtn = document.getElementById("close-create-event-btn");
  const form = document.getElementById("create-event-form");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    if (!selectedClubId) {
      showToast("Please charter or select a club first.", "warning");
      return;
    }
    modal.style.display = "flex";
  });

  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedClubId) return;

    const title = document.getElementById("event-title-input").value.trim();
    const category = document.getElementById("event-category-input").value;
    const dateVal = document.getElementById("event-date-input").value;
    const location = document.getElementById("event-location-input").value.trim();
    const description = document.getElementById("event-desc-input").value.trim();

    try {
      await API.createEvent({
        club_id: selectedClubId,
        title,
        category,
        event_date: new Date(dateVal).toISOString(),
        location,
        description
      });

      showToast(`Event '${title}' scheduled successfully!`, "success");
      modal.style.display = "none";
      form.reset();
      await renderClubEvents(selectedClubId);
    } catch (err) {
      showToast(err.message || "Failed to schedule event.", "error");
    }
  });
}

// ---------------- MODAL: ISSUE BADGE ----------------
let badgeRecipientId = null;

function initIssueBadgeModal() {
  const modal = document.getElementById("issue-badge-modal");
  const closeBtn = document.getElementById("close-issue-badge-btn");
  const form = document.getElementById("issue-badge-form");

  if (!modal || !form) return;

  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!badgeRecipientId || !selectedClubId) return;

    const title = document.getElementById("badge-title-input").value.trim();
    const description = document.getElementById("badge-desc-input").value.trim();

    try {
      await API.issueBadge({
        student_id: badgeRecipientId,
        club_id: selectedClubId,
        title,
        description
      });

      showToast(`Badge '${title}' awarded successfully!`, "success");
      modal.style.display = "none";
      form.reset();
    } catch (err) {
      showToast(err.message || "Failed to issue badge.", "error");
    }
  });
}

function openIssueBadgeModal(studentId, studentName) {
  badgeRecipientId = studentId;
  const modal = document.getElementById("issue-badge-modal");
  const subtitle = document.getElementById("badge-recipient-name");
  if (subtitle) subtitle.textContent = `Awarding credential to: ${studentName}`;
  if (modal) modal.style.display = "flex";
}
