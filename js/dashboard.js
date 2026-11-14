// js/dashboard.js - Logic for Student Dashboard & Campus Life Command Center

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
    const initials = user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
  if (rollEl) rollEl.textContent = `Roll No: ${user.roll || '2023CSB1042'}`;
  if (deptEl) deptEl.textContent = `${user.branch || 'Computer Science & Engineering'} (${user.year || '2nd Year'})`;
  if (emailEl) emailEl.textContent = user.email || 'aditya@tint.edu.in';
}

function updateSummaryMetrics() {
  const user = Storage.getCurrentUser();
  const userEmail = user ? user.email : "";

  const apps = Storage.getApplications();
  const allRegs = Storage.getEventRegistrations();
  const userRegs = allRegs.filter(r => r.studentEmail === userEmail);

  const allItems = Storage.getMarketplaceItems();
  const userItems = allItems.filter(i => i.sellerEmail === userEmail);

  const badges = Storage.getVerifiedBadges(userEmail);

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

  const applications = Storage.getApplications();
  const badgeEl = document.getElementById("tab-count-apps");
  if (badgeEl) badgeEl.textContent = applications.length;

  if (applications.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <h3 style="font-size: 16px; margin-bottom: 6px;">No Club Applications Yet</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 14px;">Browse active university clubs and apply to domains that match your passion.</p>
        <a href="clubs.html" class="btn btn-primary btn-sm">Explore Clubs</a>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => {
    let badgeClass = "badge-warning";
    let badgeLabel = "Pending Review";

    if (app.status === "APPROVED" || app.status === "ACCEPTED") {
      badgeClass = "badge-success";
      badgeLabel = "Accepted & Onboarded";
    } else if (app.status === "SHORTLISTED") {
      badgeClass = "badge-primary";
      badgeLabel = "Shortlisted for Interview";
    } else if (app.status === "REJECTED") {
      badgeClass = "badge-danger";
      badgeLabel = "Not Shortlisted";
    }

    return `
      <div class="dash-pass-card">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <h4 style="margin: 0;">${escapeHTML(app.clubName)} (${escapeHTML(app.clubAcronym || '')})</h4>
            <span class="badge ${badgeClass}">${badgeLabel}</span>
          </div>
          <div class="dash-pass-meta">
            Domain: <strong>${escapeHTML(app.domain)}</strong> &bull; Applied on ${formatDate(app.appliedDate)}
          </div>
          ${app.interviewNotes ? `
            <div style="font-size: 12px; color: var(--primary); margin-top: 6px; background: var(--primary-light); padding: 4px 8px; border-radius: var(--radius-xs); display: inline-block;">
              💬 Coordinator Note: ${escapeHTML(app.interviewNotes)}
            </div>
          ` : ''}
        </div>

        <div>
          <button class="btn btn-outline btn-sm" onclick="withdrawApp('${app.id}')" style="color: var(--danger); border-color: var(--border);">
            Withdraw
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function withdrawApp(id) {
  if (confirm("Are you sure you wish to withdraw this club application?")) {
    Storage.deleteApplication(id);
    refreshDashboard();
    showToast("Application withdrawn successfully.", "info");
  }
}

// ---------------- 2. REGISTERED EVENTS & PASSES ----------------
function renderStudentEvents() {
  const container = document.getElementById("dash-events-container");
  if (!container) return;

  const user = Storage.getCurrentUser();
  const userEmail = user ? user.email : "";
  const allRegs = Storage.getEventRegistrations();
  const regs = allRegs.filter(r => r.studentEmail === userEmail);

  const badgeEl = document.getElementById("tab-count-events");
  if (badgeEl) badgeEl.textContent = regs.length;

  if (regs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <h3 style="font-size: 16px; margin-bottom: 6px;">No Event Passes Registered</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 14px;">RSVP to campus hackathons, fests, and workshops to receive verified digital entry passes.</p>
        <a href="events.html" class="btn btn-primary btn-sm">Browse Campus Events</a>
      </div>
    `;
    return;
  }

  container.innerHTML = regs.map(reg => {
    return `
      <div class="dash-pass-card">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <h4 style="margin: 0;">${escapeHTML(reg.eventTitle)}</h4>
            <span class="badge badge-success">✓ CONFIRMED PASS</span>
          </div>
          <div class="dash-pass-meta">
            Venue: <strong>${escapeHTML(reg.venue)}</strong> &bull; Pass Code: <code style="font-weight: 700; color: var(--primary);">${escapeHTML(reg.passCode)}</code>
          </div>
        </div>

        <div>
          <button class="btn btn-primary btn-sm" onclick="openPassModal('${reg.id}')">
            View Digital Pass (QR)
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function openPassModal(regId) {
  const registrations = Storage.getEventRegistrations();
  const pass = registrations.find(r => r.id === regId);
  if (!pass) return;

  const modal = document.getElementById("dash-pass-modal");
  const body = document.getElementById("dash-pass-modal-body");

  const d = new Date(pass.eventDate);
  const formattedDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  body.innerHTML = `
    <div class="pass-ticket-card">
      <div class="pass-header">
        <span class="pass-badge">✓ Official Campus Event Pass</span>
        <h3 style="font-size: 16px; margin: 6px 0 4px 0; color: var(--text-main); font-family: 'Plus Jakarta Sans', sans-serif;">${escapeHTML(pass.eventTitle)}</h3>
        <p style="font-size: 11px; color: var(--text-muted); margin: 0;">${escapeHTML(pass.venue)} &bull; ${formattedDate}</p>
      </div>

      <div class="pass-code">${escapeHTML(pass.passCode)}</div>

      <div class="pass-qr-sim">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <rect x="10" y="10" width="24" height="24" fill="#0F172A"/>
          <rect x="14" y="14" width="16" height="16" fill="white"/>
          <rect x="18" y="18" width="8" height="8" fill="#0F172A"/>
          <rect x="66" y="10" width="24" height="24" fill="#0F172A"/>
          <rect x="70" y="14" width="16" height="16" fill="white"/>
          <rect x="74" y="18" width="8" height="8" fill="#0F172A"/>
          <rect x="10" y="66" width="24" height="24" fill="#0F172A"/>
          <rect x="14" y="70" width="16" height="16" fill="white"/>
          <rect x="18" y="74" width="8" height="8" fill="#0F172A"/>
          <rect x="40" y="10" width="8" height="16" fill="#0F172A"/>
          <rect x="40" y="48" width="20" height="12" fill="#0F172A"/>
          <rect x="66" y="40" width="24" height="12" fill="#0F172A"/>
          <rect x="40" y="66" width="12" height="24" fill="#0F172A"/>
        </svg>
      </div>

      <div class="pass-meta-grid">
        <div>
          <div class="pass-meta-label">Attendee Name</div>
          <div class="pass-meta-val">${escapeHTML(pass.studentName)}</div>
        </div>
        <div>
          <div class="pass-meta-label">Roll Number</div>
          <div class="pass-meta-val">${escapeHTML(pass.studentRoll)}</div>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
      <button class="btn btn-primary btn-sm" onclick="window.print()">Print Pass</button>
      <button class="btn btn-outline btn-sm" onclick="document.getElementById('dash-pass-modal').style.display='none'">Close</button>
    </div>
  `;

  modal.style.display = "flex";
}

// ---------------- 3. MARKETPLACE ITEMS ----------------
function renderStudentMarketplace() {
  const container = document.getElementById("dash-mkt-container");
  if (!container) return;

  const user = Storage.getCurrentUser();
  const userEmail = user ? user.email : "";
  const allItems = Storage.getMarketplaceItems();
  const items = allItems.filter(i => i.sellerEmail === userEmail);

  const badgeEl = document.getElementById("tab-count-mkt");
  if (badgeEl) badgeEl.textContent = items.length;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <h3 style="font-size: 16px; margin-bottom: 6px;">No Items Listed for Sale</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 14px;">Sell your used engineering semester textbooks, drafters, and calculators to campus juniors.</p>
        <a href="marketplace.html" class="btn btn-primary btn-sm">Post on Marketplace</a>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const isSold = item.status === "SOLD";

    return `
      <div class="dash-mkt-item">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="${item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" alt="${escapeHTML(item.title)}" style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover;">
          <div>
            <h4 style="margin: 0 0 2px 0; font-size: 14px;">${escapeHTML(item.title)}</h4>
            <div style="font-size: 12px; color: var(--text-secondary);">
              Price: <strong>₹${item.price}</strong> &bull; Condition: ${escapeHTML(item.condition)} &bull; ${escapeHTML(item.location)}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge ${isSold ? 'badge-danger' : 'badge-success'}">${isSold ? 'SOLD OUT' : 'ACTIVE LISTING'}</span>
          <button class="btn btn-outline btn-sm" onclick="toggleItemSoldStatus('${item.id}')">
            ${isSold ? 'Relist as Available' : 'Mark as Sold'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function toggleItemSoldStatus(itemId) {
  const allItems = Storage.getMarketplaceItems();
  const item = allItems.find(i => i.id === itemId);
  if (item) {
    const newStatus = item.status === "SOLD" ? "AVAILABLE" : "SOLD";
    Storage.updateMarketplaceItemStatus(itemId, newStatus);
    refreshDashboard();
    showToast(`Marketplace item status updated to ${newStatus}`, "info");
  }
}

// ---------------- 4. MY COLLAB POSTS ----------------
function renderStudentNetworkPosts() {
  const container = document.getElementById("dash-network-container");
  if (!container) return;

  const user = Storage.getCurrentUser();
  const userRoll = user ? user.roll : "";
  const allPosts = Storage.getNetworkPosts();
  const posts = allPosts.filter(p => p.authorRoll === userRoll);

  const badgeEl = document.getElementById("tab-count-posts");
  if (badgeEl) badgeEl.textContent = posts.length;

  if (posts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <h3 style="font-size: 16px; margin-bottom: 6px;">No Collaboration Posts Yet</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 14px;">Find hackathon teammates, share study group invitations, or seek project collaborators.</p>
        <a href="network.html" class="btn btn-primary btn-sm">Go to Network Feed</a>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map(p => `
    <div class="dash-pass-card">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span class="badge badge-primary">${escapeHTML(p.tag)}</span>
          <span style="font-size: 12px; color: var(--text-muted);">${formatDate(p.timestamp)}</span>
        </div>
        <p style="font-size: 13px; color: var(--text-main); margin: 6px 0 0 0; line-height: 1.4;">
          ${escapeHTML(p.content)}
        </p>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: var(--text-secondary);">
        <span>▲ ${p.upvotes || 0} Upvotes</span>
        <span>💬 ${(p.comments || []).length} Replies</span>
        <a href="network.html" class="btn btn-outline btn-sm">View in Feed</a>
      </div>
    </div>
  `).join("");
}

// ---------------- 5. INTERNSHIP APPLICATIONS ----------------
function renderStudentJobApplications() {
  const container = document.getElementById("dash-jobs-container");
  if (!container) return;

  const user = Storage.getCurrentUser();
  const userEmail = user ? user.email : "";
  const allJobApps = Storage.getJobApplications();
  const apps = allJobApps.filter(a => a.studentEmail === userEmail);

  const badgeEl = document.getElementById("tab-count-jobs");
  if (badgeEl) badgeEl.textContent = apps.length;

  if (apps.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <h3 style="font-size: 16px; margin-bottom: 6px;">No Internship Applications</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 14px;">Discover campus recruitment drives from top companies like Microsoft, Google, TCS, and Swiggy.</p>
        <a href="recruiters.html" class="btn btn-primary btn-sm">Explore Placement Drives</a>
      </div>
    `;
    return;
  }

  container.innerHTML = apps.map(app => {
    let statusClass = "badge-warning";
    let statusLabel = "Application Under Review";

    if (app.status === "SHORTLISTED") {
      statusClass = "badge-primary";
      statusLabel = "Shortlisted for Interview";
    } else if (app.status === "ACCEPTED") {
      statusClass = "badge-success";
      statusLabel = "Offer Extended";
    } else if (app.status === "REJECTED") {
      statusClass = "badge-danger";
      statusLabel = "Not Selected";
    }

    return `
      <div class="dash-pass-card">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <h4 style="margin: 0;">${escapeHTML(app.role)}</h4>
            <span class="badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="dash-pass-meta">
            Company: <strong style="color: var(--primary);">${escapeHTML(app.company)}</strong> &bull; Applied: ${formatDate(app.appliedDate)}
          </div>
          ${app.recruiterNotes ? `
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px; background: var(--bg-surface); padding: 4px 8px; border-radius: var(--radius-xs); display: inline-block;">
              💬 Recruiter Update: ${escapeHTML(app.recruiterNotes)}
            </div>
          ` : ''}
        </div>

        <div>
          <a href="${app.resumeUrl || '#'}" target="_blank" class="btn btn-outline btn-sm">
            View Submitted Resume
          </a>
        </div>
      </div>
    `;
  }).join("");
}

// ---------------- 6. VERIFIED BADGES ----------------
function renderStudentBadges() {
  const container = document.getElementById("dash-badges-container");
  if (!container) return;

  const user = Storage.getCurrentUser();
  const userEmail = user ? user.email : "";
  const badges = Storage.getVerifiedBadges(userEmail);

  const badgeEl = document.getElementById("tab-count-badges");
  if (badgeEl) badgeEl.textContent = badges.length;

  if (badges.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <h3 style="font-size: 16px; margin-bottom: 6px;">No Verified Badges Earned Yet</h3>
        <p style="color: var(--text-secondary); font-size: 13px;">Participate in campus hackathons, lead clubs, and achieve semester honors to earn verified digital credentials.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = badges.map(b => `
    <div class="badge-cert-card">
      <div class="badge-top">
        <div class="badge-icon-box">🏆</div>
        <div class="badge-title-info">
          <h4>${escapeHTML(b.title)}</h4>
          <div class="badge-issuer">Issued by: ${escapeHTML(b.issuer)} &bull; ${escapeHTML(b.issueDate)}</div>
        </div>
      </div>

      <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 14px 0;">
        ${escapeHTML(b.description)}
      </p>

      <div class="badge-hash-row">
        <span>Verification Hash:</span>
        <span class="badge-hash-code">${escapeHTML(b.verificationHash)}</span>
      </div>
    </div>
  `).join("");
}
