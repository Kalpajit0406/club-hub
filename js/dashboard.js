// js/dashboard.js - Logic for Student Dashboard & Campus Life Command Center

document.addEventListener("DOMContentLoaded", () => {
  initDashboardTabs();
  refreshDashboard();
  setupPassModal();
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

  // Handle URL param ?tab=events or ?tab=marketplace etc.
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
  renderStudentEvents();
  renderStudentMarketplace();
  renderStudentNetworkPosts();
  renderStudentJobApplications();
  renderStudentBadges();
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
    const initials = (user.name || "Aditya Verma").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
  if (rollEl) rollEl.textContent = `Roll No: ${user.rollNumber || user.roll || '23/CS/104'}`;
  if (deptEl) deptEl.textContent = `${user.department || user.branch || 'Computer Science & Engineering'} (${user.year || '2'}nd Year)`;
  if (emailEl) emailEl.textContent = user.email || 'aditya@tint.edu.in';
}

function updateSummaryMetrics() {
  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";

  const apps = typeof Storage !== "undefined" ? Storage.getApplications() : [];
  const allRegs = typeof Storage !== "undefined" ? Storage.getEventRegistrations() : [];
  const userRegs = allRegs.filter(r => r.email === userEmail || r.studentEmail === userEmail);

  const allItems = typeof Storage !== "undefined" ? Storage.getMarketplaceItems() : [];
  const userItems = allItems.filter(i => i.sellerEmail === userEmail);

  const badges = typeof Storage !== "undefined" ? Storage.getVerifiedBadges(userEmail) : [];

  const appsEl = document.getElementById("metric-apps-count");
  const eventsEl = document.getElementById("metric-events-count");
  const mktEl = document.getElementById("metric-mkt-count");
  const badgesEl = document.getElementById("metric-badges-count");

  if (appsEl) appsEl.textContent = apps.length;
  if (eventsEl) eventsEl.textContent = userRegs.length;
  if (mktEl) mktEl.textContent = userItems.length;
  if (badgesEl) badgesEl.textContent = badges.length;
}

// ---------------- 1. CLUB APPLICATIONS ----------------
function renderApplicationsList() {
  const container = document.getElementById("applications-container");
  if (!container) return;

  const applications = typeof Storage !== "undefined" ? Storage.getApplications() : [];
  const badgeEl = document.getElementById("tab-count-apps");
  if (badgeEl) badgeEl.textContent = applications.length;

  if (applications.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderEmptyState(container, {
        title: "No Club Applications Submitted",
        message: "You haven't applied to any college societies yet. Explore active technical wings and cultural collectives recruiting this semester.",
        actionText: "Explore Recognized Societies",
        actionUrl: "clubs.html"
      });
    } else {
      container.innerHTML = `<p>No club applications found.</p>`;
    }
    return;
  }

  container.innerHTML = applications.map(app => {
    let badgeClass = "badge-warning";
    let badgeLabel = "Pending Review";
    const statusUpper = (app.status || "").toUpperCase();

    if (statusUpper === "APPROVED" || statusUpper === "ACCEPTED") {
      badgeClass = "badge-success";
      badgeLabel = "Accepted & Onboarded";
    } else if (statusUpper === "SHORTLISTED") {
      badgeClass = "badge-primary";
      badgeLabel = "Shortlisted for Interview";
    } else if (statusUpper === "REJECTED") {
      badgeClass = "badge-danger";
      badgeLabel = "Not Shortlisted";
    }

    const appDate = app.appliedAt || app.appliedDate || new Date().toISOString();
    const formattedDate = new Date(appDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

    return `
      <article class="dash-app-card">
        <div class="dash-app-info">
          <img src="${app.clubLogo || 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=100'}" alt="${escapeHTML(app.clubName)}" class="dash-app-logo" loading="lazy">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h4 class="dash-app-title">${escapeHTML(app.clubName)}</h4>
              <span class="badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="dash-app-meta">
              Target Wing: <strong>${escapeHTML(app.domain || 'Core Team')}</strong> &bull; Applied: ${formattedDate}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <a href="club-details.html?id=${app.clubId}" class="btn btn-outline btn-sm">View Society</a>
          <button class="btn btn-outline btn-sm" onclick="withdrawApp('${app.id}')" style="color: var(--color-error); border-color: var(--border-color);">
            Withdraw
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function withdrawApp(id) {
  if (confirm("Are you sure you wish to withdraw this society application?")) {
    if (typeof Storage !== "undefined") {
      Storage.deleteApplication(id);
    }
    refreshDashboard();
    if (typeof UIStates !== "undefined") {
      UIStates.showToast("Application withdrawn successfully.", "info");
    }
  }
}

// ---------------- 2. REGISTERED EVENTS & PASSES ----------------
function renderStudentEvents() {
  const container = document.getElementById("dash-events-container");
  if (!container) return;

  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";
  const allRegs = typeof Storage !== "undefined" ? Storage.getEventRegistrations() : [];
  const regs = allRegs.filter(r => r.email === userEmail || r.studentEmail === userEmail);

  const badgeEl = document.getElementById("tab-count-events");
  if (badgeEl) badgeEl.textContent = regs.length;

  if (regs.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderEmptyState(container, {
        title: "No Event Passes Registered",
        message: "You haven't registered for any campus hackathons or workshops yet. RSVP to events to generate verified digital entry passes.",
        actionText: "Browse Campus Events",
        actionUrl: "events.html"
      });
    }
    return;
  }

  container.innerHTML = `
    <div class="dash-events-grid">
      ${regs.map(reg => {
        const d = new Date(reg.eventDate || reg.date || Date.now());
        const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

        return `
          <div class="dash-event-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="badge badge-teal">✓ Entry Pass Issued</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
            </div>
            <h4 style="font-size: 1.0625rem; font-weight: 700; margin: 0 0 6px;">${escapeHTML(reg.eventTitle || reg.title)}</h4>
            <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 14px;">
              📍 ${escapeHTML(reg.eventVenue || reg.venue || 'Campus Auditorium')} &bull; Code: <code>${escapeHTML(reg.passCode || 'PASS-CONFIRMED')}</code>
            </div>
            <button class="btn btn-primary btn-sm btn-block" onclick="openPassModal('${reg.passCode || reg.id}')">
              View Digital Pass
            </button>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function openPassModal(codeOrId) {
  const allRegs = typeof Storage !== "undefined" ? Storage.getEventRegistrations() : [];
  const pass = allRegs.find(r => r.passCode === codeOrId || r.id === codeOrId) || allRegs[0];
  if (!pass) return;

  const modal = document.getElementById("dash-pass-modal");
  const body = document.getElementById("dash-pass-modal-body");
  if (!modal || !body) return;

  const d = new Date(pass.eventDate || pass.date || Date.now());
  const formattedDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  body.innerHTML = `
    <div class="digital-pass-card">
      <span class="digital-pass-badge">✓ OFFICIAL ENTRY PASS</span>
      <h3 style="margin: 0 0 4px; font-size: 1.125rem; font-weight: 800;">${escapeHTML(pass.eventTitle || pass.title)}</h3>
      <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 12px;">
        ${escapeHTML(pass.eventVenue || pass.venue || 'Campus Auditorium')} &bull; ${formattedDate}
      </div>

      <div class="digital-pass-code">${escapeHTML(pass.passCode || 'PASS-ENTRY')}</div>

      <div class="digital-pass-barcode">
        ${Array.from({ length: 30 }).map((_, i) => `<div class="barcode-bar" style="height: ${18 + (i % 5) * 5}px;"></div>`).join("")}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left; font-size: 0.75rem; background: var(--bg-surface); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 14px;">
        <div><strong>Attendee:</strong> ${escapeHTML(pass.studentName || 'Aditya Verma')}</div>
        <div><strong>Roll No:</strong> ${escapeHTML(pass.rollNumber || pass.studentRoll || '23/CS/104')}</div>
      </div>
    </div>

    <div class="modal-footer" style="margin-top: 16px;">
      <button type="button" class="btn btn-outline" onclick="closePassModal()">Done</button>
      <button type="button" class="btn btn-primary" onclick="window.print()">Print Entry Pass</button>
    </div>
  `;

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.style.display = "block";
}

function closePassModal() {
  const modal = document.getElementById("dash-pass-modal");
  if (!modal) return;
  if (typeof modal.close === "function") modal.close();
  else modal.style.display = "none";
}

function setupPassModal() {
  const closeBtn = document.getElementById("dash-pass-close");
  if (closeBtn) closeBtn.onclick = closePassModal;
}

// ---------------- 3. MARKETPLACE ITEMS ----------------
function renderStudentMarketplace() {
  const container = document.getElementById("dash-mkt-container");
  if (!container) return;

  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";
  const allItems = typeof Storage !== "undefined" ? Storage.getMarketplaceItems() : [];
  const items = allItems.filter(i => i.sellerEmail === userEmail);

  const badgeEl = document.getElementById("tab-count-mkt");
  if (badgeEl) badgeEl.textContent = items.length;

  if (items.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderEmptyState(container, {
        title: "No Marketplace Items Listed",
        message: "You haven't posted any engineering textbooks, calculators, or lab gear for sale yet.",
        actionText: "Post an Item on Marketplace",
        actionUrl: "marketplace.html"
      });
    }
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${items.map(item => {
        const isSold = item.status === "SOLD";

        return `
          <div class="dash-app-card">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="${item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" alt="${escapeHTML(item.title)}" style="width: 52px; height: 52px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-color);">
              <div>
                <h4 style="margin: 0 0 2px 0; font-size: 0.9375rem; font-weight: 700;">${escapeHTML(item.title)}</h4>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                  Price: <strong>₹${item.price}</strong> &bull; Condition: ${escapeHTML(item.condition || 'Good')} &bull; Pickup: ${escapeHTML(item.location || 'Campus')}
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge ${isSold ? 'badge-status-closed' : 'badge-status-open'}">${isSold ? 'Marked Sold' : 'Active Listing'}</span>
              <button class="btn btn-outline btn-sm" onclick="toggleItemSoldStatus('${item.id}')">
                ${isSold ? 'Relist as Available' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function toggleItemSoldStatus(itemId) {
  if (typeof Storage !== "undefined") {
    const allItems = Storage.getMarketplaceItems();
    const item = allItems.find(i => i.id === itemId);
    if (item) {
      item.status = item.status === "SOLD" ? "AVAILABLE" : "SOLD";
      Storage.saveMarketplaceItems(allItems);
      refreshDashboard();
      if (typeof UIStates !== "undefined") {
        UIStates.showToast(`Item updated to: ${item.status}`, "info");
      }
    }
  }
}

// ---------------- 4. MY COLLAB POSTS ----------------
function renderStudentNetworkPosts() {
  const container = document.getElementById("dash-network-container");
  if (!container) return;

  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userName = user ? user.name : "Aditya Verma";
  const allPosts = typeof Storage !== "undefined" ? Storage.getNetworkPosts() : [];
  const posts = allPosts.filter(p => p.authorName === userName);

  const badgeEl = document.getElementById("tab-count-posts");
  if (badgeEl) badgeEl.textContent = posts.length;

  if (posts.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderEmptyState(container, {
        title: "No Collaboration Posts Yet",
        message: "Find hackathon teammates, create study groups, or discuss engineering projects on the campus feed.",
        actionText: "Post on Peer Network",
        actionUrl: "network.html"
      });
    }
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${posts.map(p => `
        <div class="dash-app-card">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-teal">${escapeHTML(p.tag)}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(p.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
            </div>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              ${escapeHTML(p.content)}
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 12px; font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);">
            <span>▲ ${p.upvotes || 0} Upvotes</span>
            <span>💬 ${(p.comments || []).length} Replies</span>
            <a href="network.html" class="btn btn-outline btn-sm">View in Feed</a>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ---------------- 5. INTERNSHIP APPLICATIONS ----------------
function renderStudentJobApplications() {
  const container = document.getElementById("dash-jobs-container");
  if (!container) return;

  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";
  const allJobApps = typeof Storage !== "undefined" ? Storage.getJobApplications() : [];
  const apps = allJobApps.filter(a => a.studentEmail === userEmail);

  const badgeEl = document.getElementById("tab-count-jobs");
  if (badgeEl) badgeEl.textContent = apps.length;

  if (apps.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderEmptyState(container, {
        title: "No Placement Applications Submitted",
        message: "Apply for corporate campus drives and engineering internships from top employers like Microsoft, Google, TCS, and Swiggy.",
        actionText: "Explore Campus Drives",
        actionUrl: "recruiters.html"
      });
    }
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${apps.map(app => {
        let statusBadge = `<span class="badge badge-warning">Under Review</span>`;
        if (app.status === "Shortlisted" || app.status === "SHORTLISTED") {
          statusBadge = `<span class="badge badge-primary">Shortlisted for Interview</span>`;
        } else if (app.status === "Offer Extended" || app.status === "ACCEPTED") {
          statusBadge = `<span class="badge badge-success">Offer Extended</span>`;
        } else if (app.status === "Not Selected" || app.status === "REJECTED") {
          statusBadge = `<span class="badge badge-danger">Not Selected</span>`;
        }

        return `
          <div class="dash-app-card">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <h4 style="margin: 0; font-size: 1rem; font-weight: 700;">${escapeHTML(app.jobRole || app.role || 'Software Intern')}</h4>
                ${statusBadge}
              </div>
              <div class="dash-app-meta">
                Company: <strong style="color: var(--primary-color);">${escapeHTML(app.company || 'Corporate Partner')}</strong> &bull; Applied: ${new Date(app.appliedDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>

            <div>
              <a href="${app.resume || app.resumeUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
                View Submitted CV
              </a>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// ---------------- 6. VERIFIED BADGES ----------------
function renderStudentBadges() {
  const container = document.getElementById("dash-badges-container");
  if (!container) return;

  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";
  const badges = typeof Storage !== "undefined" ? Storage.getVerifiedBadges(userEmail) : [];

  const badgeEl = document.getElementById("tab-count-badges");
  if (badgeEl) badgeEl.textContent = badges.length;

  if (badges.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderEmptyState(container, {
        title: "No Verified Badges Earned Yet",
        message: "Participate in hackathons, complete society core projects, and maintain strong academic honors to receive digitally verified badges.",
        actionText: "Explore Campus Events",
        actionUrl: "events.html"
      });
    }
    return;
  }

  const shieldIcon = typeof Icons !== "undefined" ? Icons.render("shield-check", { width: 22, height: 22 }) : "🛡️";

  container.innerHTML = badges.map(b => `
    <div class="badge-cert-card">
      <div class="badge-cert-icon">
        ${shieldIcon}
      </div>
      <div>
        <div class="badge-cert-title">${escapeHTML(b.title)}</div>
        <div class="badge-cert-issuer">Issued by: ${escapeHTML(b.issuer)} &bull; ${escapeHTML(b.issueDate || '2026')}</div>
        <p class="badge-cert-desc">${escapeHTML(b.description)}</p>
        <div style="font-size: 0.6875rem; color: var(--text-muted); margin-top: 8px; font-family: monospace;">
          Hash: ${escapeHTML(b.verificationHash || 'SHA-256-AUTHENTICATED')}
        </div>
      </div>
    </div>
  `).join("");
}
