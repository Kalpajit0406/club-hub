// js/dashboard.js - Student Dashboard & Campus Life Command Center Controller

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  initDashboardTabs();
  await refreshDashboard();
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

  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");
  if (tabParam) {
    const targetBtn = document.querySelector(`[data-tab="${tabParam}"]`);
    if (targetBtn) targetBtn.click();
  }
}

async function refreshDashboard() {
  updateUserProfileHeader();
  await Promise.all([
    renderMyClubs(),
    renderRegisteredEvents(),
    renderMyCollabPosts(),
    renderMyBadges()
  ]);
}

function updateUserProfileHeader() {
  const user = API.getCurrentUser();
  if (!user) return;

  const displayName = user.full_name || user.name || "Student User";
  const nameEl = document.getElementById("dash-user-name");
  const avatarEl = document.getElementById("dash-user-avatar");
  const deptEl = document.getElementById("dash-user-dept");
  const emailEl = document.getElementById("dash-user-email");
  const roleEl = document.getElementById("dash-user-role");

  if (nameEl) nameEl.textContent = displayName;
  if (avatarEl) {
    const initials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "ST";
    avatarEl.textContent = initials;
  }
  if (deptEl) {
    const yearStr = user.year ? `${user.year} Year` : "Student";
    deptEl.textContent = `${user.department || 'Collegiate Engineering'} (${yearStr})`;
  }
  if (emailEl) emailEl.textContent = user.email || "";
  if (roleEl) {
    let r = "Student";
    if (user.role === "admin") r = "Site Super Admin";
    else if (user.role === "coordinator") r = "Club Lead / Admin";
    roleEl.textContent = r;
  }
}

// ---------------- TAB 1: MY CLUBS & JOIN REQUESTS ----------------
async function renderMyClubs() {
  const container = document.getElementById("my-clubs-container");
  const tabBadge = document.getElementById("tab-count-clubs");
  const metricClubs = document.getElementById("metric-clubs-count");
  const metricPending = document.getElementById("metric-pending-count");

  if (!container) return;

  container.innerHTML = `<div style="text-align: center; padding: 36px; color: var(--text-secondary);">Loading your societies...</div>`;

  try {
    const data = await API.getMyClubs();
    const memberships = data.memberships || [];
    const coordinated = data.coordinated || [];
    const pending = data.pending_requests || [];
    const rejected = data.rejected_requests || [];

    const totalClubsCount = memberships.length + coordinated.length;
    if (tabBadge) tabBadge.textContent = totalClubsCount;
    if (metricClubs) metricClubs.textContent = totalClubsCount;
    if (metricPending) metricPending.textContent = pending.length;

    let html = "";

    // 1. Coordinated Clubs
    if (coordinated.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; margin: 0 0 12px 0; color: var(--primary);">
            ⚡ Clubs You Coordinate
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
            ${coordinated.map(c => `
              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(c.club_name)}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">${c.member_count} Members &bull; ${c.pending_requests} Pending Requests</div>
                </div>
                <a href="admin.html" class="btn btn-outline btn-sm">Secretariat &rarr;</a>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // 2. Active Memberships
    if (memberships.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; margin: 0 0 12px 0; color: var(--text-main);">
            🏛️ Active Society Memberships
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
            ${memberships.map(m => `
              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(m.club_name)}</div>
                  <div style="font-size: 12px; color: var(--success); font-weight: 600;">Active Core Member</div>
                </div>
                <a href="club-details.html?id=${m.club_id}" class="btn btn-outline btn-sm">View Society</a>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // 3. Pending Requests
    if (pending.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; margin: 0 0 12px 0; color: var(--warm-accent, #F59E0B);">
            ⏳ Pending Join Requests
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
            ${pending.map(p => `
              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(p.club_name)}</div>
                  <div style="font-size: 12px; color: var(--warm-accent, #F59E0B); font-weight: 600;">Under Review by Coordinator</div>
                </div>
                <span class="badge-status-pending" style="padding: 4px 10px; border-radius: 999px; font-size: 11px;">Pending</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // 4. Rejected Requests
    if (rejected.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; margin: 0 0 12px 0; color: var(--danger);">
            Decision Recorded
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
            ${rejected.map(r => `
              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(r.club_name)}</div>
                  <div style="font-size: 12px; color: var(--danger);">Request not accepted</div>
                </div>
                <a href="club-details.html?id=${r.club_id}" class="btn btn-outline btn-sm">Re-apply</a>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    if (!html) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card);">
          <div style="font-size: 36px; margin-bottom: 12px;">🏛️</div>
          <h4 style="font-size: 18px; margin: 0 0 8px; color: var(--text-main);">You haven't joined any clubs yet</h4>
          <p style="color: var(--text-secondary); font-size: 14px; margin: 0 auto 20px; max-width: 400px;">
            Explore collegiate societies, technical chapters, and student cells to get involved on campus!
          </p>
          <a href="clubs.html" class="btn btn-cta">Explore Campus Societies</a>
        </div>
      `;
      return;
    }

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 24px;">Failed to load clubs: ${escapeHTML(err.message)}</div>`;
  }
}

// ---------------- TAB 2: REGISTERED EVENTS & PASSES ----------------
async function renderRegisteredEvents() {
  const container = document.getElementById("dash-events-container");
  const tabBadge = document.getElementById("tab-count-events");
  const metricEvents = document.getElementById("metric-events-count");

  if (!container) return;

  container.innerHTML = `<div style="text-align: center; padding: 36px; color: var(--text-secondary);">Loading your event passes...</div>`;

  try {
    const registrations = await API.getMyEventRegistrations();

    if (tabBadge) tabBadge.textContent = registrations.length;
    if (metricEvents) metricEvents.textContent = registrations.length;

    if (!registrations || registrations.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card);">
          <div style="font-size: 36px; margin-bottom: 12px;">🎫</div>
          <h4 style="font-size: 18px; margin: 0 0 8px; color: var(--text-main);">No Event Passes Held</h4>
          <p style="color: var(--text-secondary); font-size: 14px; margin: 0 auto 20px; max-width: 400px;">
            Register for upcoming campus hackathons, robowars, and workshops to receive verified QR entry passes.
          </p>
          <a href="events.html" class="btn btn-primary">Browse Campus Events</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
        ${registrations.map(reg => {
          const ev = reg.event || {};
          const clubName = ev.club ? ev.club.name : "Campus Club";
          const dateStr = ev.event_date ? new Date(ev.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Upcoming";

          return `
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <span class="badge" style="font-size: 11px;">${escapeHTML(ev.category || 'Workshop')}</span>
                  <span class="badge-status-approved" style="padding: 3px 8px; border-radius: 999px; font-size: 10px;">Pass Active</span>
                </div>
                <h4 style="font-size: 16px; margin: 0 0 6px; color: var(--text-main); font-weight: 700;">${escapeHTML(ev.title || 'Campus Event')}</h4>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">${escapeHTML(clubName)} &bull; ${escapeHTML(ev.location || 'Campus')}</div>
                <div style="font-size: 13px; color: var(--text-secondary); font-weight: 500; margin-bottom: 16px;">📅 ${dateStr}</div>
              </div>

              <div style="border-top: 1px dashed var(--border); padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Pass Code</div>
                  <div style="font-family: monospace; font-weight: 700; color: var(--primary); font-size: 13px;">${escapeHTML(reg.pass_code)}</div>
                </div>
                <button type="button" class="btn btn-outline btn-sm" onclick="showPassModal('${escapeHTML(ev.title || 'Event')}', '${escapeHTML(clubName)}', '${escapeHTML(reg.pass_code)}', '${dateStr}', '${escapeHTML(ev.location || 'Campus')}')">
                  View Pass
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 24px;">Failed to load events: ${escapeHTML(err.message)}</div>`;
  }
}

function showPassModal(title, clubName, passCode, dateStr, location) {
  const modal = document.getElementById("dash-pass-modal");
  const body = document.getElementById("dash-pass-modal-body");
  if (!modal || !body) return;

  const user = API.getCurrentUser() || {};
  const attendeeName = user.full_name || user.name || "Attendee";

  body.innerHTML = `
    <div style="text-align: center; padding: 10px 0;">
      <div style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 4px;">OFFICIAL CAMPUS ACCESS PASS</div>
      <h3 style="font-size: 20px; margin: 0 0 4px; font-weight: 800; color: var(--text-main);">${escapeHTML(title)}</h3>
      <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">Hosted by ${escapeHTML(clubName)}</div>

      <!-- QR Simulation Box -->
      <div style="width: 140px; height: 140px; margin: 0 auto 18px; padding: 10px; background: #FFFFFF; border: 2px solid var(--border); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
          <rect width="100" height="100" fill="#FFFFFF"/>
          <rect x="10" y="10" width="30" height="30" fill="#0F172A"/>
          <rect x="15" y="15" width="20" height="20" fill="#FFFFFF"/>
          <rect x="20" y="20" width="10" height="10" fill="#0F172A"/>
          <rect x="60" y="10" width="30" height="30" fill="#0F172A"/>
          <rect x="65" y="15" width="20" height="20" fill="#FFFFFF"/>
          <rect x="70" y="20" width="10" height="10" fill="#0F172A"/>
          <rect x="10" y="60" width="30" height="30" fill="#0F172A"/>
          <rect x="15" y="65" width="20" height="20" fill="#FFFFFF"/>
          <rect x="20" y="70" width="10" height="10" fill="#0F172A"/>
          <rect x="46" y="10" width="8" height="20" fill="#0F172A"/>
          <rect x="46" y="38" width="16" height="8" fill="#0F172A"/>
          <rect x="60" y="52" width="14" height="14" fill="#0F172A"/>
          <rect x="80" y="60" width="10" height="24" fill="#0F172A"/>
          <rect x="46" y="68" width="24" height="10" fill="#0F172A"/>
          <rect x="48" y="82" width="12" height="8" fill="#0F172A"/>
        </svg>
      </div>

      <div style="background: var(--bg-surface); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 16px; text-align: left; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--text-muted);">Attendee:</span>
          <strong>${escapeHTML(attendeeName)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--text-muted);">Pass ID:</span>
          <strong style="font-family: monospace; color: var(--primary);">${escapeHTML(passCode)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: var(--text-muted);">Schedule:</span>
          <span>${escapeHTML(dateStr)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Venue:</span>
          <span>${escapeHTML(location)}</span>
        </div>
      </div>

      <button type="button" class="btn btn-outline btn-block" onclick="document.getElementById('dash-pass-modal').style.display='none'">Close Pass</button>
    </div>
  `;

  modal.style.display = "flex";
}

// ---------------- TAB 3: MY COLLAB POSTS ----------------
async function renderMyCollabPosts() {
  const container = document.getElementById("dash-network-container");
  const tabBadge = document.getElementById("tab-count-posts");

  if (!container) return;

  try {
    const user = API.getCurrentUser();
    const allPosts = await API.getNetworkPosts();
    const myPosts = allPosts.filter(p => p.student_id === user.id);

    if (tabBadge) tabBadge.textContent = myPosts.length;

    if (!myPosts || myPosts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card);">
          <div style="font-size: 36px; margin-bottom: 12px;">💬</div>
          <h4 style="font-size: 18px; margin: 0 0 8px; color: var(--text-main);">No Published Discussions</h4>
          <p style="color: var(--text-secondary); font-size: 14px; margin: 0 auto 20px; max-width: 400px;">
            Start a hackathon team search or study circle on the peer network feed.
          </p>
          <a href="network.html" class="btn btn-primary">Go to Collab Feed</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${myPosts.map(post => `
          <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="badge" style="font-size: 11px;">${escapeHTML(post.tag)}</span>
              <span style="font-size: 12px; color: var(--text-muted);">${new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <h4 style="font-size: 16px; margin: 0 0 6px; color: var(--text-main); font-weight: 700;">${escapeHTML(post.title)}</h4>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 12px;">${escapeHTML(post.content)}</p>
            <div style="display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); font-weight: 600;">
              <span>▲ ${post.upvotes_count} Upvotes</span>
              <span>💬 ${post.comments_count || 0} Comments</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 24px;">Failed to load posts: ${escapeHTML(err.message)}</div>`;
  }
}

// ---------------- TAB 4: VERIFIED BADGES ----------------
async function renderMyBadges() {
  const container = document.getElementById("dash-badges-container");
  const tabBadge = document.getElementById("tab-count-badges");
  const metricBadges = document.getElementById("metric-badges-count");

  if (!container) return;

  try {
    const badges = await API.getMyBadges();

    if (tabBadge) tabBadge.textContent = badges.length;
    if (metricBadges) metricBadges.textContent = badges.length;

    if (!badges || badges.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); grid-column: 1 / -1;">
          <div style="font-size: 36px; margin-bottom: 12px;">🏅</div>
          <h4 style="font-size: 18px; margin: 0 0 8px; color: var(--text-main);">No Badges Earned Yet</h4>
          <p style="color: var(--text-secondary); font-size: 14px; margin: 0 auto; max-width: 420px;">
            Participate in campus hackathons, lead club workshops, and contribute to society projects to receive verifiable cryptographic credentials.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = badges.map(badge => `
      <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(79, 70, 229, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 20px;">
              🏅
            </div>
            <span class="badge-status-approved" style="padding: 3px 8px; border-radius: 999px; font-size: 10px;">Verified Hash</span>
          </div>
          <h4 style="font-size: 16px; margin: 0 0 6px; color: var(--text-main); font-weight: 700;">${escapeHTML(badge.title)}</h4>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 14px;">${escapeHTML(badge.description)}</p>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: 12px; font-size: 11px; color: var(--text-muted);">
          <div>Issued by: <strong>${escapeHTML(badge.issuer_name)}</strong></div>
          <div style="font-family: monospace; color: var(--primary); margin-top: 4px;">Hash: ${escapeHTML(badge.hash_id)}</div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 24px; grid-column: 1 / -1;">Failed to load badges: ${escapeHTML(err.message)}</div>`;
  }
}
