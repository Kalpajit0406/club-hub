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

  // Handle URL param ?tab=saved or ?tab=applications
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");
  if (tabParam) {
    const targetBtn = document.querySelector(`[data-tab="${tabParam}"]`);
    if (targetBtn) targetBtn.click();
  }
}

function refreshDashboard() {
  updateUserProfileHeader();
  renderApplicationsList();
  renderMyClubsList();
  renderSavedClubs();
  renderStudentEvents();
  renderProfileDetails();
  updateSummaryMetrics();
  if (typeof updateNavBadges === "function") updateNavBadges();
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
  if (deptEl) deptEl.textContent = `${user.branch || 'B.Tech Scholar'} (${user.year || '2nd Year'})`;
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
          </svg>
        </div>
        <h3 class="empty-state-title">No Applications Submitted</h3>
        <p class="empty-state-desc">
          You haven't submitted any society applications yet. Explore active recruitment drives and begin your leadership journey.
        </p>
        <a href="clubs.html?filter=open" class="btn btn-primary">Browse Open Drives</a>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => {
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
            <span class="app-detail-value">${escapeHTML(app.domain || 'General Candidate')}</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Candidate Roll</span>
            <span class="app-detail-value">${escapeHTML(app.studentRoll || 'N/A')}</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Discipline & Year</span>
            <span class="app-detail-value">${escapeHTML(app.branch || '')} (${escapeHTML(app.year || '')})</span>
          </div>
          <div class="app-detail-item">
            <span class="app-detail-label">Submission Date</span>
            <span class="app-detail-value">${formatDate(app.appliedDate)}</span>
          </div>
        </div>

        ${app.statement ? `
          <div class="app-statement-box">
            <strong>Statement of Purpose:</strong> "${escapeHTML(app.statement)}"
          </div>
        ` : ''}

        ${app.interviewNotes ? `
          <div class="app-notes-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Society Review Update:</strong> ${escapeHTML(app.interviewNotes)}
            </div>
          </div>
        ` : ''}

        <div class="app-card-footer">
          <div>
            Application Reference: <code style="font-family: monospace; font-size: 0.8rem; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-champagne);">#${escapeHTML(app.id)}</code>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="club-details.html?id=${app.clubId}" class="btn btn-outline btn-sm">Society Profile</a>
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

// ---------------- RENDER MY CLUBS (ACCEPTED / INDUCTED) ----------------
function renderMyClubsList() {
  const container = document.getElementById("my-clubs-grid");
  if (!container || typeof Storage === "undefined" || typeof CLUBS_DATA === "undefined") return;

  const applications = Storage.getApplications();
  const acceptedApps = applications.filter(a => a.status === "ACCEPTED" || a.status === "APPROVED");

  const badgeEl = document.getElementById("tab-count-clubs");
  if (badgeEl) badgeEl.textContent = acceptedApps.length;

  if (acceptedApps.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <h3 class="empty-state-title">No Active Society Memberships Yet</h3>
        <p class="empty-state-desc">
          Once your application is approved and inducted by society heads, your official memberships and badges will appear here.
        </p>
        <a href="clubs.html" class="btn btn-primary">Discover Societies</a>
      </div>
    `;
    return;
  }

  container.innerHTML = acceptedApps.map(app => {
    const club = CLUBS_DATA.find(c => c.id === app.clubId) || {
      name: app.clubName,
      logo: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
      tagline: "Active collegiate society member"
    };

    return `
      <article class="club-card">
        <div class="club-card-banner">
          <img src="${club.banner}" alt="${escapeHTML(club.name)} banner" loading="lazy">
          <div class="club-card-status-badge">
            <span class="badge badge-status-open">Inducted Member</span>
          </div>
        </div>
        <div class="club-card-body">
          <img src="${club.logo}" alt="${escapeHTML(club.name)} logo" class="club-card-avatar" loading="lazy">
          <div class="club-card-header">
            <h3 class="club-card-title">
              <a href="club-details.html?id=${app.clubId}">${escapeHTML(club.name)}</a>
            </h3>
            <div class="club-card-meta">
              <span class="badge badge-cat">${escapeHTML(app.domain || 'Core Member')}</span>
            </div>
          </div>
          <p class="club-card-desc">${escapeHTML(club.tagline)}</p>
          <div class="club-card-footer">
            <a href="club-details.html?id=${app.clubId}" class="btn btn-primary btn-sm">Society Dashboard</a>
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
        <h3 class="empty-state-title">No Bookmarked Societies</h3>
        <p class="empty-state-desc">
          You haven't bookmarked any societies yet. Click the bookmark crest on any society card to save it for quick reference.
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
            type="button"
            class="club-card-bookmark-btn saved" 
            data-club-id="${club.id}" 
            title="Remove from saved"
            onclick="removeBookmark('${club.id}')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="2.2">
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

// ---------------- RENDER CAMPUS EVENTS ----------------
function renderStudentEvents() {
  const container = document.getElementById("events-container-grid");
  if (!container || typeof CAMPUS_EVENTS === "undefined") return;

  container.innerHTML = CAMPUS_EVENTS.map(evt => {
    const d = new Date(evt.date);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();

    return `
      <article class="event-card">
        <div class="event-card-banner">
          <img src="${evt.banner}" alt="${escapeHTML(evt.title)}" loading="lazy">
          <span class="event-type-badge">${escapeHTML(evt.type)}</span>
        </div>
        <div class="event-card-body">
          <div class="event-date-row">
            <div class="event-date-badge">
              <span class="month">${month}</span>
              <span class="day">${day}</span>
            </div>
            <div>
              <div class="event-host-name">${escapeHTML(evt.clubName)}</div>
              <div style="font-size: 0.775rem; color: var(--text-secondary);">${escapeHTML(evt.attendees)}+ Attending</div>
            </div>
          </div>
          <h3 class="event-title">${escapeHTML(evt.title)}</h3>
          <div class="event-venue-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHTML(evt.venue)}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ---------------- RENDER PROFILE DETAILS ----------------
function renderProfileDetails() {
  if (typeof Storage === "undefined") return;
  const user = Storage.getCurrentUser();
  if (!user) return;

  const nameVal = document.getElementById("profile-det-name");
  const emailVal = document.getElementById("profile-det-email");
  const rollVal = document.getElementById("profile-det-roll");
  const branchVal = document.getElementById("profile-det-branch");
  const yearVal = document.getElementById("profile-det-year");

  if (nameVal) nameVal.textContent = user.name || "Aditya Verma";
  if (emailVal) emailVal.textContent = user.email || "aditya.cs23@campus.edu";
  if (rollVal) rollVal.textContent = user.roll || "2023CSB1042";
  if (branchVal) branchVal.textContent = user.branch || "Computer Science & Engineering";
  if (yearVal) yearVal.textContent = user.year || "2nd Year";
}

// ---------------- ACTIONS ----------------
function confirmWithdrawApplication(appId, clubName) {
  const confirmed = window.confirm(`Are you sure you want to withdraw your candidacy for ${clubName}? This will forfeit your current review stage.`);
  if (confirmed && typeof Storage !== "undefined") {
    Storage.withdrawApplication(appId);
    refreshDashboard();
    showToast(`Application for ${clubName} has been withdrawn.`, "info");
  }
}

function removeBookmark(clubId) {
  if (typeof Storage !== "undefined") {
    Storage.toggleBookmark(clubId);
    refreshDashboard();
    showToast("Society removed from bookmarks.", "info");
  }
}

// ---------------- UPDATE METRICS ----------------
function updateSummaryMetrics() {
  if (typeof Storage === "undefined") return;

  const applications = Storage.getApplications();
  const savedIds = Storage.getBookmarks();
  const acceptedCount = applications.filter(a => a.status === "ACCEPTED" || a.status === "APPROVED").length;
  const activeCount = applications.filter(a => a.status === "SHORTLISTED" || a.status === "PENDING").length;

  const totalAppsEl = document.getElementById("metric-total-apps");
  const activeAppsEl = document.getElementById("metric-active-apps");
  const acceptedAppsEl = document.getElementById("metric-accepted-apps");
  const savedClubsEl = document.getElementById("metric-saved-clubs");

  if (totalAppsEl) totalAppsEl.textContent = applications.length;
  if (activeAppsEl) activeAppsEl.textContent = activeCount;
  if (acceptedAppsEl) acceptedAppsEl.textContent = acceptedCount;
  if (savedClubsEl) savedClubsEl.textContent = savedIds.length;
}
