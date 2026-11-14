// js/dashboard.js - Logic for Student Dashboard & Application Tracker

document.addEventListener("DOMContentLoaded", () => {
  initDashboardTabs();
  refreshDashboard();
});

function initDashboardTabs() {
  const tabs = document.querySelectorAll(".dashboard-tab-btn");
  const tabPanes = document.querySelectorAll(".dashboard-tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");

      tabs.forEach(t => t.classList.remove("active"));
      tabPanes.forEach(p => p.style.display = "none");

      tab.classList.add("active");
      const activePane = document.getElementById(`pane-${targetTab}`);
      if (activePane) activePane.style.display = "block";
    });
  });

  // Handle URL param ?tab=saved
  const params = new URLSearchParams(window.location.search);
  if (params.get("tab") === "saved") {
    const savedTabBtn = document.querySelector('[data-tab="saved"]');
    if (savedTabBtn) savedTabBtn.click();
  }
}

function refreshDashboard() {
  updateUserProfileHeader();
  renderApplicationsList();
  renderSavedClubs();
  updateSummaryMetrics();
  updateNavBadges();
}

function updateUserProfileHeader() {
  if (typeof Storage === "undefined") return;
  const user = Storage.getCurrentUser();
  if (!user) return;

  const nameEl = document.getElementById("dash-user-name");
  const avatarEl = document.getElementById("dash-user-avatar");
  const rollEl = document.getElementById("dash-user-roll");
  const deptEl = document.getElementById("dash-user-dept");
  const emailEl = document.getElementById("dash-user-email");

  if (nameEl) nameEl.textContent = user.name;
  if (avatarEl) {
    const initials = user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
  if (rollEl) rollEl.textContent = `Roll No: ${user.roll || 'N/A'}`;
  if (deptEl) deptEl.textContent = `${user.branch || ''} (${user.year || ''})`;
  if (emailEl) emailEl.textContent = user.email || '';
}

// ---------------- RENDER APPLICATIONS ----------------
function renderApplicationsList() {
  const container = document.getElementById("applications-container");
  if (!container || typeof Storage === "undefined") return;

  const applications = Storage.getApplications();

  // Update tab badge count
  const badgeEl = document.getElementById("tab-count-apps");
  if (badgeEl) badgeEl.textContent = applications.length;

  if (applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h3 class="empty-state-title">No Club Applications Yet</h3>
        <p class="empty-state-desc">
          You haven't applied to any college clubs yet. Explore open recruitment drives and submit your first application!
        </p>
        <a href="clubs.html?filter=open" class="btn btn-primary">Browse Recruiting Clubs</a>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => {
    // Lookup club logo and details if available
    const club = typeof CLUBS_DATA !== "undefined" ? CLUBS_DATA.find(c => c.id === app.clubId) : null;
    const logoUrl = club ? club.logo : "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80";

    return `
      <article class="application-card" id="app-card-${app.id}">
        <div class="app-card-header">
          <div class="app-club-info">
            <img src="${logoUrl}" alt="${escapeHTML(app.clubName)} logo" class="app-club-logo" loading="lazy">
            <div>
              <h3 class="app-club-title">
                <a href="club-details.html?id=${app.clubId}">${escapeHTML(app.clubName)}</a>
              </h3>
              <div style="font-size: 0.825rem; color: var(--text-muted);">
                ${getCategoryBadge(app.category || (club ? club.category : 'General'))}
              </div>
            </div>
          </div>
          <div>
            ${getApplicationStatusBadge(app.status)}
          </div>
        </div>

        <div class="app-details-grid">
          <div class="app-detail-item">
            <span class="app-detail-label">Preferred Wing</span>
            <span class="app-detail-val">${escapeHTML(app.domain || 'General Member')}</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Student Roll</span>
            <span class="app-detail-val">${escapeHTML(app.studentRoll || 'N/A')}</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Department & Year</span>
            <span class="app-detail-val">${escapeHTML(app.branch || '')} (${escapeHTML(app.year || '')})</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Applied Date</span>
            <span class="app-detail-val">${formatDate(app.appliedDate)}</span>
          </div>
        </div>

        ${app.interviewNotes ? `
          <div class="app-notes-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Club Coordinator Update:</strong> ${escapeHTML(app.interviewNotes)}
            </div>
          </div>
        ` : ''}

        <div class="app-card-footer">
          <div>
            Application ID: <code style="font-family: monospace; font-size: 0.8rem; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;">#${escapeHTML(app.id)}</code>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="club-details.html?id=${app.clubId}" class="btn btn-outline btn-sm">Club Page</a>
            <button 
              type="button" 
              class="btn btn-danger btn-sm" 
              onclick="confirmWithdrawApplication('${app.id}', '${escapeHTML(app.clubName)}')"
            >
              Withdraw
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ---------------- RENDER SAVED CLUBS ----------------
function renderSavedClubs() {
  const container = document.getElementById("saved-clubs-grid");
  if (!container || typeof Storage === "undefined" || typeof CLUBS_DATA === "undefined") return;

  const savedIds = Storage.getBookmarks();
  const badgeEl = document.getElementById("tab-count-saved");
  if (badgeEl) badgeEl.textContent = savedIds.length;

  const savedClubs = CLUBS_DATA.filter(club => savedIds.includes(club.id));

  if (savedClubs.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3 class="empty-state-title">No Bookmarked Clubs</h3>
        <p class="empty-state-desc">
          You haven't bookmarked any clubs yet. Click the bookmark icon on any club card to save it for quick access.
        </p>
        <a href="clubs.html" class="btn btn-primary">Explore Directory</a>
      </div>
    `;
    return;
  }

  container.innerHTML = savedClubs.map(club => {
    return `
      <article class="club-card">
        <div class="club-card-banner">
          <img src="${club.banner}" alt="${escapeHTML(club.name)} banner" loading="lazy">
          <div class="club-card-status-badge">
            ${getStatusBadge(club.status)}
          </div>
          <button 
            class="club-card-bookmark-btn saved" 
            data-club-id="${club.id}" 
            title="Remove from saved"
            onclick="removeBookmark('${club.id}')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#e11d48" stroke="currentColor" stroke-width="2.2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
        
        <div class="club-card-body">
          <img src="${club.logo}" alt="${escapeHTML(club.name)} logo" class="club-card-avatar" loading="lazy">
          <div class="club-card-header">
            <h3 class="club-card-title">
              <a href="club-details.html?id=${club.id}">${escapeHTML(club.name)}</a>
            </h3>
            <div class="club-card-meta">
              ${getCategoryBadge(club.category)}
            </div>
          </div>
          
          <p class="club-card-desc">${escapeHTML(club.tagline)}</p>
          
          <div class="club-card-footer">
            <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm">View Details</a>
            ${club.status === "OPEN" 
              ? `<a href="club-details.html?id=${club.id}&apply=true" class="btn btn-primary btn-sm">Apply</a>` 
              : `<span class="badge badge-status-closed">Closed</span>`
            }
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ---------------- ACTIONS ----------------
function confirmWithdrawApplication(appId, clubName) {
  const confirmed = window.confirm(`Are you sure you want to withdraw your application for ${clubName}? This action cannot be undone.`);
  if (confirmed && typeof Storage !== "undefined") {
    Storage.withdrawApplication(appId);
    refreshDashboard();
    showToast(`Application for ${clubName} was withdrawn`, "info");
  }
}

function removeBookmark(clubId) {
  if (typeof Storage !== "undefined") {
    Storage.toggleBookmark(clubId);
    refreshDashboard();
    showToast("Club removed from bookmarks", "info");
  }
}

// ---------------- UPDATE METRICS ----------------
function updateSummaryMetrics() {
  if (typeof Storage === "undefined") return;

  const applications = Storage.getApplications();
  const savedIds = Storage.getBookmarks();

  const totalAppsEl = document.getElementById("metric-total-apps");
  const activeAppsEl = document.getElementById("metric-active-apps");
  const savedClubsEl = document.getElementById("metric-saved-clubs");

  if (totalAppsEl) totalAppsEl.textContent = applications.length;

  if (activeAppsEl) {
    const shortlistedCount = applications.filter(a => a.status === "SHORTLISTED" || a.status === "PENDING").length;
    activeAppsEl.textContent = shortlistedCount;
  }

  if (savedClubsEl) savedClubsEl.textContent = savedIds.length;
}
