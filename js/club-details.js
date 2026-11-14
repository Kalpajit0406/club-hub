// js/club-details.js - Logic for Individual Club Overview & Recruitment Modal

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
  document.title = `${currentClub.name} (${currentClub.acronym || currentClub.category}) | ClubHub`;

  // Render hero banner & identity
  const heroCover = document.getElementById("hero-cover-bg");
  if (heroCover && currentClub.banner) {
    heroCover.style.backgroundImage = `url('${currentClub.banner}')`;
  }

  const logoImg = document.getElementById("club-logo") || document.getElementById("club-logo-img");
  if (logoImg) {
    logoImg.src = currentClub.logo;
    logoImg.alt = `${currentClub.name} Logo`;
  }

  const nameTitle = document.getElementById("club-name") || document.getElementById("club-name-title");
  if (nameTitle) nameTitle.textContent = currentClub.name;

  const taglineEl = document.getElementById("club-tagline") || document.getElementById("club-tagline-text");
  if (taglineEl) taglineEl.textContent = currentClub.tagline;

  const categoryBox = document.getElementById("club-category-badge");
  if (categoryBox) {
    categoryBox.textContent = currentClub.category;
    categoryBox.className = `badge badge-${currentClub.category.toLowerCase()}`;
  }

  const statusBox = document.getElementById("club-status-badge");
  if (statusBox) {
    const isOpen = currentClub.status === "OPEN";
    statusBox.className = isOpen ? "badge badge-status-open" : "badge badge-status-closed";
    statusBox.innerHTML = isOpen 
      ? `<span class="badge-dot"></span> Recruiting Now`
      : `<span class="badge-dot"></span> Recruitment Closed`;
  }

  const estBadge = document.getElementById("club-established-badge");
  if (estBadge && currentClub.established) {
    estBadge.textContent = `Est. ${currentClub.established}`;
  }

  const membersCount = document.getElementById("club-member-count");
  if (membersCount) membersCount.innerHTML = `<strong>${currentClub.memberCount}</strong> Active Members`;

  const meetingInfo = document.getElementById("club-meeting-info");
  if (meetingInfo) meetingInfo.textContent = currentClub.meetingInfo || "Assembly: Wednesdays at 5:00 PM • Tech Block 302";

  // Social Links
  renderSocialLinks(currentClub.socials);

  // Render main description
  const descEl = document.getElementById("club-description") || document.getElementById("club-full-description");
  if (descEl) descEl.textContent = currentClub.description;

  // Render open domains
  const domainsContainer = document.getElementById("club-domains-list");
  if (domainsContainer) {
    domainsContainer.innerHTML = (currentClub.domains || []).map(d => `
      <div class="domain-chip-card" onclick="selectDomainAndOpenModal('${escapeHTML(d)}')">
        <div class="domain-chip-title">${escapeHTML(d)}</div>
        <div class="domain-chip-subtitle">Recruiting for Core Team &rarr;</div>
      </div>
    `).join("");
  }

  // Render achievements
  const achievementsContainer = document.getElementById("club-achievements-list");
  if (achievementsContainer) {
    const list = currentClub.achievements || [
      "Secured 1st Place at National Smart India Hackathon.",
      "Conducted 12+ hands-on industry workshops reaching 800+ attendees.",
      "Organized annual campus technical festival with international participation."
    ];
    achievementsContainer.innerHTML = list.map(ach => `
      <li class="achievement-item">
        <svg class="achievement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>${escapeHTML(ach)}</span>
      </li>
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
          <div class="society-event-row">
            <div class="event-row-left">
              <div class="event-date-pill">
                <strong>${day}</strong>
                <span>${month}</span>
              </div>
              <div>
                <div class="event-row-title">${escapeHTML(evt.title)}</div>
                <div class="event-row-meta">
                  <span>📍 ${escapeHTML(evt.venue || "Campus Auditorium")}</span> &bull; 
                  <span>${escapeHTML(evt.type || "Workshop")}</span>
                </div>
              </div>
            </div>
            <a href="events.html?id=${evt.id}" class="btn btn-outline btn-sm">Event Details</a>
          </div>
        `;
      }).join("");
    } else {
      eventsContainer.innerHTML = `<p class="section-subtext">No upcoming public events scheduled currently. Core team announcements will appear here soon.</p>`;
    }
  }

  // Render coordinators
  const coordsContainer = document.getElementById("club-coordinators-grid");
  if (coordsContainer) {
    const coords = currentClub.coordinators || [
      { name: "Aditya Verma", role: "President & Lead", email: "aditya.v@tint.edu.in", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
      { name: "Pooja Hegde", role: "Vice President & Operations", email: "pooja.h@tint.edu.in", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" }
    ];
    coordsContainer.innerHTML = coords.map(c => `
      <div class="coordinator-card">
        <img src="${c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}" alt="${escapeHTML(c.name)}" class="coordinator-avatar">
        <div>
          <div class="coordinator-name">${escapeHTML(c.name)}</div>
          <div class="coordinator-role">${escapeHTML(c.role)}</div>
        </div>
      </div>
    `).join("");
  }

  // Update recruitment widget & actions
  updateActionButtons();

  // Populate domains in modal dropdown
  const modalDomainSelect = document.getElementById("app-domain-select") || document.getElementById("app-target-domain");
  if (modalDomainSelect && currentClub.domains) {
    modalDomainSelect.innerHTML = currentClub.domains.map(d => `
      <option value="${escapeHTML(d)}">${escapeHTML(d)}</option>
    `).join("");
  }

  // Check if auto-apply trigger was passed in URL (?apply=true)
  if (params.get("apply") === "true" && currentClub.status === "OPEN") {
    if (typeof Storage !== "undefined" && Storage.hasApplied(currentClub.id)) {
      if (typeof UIStates !== "undefined") {
        UIStates.showToast("You have already submitted an application to this society!", "info");
      }
    } else {
      openApplyModal();
    }
  }
}

function renderSocialLinks(socials) {
  const container = document.getElementById("club-socials-container");
  if (!container || !socials) return;

  let html = "";
  if (socials.github) {
    html += `<a href="${socials.github}" target="_blank" rel="noopener noreferrer" class="social-link-icon" title="GitHub">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
    </a>`;
  }
  if (socials.linkedin) {
    html += `<a href="${socials.linkedin}" target="_blank" rel="noopener noreferrer" class="social-link-icon" title="LinkedIn">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
    </a>`;
  }
  if (socials.instagram) {
    html += `<a href="${socials.instagram}" target="_blank" rel="noopener noreferrer" class="social-link-icon" title="Instagram">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
    </a>`;
  }
  container.innerHTML = html;
}

function updateActionButtons() {
  if (!currentClub) return;

  const bookmarkBtn = document.getElementById("bookmark-btn");
  const heroApplyBtn = document.getElementById("hero-apply-btn");
  const sidebarApplyBtn = document.getElementById("open-apply-modal-btn");
  const existingBanner = document.getElementById("existing-application-banner");
  const existingStatusText = document.getElementById("existing-app-status-text");

  const hasApplied = typeof Storage !== "undefined" && Storage.hasApplied(currentClub.id);
  const isBookmarked = typeof Storage !== "undefined" && Storage.isBookmarked(currentClub.id);
  const isOpen = currentClub.status === "OPEN";

  // Bookmark Button
  if (bookmarkBtn) {
    bookmarkBtn.classList.toggle("saved", isBookmarked);
    const bookmarkText = document.getElementById("bookmark-text");
    if (bookmarkText) bookmarkText.textContent = isBookmarked ? "Society Saved" : "Save Society";

    bookmarkBtn.onclick = () => {
      const isNowSaved = Storage.toggleBookmark(currentClub.id);
      bookmarkBtn.classList.toggle("saved", isNowSaved);
      if (bookmarkText) bookmarkText.textContent = isNowSaved ? "Society Saved" : "Save Society";
      if (typeof UIStates !== "undefined") {
        UIStates.showToast(isNowSaved ? "Added to your saved societies!" : "Removed from saved societies.", "info");
      }
    };
  }

  // Handle applied state
  if (hasApplied) {
    if (existingBanner) existingBanner.style.display = "flex";
    if (existingStatusText && typeof Storage !== "undefined") {
      const app = Storage.getUserApplicationForClub(currentClub.id);
      if (app) existingStatusText.textContent = `Your candidacy is currently: ${app.status}`;
    }
    if (heroApplyBtn) {
      heroApplyBtn.textContent = "Application Submitted";
      heroApplyBtn.classList.add("btn-secondary");
      heroApplyBtn.classList.remove("btn-primary");
      heroApplyBtn.removeAttribute("href");
      heroApplyBtn.style.pointerEvents = "none";
    }
    if (sidebarApplyBtn) {
      sidebarApplyBtn.textContent = "Application Under Review";
      sidebarApplyBtn.disabled = true;
      sidebarApplyBtn.classList.add("btn-secondary");
      sidebarApplyBtn.classList.remove("btn-primary");
    }
  } else if (!isOpen) {
    if (heroApplyBtn) {
      heroApplyBtn.textContent = "Recruitment Closed";
      heroApplyBtn.classList.add("btn-secondary");
      heroApplyBtn.classList.remove("btn-primary");
      heroApplyBtn.removeAttribute("href");
      heroApplyBtn.style.pointerEvents = "none";
    }
    if (sidebarApplyBtn) {
      sidebarApplyBtn.textContent = "Recruitment Closed";
      sidebarApplyBtn.disabled = true;
      sidebarApplyBtn.classList.add("btn-secondary");
      sidebarApplyBtn.classList.remove("btn-primary");
    }
  } else {
    if (heroApplyBtn) {
      heroApplyBtn.onclick = (e) => {
        e.preventDefault();
        openApplyModal();
      };
    }
    if (sidebarApplyBtn) {
      sidebarApplyBtn.onclick = () => openApplyModal();
    }
  }
}

function selectDomainAndOpenModal(domain) {
  const modalDomainSelect = document.getElementById("app-domain-select");
  if (modalDomainSelect) {
    modalDomainSelect.value = domain;
  }
  openApplyModal();
}

function openApplyModal() {
  const modal = document.getElementById("applyModal");
  if (!modal) return;

  const modalTitle = document.getElementById("modal-club-name");
  if (modalTitle && currentClub) {
    modalTitle.textContent = `Apply to ${currentClub.name}`;
  }

  // Pre-fill user data if logged in
  if (typeof Storage !== "undefined") {
    const user = Storage.getCurrentUser();
    if (user) {
      const nameInput = document.getElementById("app-student-name");
      const rollInput = document.getElementById("app-roll-number");
      const deptSelect = document.getElementById("app-department-select");
      if (nameInput && user.name) nameInput.value = user.name;
      if (rollInput && user.rollNumber) rollInput.value = user.rollNumber;
      if (deptSelect && user.department) deptSelect.value = user.department;
    }
  }

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.style.display = "block";
  }
}

function closeApplyModal() {
  const modal = document.getElementById("applyModal");
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.style.display = "none";
  }
}

function initApplicationModal() {
  const closeBtn = document.getElementById("close-apply-modal-btn");
  const cancelBtn = document.getElementById("cancel-apply-modal-btn");
  const form = document.getElementById("apply-form");

  if (closeBtn) closeBtn.onclick = closeApplyModal;
  if (cancelBtn) cancelBtn.onclick = closeApplyModal;

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!currentClub) return;

      const studentName = document.getElementById("app-student-name").value.trim();
      const rollNumber = document.getElementById("app-roll-number").value.trim();
      const department = document.getElementById("app-department-select").value;
      const year = document.getElementById("app-year-select").value;
      const domain = document.getElementById("app-domain-select").value;
      const statement = document.getElementById("app-statement").value.trim();
      const portfolio = document.getElementById("app-portfolio").value.trim();

      if (!studentName || !rollNumber || !department || !domain || !statement) {
        if (typeof UIStates !== "undefined") {
          UIStates.showToast("Please fill in all required fields.", "warning");
        }
        return;
      }

      if (typeof Storage !== "undefined") {
        const appPayload = {
          clubId: currentClub.id,
          clubName: currentClub.name,
          clubLogo: currentClub.logo,
          studentName,
          rollNumber,
          department,
          year,
          domain,
          statement,
          portfolio,
          status: "Pending",
          appliedAt: new Date().toISOString()
        };

        Storage.submitApplication(appPayload);
        closeApplyModal();
        updateActionButtons();

        if (typeof UIStates !== "undefined") {
          UIStates.showToast("Application submitted successfully! Track your status on your Dashboard.", "success");
        }
      }
    };
  }
}

function showClubNotFound() {
  const main = document.querySelector(".main-content");
  if (main && typeof UIStates !== "undefined") {
    main.innerHTML = `
      <div class="container" style="padding: 60px 0;">
        ${UIStates.renderEmptyState(null, {
          title: "Society Profile Not Found",
          message: "The society you are looking for does not exist or may have been unlisted from the active directory.",
          actionText: "Back to All Societies",
          actionUrl: "clubs.html"
        })}
      </div>
    `;
  }
}
