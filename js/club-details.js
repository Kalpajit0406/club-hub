// js/club-details.js - Logic for Individual Club Overview & Application Modal

let currentClub = null;

document.addEventListener("DOMContentLoaded", () => {
  loadClubData();
  initApplicationModal();
});

// Load and populate club details from CLUBS_DATA
function loadClubData() {
  const params = new URLSearchParams(window.location.search);
  const clubId = params.get("id");

  if (!clubId || typeof CLUBS_DATA === "undefined") {
    showClubNotFound();
    return;
  }

  currentClub = CLUBS_DATA.find(c => c.id === clubId);

  if (!currentClub) {
    showClubNotFound();
    return;
  }

  // Update document title
  document.title = `${currentClub.name} (${currentClub.acronym || currentClub.category}) | CampusConnect`;

  // Render hero banner & identity
  document.getElementById("club-banner-img").src = currentClub.banner;
  document.getElementById("club-banner-img").alt = `${currentClub.name} Banner`;
  document.getElementById("club-logo-img").src = currentClub.logo;
  document.getElementById("club-logo-img").alt = `${currentClub.name} Logo`;

  document.getElementById("club-name-title").textContent = currentClub.name;
  if (currentClub.acronym) {
    document.getElementById("club-acronym-badge").textContent = `(${currentClub.acronym})`;
  } else {
    document.getElementById("club-acronym-badge").style.display = "none";
  }

  document.getElementById("club-tagline").textContent = currentClub.tagline;
  document.getElementById("club-category-box").innerHTML = getCategoryBadge(currentClub.category);
  document.getElementById("club-status-box").innerHTML = getStatusBadge(currentClub.status);
  document.getElementById("club-members-count").textContent = `${currentClub.memberCount} members`;
  document.getElementById("club-established-year").textContent = `Est. ${currentClub.established}`;
  document.getElementById("club-meeting-info").textContent = currentClub.meetingInfo || "Contact coordinators for schedule";

  // Social Links
  renderSocialLinks(currentClub.socials);

  // Render main description
  document.getElementById("club-description").textContent = currentClub.description;

  // Render achievements
  const achievementsContainer = document.getElementById("club-achievements-list");
  if (achievementsContainer) {
    achievementsContainer.innerHTML = (currentClub.achievements || []).map(ach => `
      <li class="achievement-item">
        <svg class="achievement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>${escapeHTML(ach)}</span>
      </li>
    `).join("");
  }

  // Render open domains
  const domainsContainer = document.getElementById("club-domains-list");
  if (domainsContainer) {
    domainsContainer.innerHTML = (currentClub.domains || []).map(d => `
      <div class="domain-pill-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 14 14"/>
        </svg>
        <span>${escapeHTML(d)}</span>
      </div>
    `).join("");
  }

  // Render coordinators
  const coordsContainer = document.getElementById("club-coordinators-list");
  if (coordsContainer) {
    coordsContainer.innerHTML = (currentClub.coordinators || []).map(c => `
      <div class="coordinator-card">
        <div class="coord-name">${escapeHTML(c.name)}</div>
        <div class="coord-role">${escapeHTML(c.role)}</div>
        <div class="coord-contact">
          <a href="mailto:${escapeHTML(c.email)}" class="btn-link" style="color: var(--primary);">
            ${escapeHTML(c.email)}
          </a>
        </div>
      </div>
    `).join("");
  }

  // Render upcoming events for this club
  const eventsContainer = document.getElementById("club-events-list");
  if (eventsContainer && typeof CAMPUS_EVENTS !== "undefined") {
    const clubEvents = CAMPUS_EVENTS.filter(e => e.clubId === currentClub.id);
    if (clubEvents.length > 0) {
      eventsContainer.innerHTML = clubEvents.map(evt => {
        const d = new Date(evt.date);
        const month = d.toLocaleString('en-US', { month: 'short' });
        const day = d.getDate();
        return `
          <div class="club-event-card">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="club-event-date-box">
                <div class="club-event-month">${month}</div>
                <div class="club-event-day">${day}</div>
              </div>
              <div class="club-event-info">
                <h4>${escapeHTML(evt.title)}</h4>
                <div class="club-event-meta">
                  <span>📍 ${escapeHTML(evt.venue)}</span>
                  <span>•</span>
                  <span>${escapeHTML(evt.type)}</span>
                </div>
              </div>
            </div>
            <span class="badge badge-status-open">Upcoming</span>
          </div>
        `;
      }).join("");
    } else {
      eventsContainer.innerHTML = `<p style="font-size: 0.875rem; color: var(--text-secondary);">No upcoming events scheduled at this moment. Stay tuned for new workshop announcements.</p>`;
    }
  }

  // Render action buttons state (Join vs Applied vs Closed)
  updateActionButtons();

  // Populate domains in modal dropdown
  const modalDomainSelect = document.getElementById("modal-domain-select");
  if (modalDomainSelect && currentClub.domains) {
    modalDomainSelect.innerHTML = currentClub.domains.map(d => `
      <option value="${escapeHTML(d)}">${escapeHTML(d)}</option>
    `).join("");
  }

  // Check if auto-apply trigger was passed in URL (?apply=true)
  if (params.get("apply") === "true" && currentClub.status === "OPEN") {
    if (typeof Storage !== "undefined" && Storage.hasApplied(currentClub.id)) {
      showToast("You have already submitted an application to this club!", "info");
    } else {
      openApplyModal();
    }
  }
}

function renderSocialLinks(socials) {
  const container = document.getElementById("club-socials-box");
  if (!container || !socials) return;

  let html = "";
  if (socials.github) {
    html += `<a href="${socials.github}" target="_blank" rel="noopener noreferrer" class="club-social-link" title="GitHub">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
    </a>`;
  }
  if (socials.linkedin) {
    html += `<a href="${socials.linkedin}" target="_blank" rel="noopener noreferrer" class="club-social-link" title="LinkedIn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
    </a>`;
  }
  if (socials.instagram) {
    html += `<a href="${socials.instagram}" target="_blank" rel="noopener noreferrer" class="club-social-link" title="Instagram">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
    </a>`;
  }
  container.innerHTML = html;
}

function updateActionButtons() {
  if (!currentClub) return;

  const joinBtn = document.getElementById("club-main-join-btn");
  const sidebarJoinBtn = document.getElementById("sidebar-join-btn");
  const bookmarkBtn = document.getElementById("club-bookmark-btn");

  const hasApplied = typeof Storage !== "undefined" && Storage.hasApplied(currentClub.id);
  const isBookmarked = typeof Storage !== "undefined" && Storage.isBookmarked(currentClub.id);

  // Bookmark Button
  if (bookmarkBtn) {
    bookmarkBtn.classList.toggle("saved", isBookmarked);
    bookmarkBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="${isBookmarked ? '#e11d48' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      <span>${isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Club'}</span>
    `;

    bookmarkBtn.onclick = () => {
      const isNowSaved = Storage.toggleBookmark(currentClub.id);
      bookmarkBtn.classList.toggle("saved", isNowSaved);
      bookmarkBtn.querySelector("svg").setAttribute("fill", isNowSaved ? "#e11d48" : "none");
      bookmarkBtn.querySelector("span").textContent = isNowSaved ? "Saved to Bookmarks" : "Bookmark Club";
      showToast(isNowSaved ? "Club saved to your bookmarks!" : "Club removed from bookmarks", "info");
    };
  }

  // Join Action Button Configuration
  const configureButton = (btn) => {
    if (!btn) return;

    if (hasApplied) {
      btn.className = "btn btn-outline";
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Application Submitted
      `;
      btn.onclick = () => {
        window.location.href = "dashboard.html";
      };
    } else if (currentClub.status === "OPEN") {
      btn.className = "btn btn-primary";
      btn.innerHTML = `Join Club / Apply Now`;
      btn.onclick = openApplyModal;
    } else {
      btn.className = "btn btn-secondary";
      btn.disabled = true;
      btn.textContent = "Recruitment Closed";
    }
  };

  configureButton(joinBtn);
  configureButton(sidebarJoinBtn);
}

// ---------------- NATIVE <dialog> MODAL LOGIC ----------------
function initApplicationModal() {
  const modal = document.getElementById("applyModal");
  const form = document.getElementById("club-application-form");
  const closeBtn = document.getElementById("modal-close-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");

  if (!modal || !form) return;

  if (closeBtn) closeBtn.onclick = () => modal.close();
  if (cancelBtn) cancelBtn.onclick = () => modal.close();

  // Close modal when clicking outside dialog on the backdrop
  modal.addEventListener("click", (e) => {
    const dialogDimensions = modal.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      modal.close();
    }
  });

  // Handle Form Submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const applicationData = {
      clubId: currentClub.id,
      clubName: currentClub.name,
      clubAcronym: currentClub.acronym || "",
      category: currentClub.category,
      studentName: document.getElementById("app-student-name").value.trim(),
      studentRoll: document.getElementById("app-student-roll").value.trim().toUpperCase(),
      branch: document.getElementById("app-student-branch").value.trim(),
      year: document.getElementById("app-student-year").value,
      email: document.getElementById("app-student-email").value.trim().toLowerCase(),
      domain: document.getElementById("modal-domain-select").value,
      statement: document.getElementById("app-student-sop").value.trim(),
      portfolioUrl: document.getElementById("app-student-portfolio").value.trim(),
      status: "PENDING",
      appliedDate: new Date().toISOString(),
      interviewNotes: "Application submitted. Under initial review."
    };

    if (typeof Storage !== "undefined") {
      Storage.saveApplication(applicationData);
    }

    modal.close();
    form.reset();

    // Update buttons on the page to reflect submission
    updateActionButtons();
    updateNavBadges();

    showToast("Application submitted successfully! Track it on your Dashboard.", "success");
  });
}

function openApplyModal() {
  const modal = document.getElementById("applyModal");
  if (!modal || !currentClub) return;

  document.getElementById("modal-club-name").textContent = currentClub.name;
  modal.showModal();
}

function showClubNotFound() {
  const container = document.getElementById("club-details-container");
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="margin: 4rem auto; max-width: 600px;">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 class="empty-state-title">Club Not Found</h2>
        <p class="empty-state-desc">The requested club does not exist or may have been unlisted. Browse all registered clubs in our directory.</p>
        <a href="clubs.html" class="btn btn-primary">Return to Clubs Directory</a>
      </div>
    `;
  }
}
