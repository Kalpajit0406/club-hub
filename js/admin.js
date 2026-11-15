// js/admin.js - Club Admin Secretariat Dashboard Controller

let adminClubs = [];
let selectedClubId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAdminAuth();
  if (!user) return;

  initAdminTabs();
  initAddClubModal();
  initEditClubModal();
  initDeleteClub();
  initAdminEditProfileModal();
  initCreateEventModal();
  initEditEventModal();
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

    const emptyState = document.getElementById("admin-no-clubs-view");
    const mainView = document.getElementById("admin-main-view");
    const clubSelect = document.getElementById("admin-club-select");

    if (!adminClubs || adminClubs.length === 0) {
      if (mainView) mainView.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (mainView) mainView.style.display = "block";

    // Populate club dropdown selector with "All Societies" option
    if (clubSelect) {
      const totalPending = adminClubs.reduce((acc, c) => acc + (c.pending_requests || 0), 0);
      let optionsHtml = `<option value="all">⚡ All Campus Societies (${totalPending} pending)</option>`;
      optionsHtml += adminClubs.map(c => `
        <option value="${c.id}">${escapeHTML(c.name)} (${c.pending_requests || 0} pending)</option>
      `).join("");

      clubSelect.innerHTML = optionsHtml;

      if (!selectedClubId || (selectedClubId !== "all" && !adminClubs.some(c => c.id === selectedClubId))) {
        selectedClubId = "all";
      }
      clubSelect.value = selectedClubId;

      clubSelect.onchange = async () => {
        selectedClubId = clubSelect.value === "all" ? "all" : Number(clubSelect.value);
        await refreshSelectedClub();
      };
    }

    await refreshSelectedClub();

  } catch (err) {
    showToast(err.message || "Failed to load admin portal.", "error");
  }
}

async function refreshSelectedClub() {
  const isAll = selectedClubId === "all";
  const currentClubInfo = !isAll ? adminClubs.find(c => c.id === selectedClubId) : adminClubs[0];

  // Update recruitment toggle button
  const toggleRecruitBtn = document.getElementById("toggle-recruitment-btn");
  const editClubBtn = document.getElementById("open-edit-club-btn");

  if (toggleRecruitBtn) {
    if (isAll) {
      toggleRecruitBtn.className = "btn btn-outline btn-sm";
      toggleRecruitBtn.innerHTML = "Society Recruitment: <strong>All Active</strong>";
      toggleRecruitBtn.onclick = () => showToast("Select a specific society from the dropdown to toggle its recruitment.", "info");
    } else if (currentClubInfo) {
      const isOpen = currentClubInfo.recruitment_open;
      toggleRecruitBtn.className = isOpen ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm";
      toggleRecruitBtn.innerHTML = isOpen ? "Recruitment: <strong>OPEN</strong> (Click to Close)" : "Recruitment: <strong>CLOSED</strong> (Click to Open)";
      toggleRecruitBtn.onclick = async () => {
        try {
          await API.toggleClubRecruitment(selectedClubId, !isOpen);
          showToast(`Recruitment is now ${!isOpen ? 'OPEN' : 'CLOSED'}.`, "info");
          await loadAdminDashboard();
        } catch (e) {
          showToast(e.message || "Failed to toggle recruitment.", "error");
        }
      };
    }
  }

  if (editClubBtn) {
    editClubBtn.onclick = () => {
      openEditClubModal(isAll ? (adminClubs.length === 1 ? adminClubs[0].id : null) : selectedClubId);
    };
  }

  const targetClubIdForSubLists = isAll ? (adminClubs[0] ? adminClubs[0].id : null) : selectedClubId;

  await Promise.all([
    renderClubRequests(selectedClubId),
    renderClubMembers(targetClubIdForSubLists),
    renderClubEvents(selectedClubId),
    renderAdminSocieties()
  ]);
}

// ---------------- TAB 1: JOIN REQUESTS ----------------
async function renderClubRequests(clubId) {
  const container = document.getElementById("admin-requests-tbody");
  const countBadge = document.getElementById("admin-tab-badge-apps");
  const metricApps = document.getElementById("admin-metric-apps");

  if (!container) return;

  container.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-secondary);">Loading join requests...</td></tr>`;

  try {
    const requests = await API.getClubRequests(clubId);
    const pending = requests.filter(r => r.status === "Pending");

    if (countBadge) countBadge.textContent = pending.length;
    if (metricApps) metricApps.textContent = pending.length;

    if (!requests || requests.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--text-secondary);">
            No student join requests found. Incoming membership applications from students will appear here for your review!
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
      const clubName = req.club ? req.club.name : "Society";
      const appliedDate = new Date(req.applied_at).toLocaleDateString();

      let statusBadge = "";
      let actionsHtml = "";

      if (req.status === "Pending") {
        statusBadge = `<span class="badge-status-pending" style="padding: 4px 10px; border-radius: 999px; font-size: 11px;">Pending Review</span>`;
        actionsHtml = `
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn btn-success btn-sm" onclick="handleRequestDecision(${req.id}, 'Approved', '${escapeHTML(studentName)}')">✓ Accept</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="handleRequestDecision(${req.id}, 'Rejected', '${escapeHTML(studentName)}')">✗ Reject</button>
          </div>
        `;
      } else if (req.status === "Approved") {
        statusBadge = `<span class="badge-status-approved" style="padding: 4px 10px; border-radius: 999px; font-size: 11px;">✓ Accepted</span>`;
        actionsHtml = `<span style="font-size: 12px; color: var(--success); font-weight: 700;">Active Core Member</span>`;
      } else {
        statusBadge = `<span class="badge-status-rejected" style="padding: 4px 10px; border-radius: 999px; font-size: 11px;">✗ Rejected</span>`;
        actionsHtml = `
          <button type="button" class="btn btn-outline btn-sm" onclick="handleRequestDecision(${req.id}, 'Approved', '${escapeHTML(studentName)}')">Re-accept</button>
        `;
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(studentName)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(studentEmail)}</div>
          </td>
          <td>
            <span class="badge" style="font-size: 11px; font-weight: 700; background: var(--primary-light); color: var(--primary); border: 1px solid var(--primary-border);">
              ${escapeHTML(clubName)}
            </span>
          </td>
          <td>${escapeHTML(studentDept)}</td>
          <td>${escapeHTML(studentYear)}</td>
          <td>${appliedDate}</td>
          <td>
            <div style="font-size: 12px; color: var(--text-secondary); max-width: 220px;">
              <strong>Motivation:</strong> ${escapeHTML(req.reason_for_joining || '—')}<br>
              <strong>Skills:</strong> ${escapeHTML(req.skills || '—')}
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div>${statusBadge}</div>
              <div>${actionsHtml}</div>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load requests: ${escapeHTML(err.message)}</td></tr>`;
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

// ---------------- TAB 2: EVENTS & WORKSHOPS MANAGER ----------------
let currentClubEvents = [];

async function renderClubEvents(clubId) {
  const container = document.getElementById("admin-events-tbody");
  const countBadge = document.getElementById("admin-tab-badge-events");
  const metricEvents = document.getElementById("admin-metric-events");

  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-secondary);">Loading club events...</td></tr>`;

  try {
    const queryClubId = (clubId && clubId !== "all") ? clubId : undefined;
    const events = await API.getEvents({ club_id: queryClubId });
    currentClubEvents = events;

    if (countBadge) countBadge.textContent = events.length;
    if (metricEvents) metricEvents.textContent = events.length;

    if (!events || events.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 36px 20px; color: var(--text-secondary);">
            No events or workshops scheduled yet. Click "+ Schedule Event / Workshop" above to publish one.
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
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="openEditEventModal(${ev.id})">✏️ Edit</button>
              <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="handleDeleteEvent(${ev.id}, '${escapeHTML(ev.title)}')">🗑️ Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load events: ${escapeHTML(err.message)}</td></tr>`;
  }
}

async function handleDeleteEvent(eventId, title) {
  if (!confirm(`Are you sure you want to delete the event '${title}'? This cannot be undone.`)) return;
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
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="openIssueBadgeModal(${student.id}, '${escapeHTML(studentName)}')">
                Award Badge
              </button>
              <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="handleRemoveMember(${clubId}, ${student.id}, '${escapeHTML(studentName)}')">
                Remove
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load members: ${escapeHTML(err.message)}</td></tr>`;
  }
}

async function handleRemoveMember(clubId, studentId, studentName) {
  if (!confirm(`Are you sure you want to remove ${studentName} from this club's membership roster?`)) return;
  try {
    await API.removeClubMember(clubId, studentId);
    showToast(`${studentName} removed from membership roster.`, "info");
    await renderClubMembers(clubId);
  } catch (err) {
    showToast(err.message || "Failed to remove member.", "error");
  }
}

// ---------------- MODAL: ADD CLUB ----------------
function initAddClubModal() {
  const openBtns = [document.getElementById("open-add-club-btn"), document.getElementById("empty-create-club-btn")];
  const modal = document.getElementById("add-club-modal");
  const closeBtn = document.getElementById("close-add-club-btn");
  const form = document.getElementById("add-club-form");
  const fileInput = document.getElementById("new-club-file");
  const preview = document.getElementById("new-club-preview");

  if (!modal || !form) return;

  if (fileInput && preview) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("Image must be smaller than 5MB.", "error");
          fileInput.value = "";
          return;
        }
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
    });
  }

  openBtns.forEach(btn => {
    if (btn) btn.addEventListener("click", () => {
      if (preview) preview.innerHTML = "Preview";
      if (fileInput) fileInput.value = "";
      modal.style.display = "flex";
    });
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
      let finalImageUrl = imageUrl;
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file) {
        showToast("Uploading club cover image...", "info");
        const upRes = await API.uploadImage(file);
        finalImageUrl = upRes.url;
      }
      if (!finalImageUrl) {
        finalImageUrl = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80";
      }

      const created = await API.createClub({
        name,
        category,
        description,
        image_url: finalImageUrl,
        recruitment_open: true
      });

      showToast(`Club '${name}' created successfully! You are its Lead Coordinator.`, "success");
      modal.style.display = "none";
      form.reset();
      selectedClubId = created.id;
      await loadAdminDashboard();
    } catch (err) {
      showToast(err.message || "Failed to create club.", "error");
    }
  });
}

// ---------------- MODAL: EDIT CLUB ----------------
function initEditClubModal() {
  const modal = document.getElementById("edit-club-modal");
  const closeBtn = document.getElementById("close-edit-club-btn");
  const form = document.getElementById("edit-club-form");
  const fileInput = document.getElementById("edit-club-file");
  const preview = document.getElementById("edit-club-preview");

  if (!modal || !form) return;

  if (fileInput && preview) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("Image must be smaller than 5MB.", "error");
          fileInput.value = "";
          return;
        }
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedClubId || selectedClubId === "all") {
      showToast("Please choose a specific society to update.", "warning");
      return;
    }

    const name = document.getElementById("edit-club-name").value.trim();
    const category = document.getElementById("edit-club-category").value;
    const description = document.getElementById("edit-club-desc").value.trim();
    const imageUrl = document.getElementById("edit-club-image").value.trim();
    const recruitmentOpen = document.getElementById("edit-club-recruitment").checked;

    try {
      let finalImageUrl = imageUrl;
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file) {
        showToast("Uploading club cover image...", "info");
        const upRes = await API.uploadImage(file);
        finalImageUrl = upRes.url;
      }

      await API.updateClub(selectedClubId, {
        name,
        category,
        description,
        image_url: finalImageUrl || null,
        recruitment_open: recruitmentOpen
      });

      showToast(`Club '${name}' updated successfully!`, "success");
      modal.style.display = "none";
      await loadAdminDashboard();
    } catch (err) {
      showToast(err.message || "Failed to update club.", "error");
    }
  });
}

window.openEditClubModal = function(clubId) {
  const targetId = clubId || (selectedClubId !== "all" ? selectedClubId : (adminClubs[0] ? adminClubs[0].id : null));
  if (!targetId) {
    showToast("No society available to edit.", "warning");
    return;
  }

  const current = adminClubs.find(c => c.id === targetId);
  if (!current) {
    showToast("Selected society not found.", "error");
    return;
  }

  selectedClubId = targetId;
  const clubSelect = document.getElementById("admin-club-select");
  if (clubSelect) clubSelect.value = targetId;

  const modal = document.getElementById("edit-club-modal");
  const fileInput = document.getElementById("edit-club-file");
  const preview = document.getElementById("edit-club-preview");

  const nameInput = document.getElementById("edit-club-name");
  const catInput = document.getElementById("edit-club-category");
  const descInput = document.getElementById("edit-club-desc");
  const imgInput = document.getElementById("edit-club-image");
  const recruitInput = document.getElementById("edit-club-recruitment");

  if (nameInput) nameInput.value = current.name || "";
  if (catInput) catInput.value = current.category || "Technical";
  if (descInput) descInput.value = current.description || "";
  if (imgInput) imgInput.value = current.image_url || "";
  if (recruitInput) recruitInput.checked = Boolean(current.recruitment_open);

  if (preview) {
    if (current.image_url) {
      preview.innerHTML = `<img src="${escapeHTML(current.image_url)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      preview.innerHTML = "Preview";
    }
  }
  if (fileInput) fileInput.value = "";

  if (modal) modal.style.display = "flex";
};

// ---------------- DELETE CLUB FUNCTIONALITY ----------------
function initDeleteClub() {
  const deleteBtn = document.getElementById("delete-club-btn");
  if (!deleteBtn) return;

  deleteBtn.addEventListener("click", async () => {
    if (!selectedClubId || selectedClubId === "all") {
      if (adminClubs.length === 1) {
        return handleDeleteClubById(adminClubs[0].id, adminClubs[0].name);
      }
      const socTab = document.querySelector(".admin-tab-btn[data-tab='societies']");
      if (socTab) socTab.click();
      showToast("Please select a specific society from the dropdown or list to delete.", "warning");
      return;
    }

    const current = adminClubs.find(c => c.id === selectedClubId);
    const clubName = current ? current.name : "this society";
    handleDeleteClubById(selectedClubId, clubName);
  });
}

window.handleDeleteClubById = async function(clubId, clubName) {
  if (!confirm(`Are you sure you want to permanently delete "${clubName}"?\n\nWarning: This will delete all member rosters, pending requests, and scheduled events for this society. This action cannot be undone.`)) {
    return;
  }

  try {
    showToast(`Deleting society "${clubName}"...`, "info");
    await API.deleteClub(clubId);
    showToast(`Society "${clubName}" has been successfully deleted.`, "success");
    selectedClubId = "all";
    await loadAdminDashboard();
  } catch (err) {
    showToast(err.message || "Failed to delete society.", "error");
  }
};

// ---------------- TAB 4: MANAGED SOCIETIES GRID ----------------
async function renderAdminSocieties() {
  const container = document.getElementById("admin-societies-grid");
  const badge = document.getElementById("admin-tab-badge-societies");
  if (!container) return;

  if (badge) badge.textContent = adminClubs.length;

  if (!adminClubs || adminClubs.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card);">
        <p style="color: var(--text-secondary); margin-bottom: 12px;">You are not coordinating any societies yet.</p>
        <button class="btn btn-cta btn-sm" onclick="document.getElementById('open-add-club-btn').click()">+ Create Club</button>
      </div>
    `;
    return;
  }

  container.innerHTML = adminClubs.map(c => {
    const banner = c.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80";
    const statusBadge = c.recruitment_open
      ? `<span class="badge badge-status-open"><span class="badge-dot"></span> Recruiting</span>`
      : `<span class="badge badge-status-closed">Recruitment Paused</span>`;

    return `
      <div class="admin-club-card" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); overflow: hidden; display: flex; flex-direction: column;">
        <div style="position: relative; height: 140px; overflow: hidden; background: var(--bg-surface);">
          <img src="${escapeHTML(banner)}" alt="${escapeHTML(c.name)}" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; top: 10px; left: 10px;">
            ${statusBadge}
          </div>
          <span class="badge" style="position: absolute; top: 10px; right: 10px; font-size: 11px; background: rgba(0,0,0,0.6); color: #fff; border: none;">
            ${escapeHTML(c.category)}
          </span>
        </div>
        <div style="padding: 18px; display: flex; flex-direction: column; flex-grow: 1;">
          <h3 style="font-size: 17px; font-weight: 700; margin: 0 0 6px; color: var(--text-main);">${escapeHTML(c.name)}</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHTML(c.description)}
          </p>
          <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px; margin-top: auto;">
            <a href="club-details.html?id=${c.id}" class="btn btn-outline btn-sm">Public Page &rarr;</a>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="openEditClubModal(${c.id})">✏️ Edit</button>
              <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="handleDeleteClubById(${c.id}, '${escapeHTML(c.name)}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ---------------- EDIT ADMIN PROFILE MODAL ----------------
let adminAvatarFile = null;
let adminAvatarRemoved = false;

function initAdminEditProfileModal() {
  const openBtn = document.getElementById("admin-open-edit-profile-btn");
  const modal = document.getElementById("admin-edit-profile-modal");
  const closeBtn = document.getElementById("close-admin-profile-btn");
  const form = document.getElementById("admin-edit-profile-form");
  const fileInput = document.getElementById("admin-avatar-file");
  const preview = document.getElementById("admin-avatar-preview");
  const removeBtn = document.getElementById("admin-remove-avatar-btn");

  if (!modal || !form) return;

  const updatePreview = (user, imgUrl = null) => {
    if (!preview) return;
    const name = user ? (user.full_name || user.name || "Admin") : "Admin";
    const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "AD";
    if (imgUrl) {
      preview.innerHTML = `<img src="${escapeHTML(imgUrl)}" alt="Avatar Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      preview.innerHTML = escapeHTML(initials);
    }
  };

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      const user = API.getCurrentUser();
      if (!user) return;

      adminAvatarFile = null;
      adminAvatarRemoved = false;

      const nameInp = document.getElementById("admin-profile-name");
      const emailInp = document.getElementById("admin-profile-email");
      const deptInp = document.getElementById("admin-profile-dept");

      if (nameInp) nameInp.value = user.full_name || user.name || "";
      if (emailInp) emailInp.value = user.email || "";
      if (deptInp) deptInp.value = user.department || "";
      if (fileInput) fileInput.value = "";

      updatePreview(user, user.avatar_url);
      modal.style.display = "flex";
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => { modal.style.display = "none"; });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast("Profile image must be under 5MB.", "error");
        fileInput.value = "";
        return;
      }
      adminAvatarFile = file;
      adminAvatarRemoved = false;
      updatePreview(null, URL.createObjectURL(file));
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      adminAvatarFile = null;
      adminAvatarRemoved = true;
      if (fileInput) fileInput.value = "";
      const user = API.getCurrentUser();
      updatePreview(user, null);
      showToast("Profile picture removed (will revert to initials on save).", "info");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = API.getCurrentUser();
    if (!user) return;

    const name = document.getElementById("admin-profile-name").value.trim();
    const email = document.getElementById("admin-profile-email").value.trim();
    const dept = document.getElementById("admin-profile-dept").value.trim();
    const submitBtn = document.getElementById("admin-save-profile-btn");

    if (!name || !email) {
      showToast("Name and email are required.", "error");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";
      }

      let newAvatarUrl = undefined;
      if (adminAvatarFile) {
        showToast("Uploading avatar...", "info");
        const uploadRes = await API.uploadImage(adminAvatarFile);
        newAvatarUrl = uploadRes.url;
      } else if (adminAvatarRemoved) {
        newAvatarUrl = "";
      }

      const payload = {
        full_name: name,
        email: email,
        department: dept
      };
      if (newAvatarUrl !== undefined) {
        payload.avatar_url = newAvatarUrl;
      }

      await API.updateProfile(payload);
      showToast("Admin profile updated successfully!", "success");
      modal.style.display = "none";
      renderNavAuth();
    } catch (err) {
      showToast(err.message || "Failed to update admin profile.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Profile Changes";
      }
    }
  });
}

// ---------------- MODAL: CREATE EVENT / WORKSHOP ----------------
function initCreateEventModal() {
  const openBtn = document.getElementById("open-create-event-btn");
  const modal = document.getElementById("create-event-modal");
  const closeBtn = document.getElementById("close-create-event-btn");
  const form = document.getElementById("create-event-form");
  const bannerFile = document.getElementById("event-banner-file");
  const bannerPreview = document.getElementById("event-banner-preview");

  if (!modal || !form) return;

  if (bannerFile && bannerPreview) {
    bannerFile.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("Banner image must be under 5MB.", "error");
          bannerFile.value = "";
          return;
        }
        bannerPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
    });
  }

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      if (!selectedClubId || selectedClubId === "all") {
        showToast("Please select a specific club from the dropdown first to schedule an event.", "warning");
        return;
      }
      if (bannerPreview) bannerPreview.innerHTML = "Preview";
      if (bannerFile) bannerFile.value = "";
      modal.style.display = "flex";
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedClubId || selectedClubId === "all") return;

    const title = document.getElementById("event-title-input").value.trim();
    const category = document.getElementById("event-category-input").value;
    const dateVal = document.getElementById("event-date-input").value;
    const location = document.getElementById("event-location-input").value.trim();
    const description = document.getElementById("event-desc-input").value.trim();
    const bannerUrlInp = document.getElementById("event-banner-url") ? document.getElementById("event-banner-url").value.trim() : null;

    try {
      let finalBannerUrl = bannerUrlInp;
      const file = bannerFile && bannerFile.files && bannerFile.files[0];
      if (file) {
        showToast("Uploading event banner...", "info");
        const upRes = await API.uploadImage(file);
        finalBannerUrl = upRes.url;
      }
      if (!finalBannerUrl) {
        finalBannerUrl = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80";
      }

      await API.createEvent({
        club_id: selectedClubId,
        title,
        category,
        event_date: new Date(dateVal).toISOString(),
        location,
        description,
        banner_url: finalBannerUrl
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

// ---------------- MODAL: EDIT EVENT / WORKSHOP ----------------
function initEditEventModal() {
  const modal = document.getElementById("edit-event-modal");
  const closeBtn = document.getElementById("close-edit-event-btn");
  const form = document.getElementById("edit-event-form");
  const bannerFile = document.getElementById("edit-event-banner-file");
  const bannerPreview = document.getElementById("edit-event-banner-preview");

  if (!modal || !form) return;

  if (bannerFile && bannerPreview) {
    bannerFile.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("Banner image must be under 5MB.", "error");
          bannerFile.value = "";
          return;
        }
        bannerPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eventId = Number(document.getElementById("edit-event-id").value);
    if (!eventId) return;

    const title = document.getElementById("edit-event-title").value.trim();
    const category = document.getElementById("edit-event-category").value;
    const dateVal = document.getElementById("edit-event-date").value;
    const location = document.getElementById("edit-event-location").value.trim();
    const description = document.getElementById("edit-event-desc").value.trim();
    const bannerUrlInp = document.getElementById("edit-event-banner-url") ? document.getElementById("edit-event-banner-url").value.trim() : null;

    try {
      let finalBannerUrl = bannerUrlInp;
      const file = bannerFile && bannerFile.files && bannerFile.files[0];
      if (file) {
        showToast("Uploading event banner...", "info");
        const upRes = await API.uploadImage(file);
        finalBannerUrl = upRes.url;
      }

      const payload = {
        title,
        category,
        event_date: new Date(dateVal).toISOString(),
        location,
        description
      };
      if (finalBannerUrl !== undefined && finalBannerUrl !== null && finalBannerUrl !== "") {
        payload.banner_url = finalBannerUrl;
      }

      await API.updateEvent(eventId, payload);

      showToast(`Event '${title}' updated successfully!`, "success");
      modal.style.display = "none";
      await renderClubEvents(selectedClubId);
    } catch (err) {
      showToast(err.message || "Failed to update event.", "error");
    }
  });
}

function openEditEventModal(eventId) {
  const ev = currentClubEvents.find(e => e.id === eventId);
  if (!ev) return;

  const modal = document.getElementById("edit-event-modal");
  if (!modal) return;

  document.getElementById("edit-event-id").value = ev.id;
  document.getElementById("edit-event-title").value = ev.title || "";
  document.getElementById("edit-event-category").value = ev.category || "Workshop";

  if (ev.event_date) {
    const d = new Date(ev.event_date);
    const pad = n => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    document.getElementById("edit-event-date").value = localIso;
  }

  document.getElementById("edit-event-location").value = ev.location || "";
  document.getElementById("edit-event-desc").value = ev.description || "";

  const bannerUrlInp = document.getElementById("edit-event-banner-url");
  if (bannerUrlInp) bannerUrlInp.value = ev.banner_url || "";

  const bannerPreview = document.getElementById("edit-event-banner-preview");
  if (bannerPreview) {
    if (ev.banner_url) {
      bannerPreview.innerHTML = `<img src="${escapeHTML(ev.banner_url)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      bannerPreview.innerHTML = "Preview";
    }
  }

  const bannerFile = document.getElementById("edit-event-banner-file");
  if (bannerFile) bannerFile.value = "";

  modal.style.display = "flex";
}

// ---------------- MODAL: ISSUE BADGE ----------------
let badgeRecipientId = null;

function initIssueBadgeModal() {
  const modal = document.getElementById("issue-badge-modal");
  const closeBtn = document.getElementById("close-issue-badge-btn");
  const form = document.getElementById("issue-badge-form");

  if (!modal || !form) return;

  if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

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
