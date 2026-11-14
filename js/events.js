// js/events.js - Campus Events & Workshops Controller

let currentEvents = [];
let selectedCategory = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  initEventsPage();
});

function initEventsPage() {
  currentEvents = Storage.getEvents();
  renderEvents();
  setupFilterChips();
  setupSearchInput();
  setupRegistrationModal();
  setupCreateEventModal();
}

function setupFilterChips() {
  const chips = document.querySelectorAll(".events-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedCategory = chip.getAttribute("data-category") || "all";
      renderEvents();
    });
  });
}

function setupSearchInput() {
  const input = document.getElementById("events-search-input");
  if (!input) return;

  input.addEventListener("input", debounce((e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderEvents();
  }, 200));
}

function renderEvents() {
  const grid = document.getElementById("events-grid");
  const countEl = document.getElementById("events-count-badge");
  if (!grid) return;

  let filtered = currentEvents.filter(ev => {
    const matchesCat = selectedCategory === "all" || ev.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      ev.title.toLowerCase().includes(searchQuery) ||
      ev.clubName.toLowerCase().includes(searchQuery) ||
      ev.venue.toLowerCase().includes(searchQuery) ||
      (ev.tags && ev.tags.some(t => t.toLowerCase().includes(searchQuery)));
    return matchesCat && matchesSearch;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} Events Found`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 64px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <h3 style="font-size: 18px; margin-bottom: 6px;">No campus events match your criteria</h3>
        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">Try adjusting your search terms or selecting another category.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  const user = Storage.getCurrentUser();
  const userEmail = user ? user.email : "";

  grid.innerHTML = filtered.map(ev => {
    const d = new Date(ev.date);
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    const day = d.getDate();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const isRegistered = userEmail && Storage.isRegisteredForEvent(ev.id, userEmail);

    return `
      <div class="event-card" data-event-id="${ev.id}">
        <div class="event-banner-wrap">
          <img src="${ev.banner || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800'}" alt="${escapeHTML(ev.title)}" class="event-banner-img" loading="lazy">
          <div class="event-date-badge">
            <div class="event-date-month">${month}</div>
            <div class="event-date-day">${day}</div>
          </div>
          <span class="event-cat-badge">${escapeHTML(ev.category)}</span>
        </div>

        <div class="event-card-body">
          <div class="event-club-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span>${escapeHTML(ev.clubName)}</span>
          </div>

          <h3 class="event-title">${escapeHTML(ev.title)}</h3>
          <p class="event-desc">${escapeHTML(ev.description || '')}</p>

          ${ev.prizes ? `
            <div class="event-prize-tag">
              <span>🏆</span>
              <span>${escapeHTML(ev.prizes)}</span>
            </div>
          ` : ''}

          <div class="event-details-list">
            <div class="event-detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${month} ${day}, ${d.getFullYear()} at ${time}</span>
            </div>
            <div class="event-detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${escapeHTML(ev.venue)}</span>
            </div>
            <div class="event-detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 10h20"/></svg>
              <span>Entry: <strong>${escapeHTML(ev.fee || 'Free')}</strong></span>
            </div>
          </div>

          <div class="event-card-footer">
            <div class="event-seats-info">
              <span class="event-seats-label">Confirmed Seats</span>
              <span class="event-seats-count">${ev.registeredCount || 0} / ${ev.capacity || 200}</span>
            </div>

            ${isRegistered ? `
              <button class="btn btn-outline btn-sm" onclick="viewDigitalPass('${ev.id}')" style="color: var(--success); border-color: var(--success);">
                ✓ Registered (View Pass)
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="openRegisterModal('${ev.id}')">
                Register &amp; Get Pass
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function resetFilters() {
  selectedCategory = "all";
  searchQuery = "";
  const input = document.getElementById("events-search-input");
  if (input) input.value = "";
  document.querySelectorAll(".events-chip").forEach(c => {
    if (c.getAttribute("data-category") === "all") c.classList.add("active");
    else c.classList.remove("active");
  });
  renderEvents();
}

// ---------------- EVENT REGISTRATION MODAL ----------------
let activeEventId = null;

function setupRegistrationModal() {
  const modal = document.getElementById("event-reg-modal");
  const form = document.getElementById("event-reg-form");
  const closeBtn = document.getElementById("event-reg-close");

  if (!modal || !form) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeEventId) return;

    const studentName = document.getElementById("reg-student-name").value.trim();
    const studentRoll = document.getElementById("reg-student-roll").value.trim().toUpperCase();
    const studentEmail = document.getElementById("reg-student-email").value.trim();

    const result = Storage.registerForEvent(activeEventId, {
      studentName,
      studentRoll,
      studentEmail
    });

    if (result.success) {
      currentEvents = Storage.getEvents();
      renderEvents();
      showDigitalPassInModal(result.pass);
      showToast("Event registration confirmed! Digital pass issued.", "success");
    } else {
      showToast(result.message, "error");
      if (result.pass) {
        showDigitalPassInModal(result.pass);
      }
    }
  });
}

function openRegisterModal(eventId) {
  activeEventId = eventId;
  const ev = Storage.getEventById(eventId);
  if (!ev) return;

  const modal = document.getElementById("event-reg-modal");
  const user = Storage.getCurrentUser();

  // Reset to form view
  document.getElementById("event-modal-form-view").style.display = "block";
  document.getElementById("event-modal-pass-view").style.display = "none";
  document.getElementById("modal-event-title").textContent = ev.title;
  document.getElementById("modal-event-sub").textContent = `${ev.clubName} • ${ev.venue}`;

  if (user) {
    document.getElementById("reg-student-name").value = user.name || "";
    document.getElementById("reg-student-roll").value = user.roll || "";
    document.getElementById("reg-student-email").value = user.email || "";
  }

  modal.style.display = "flex";
}

function showDigitalPassInModal(pass) {
  document.getElementById("event-modal-form-view").style.display = "none";
  const passView = document.getElementById("event-modal-pass-view");
  passView.style.display = "block";

  const d = new Date(pass.eventDate);
  const formattedDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  passView.innerHTML = `
    <div class="pass-ticket-card">
      <div class="pass-header">
        <span class="pass-badge">✓ Official Campus Event Pass</span>
        <h3 style="font-size: 18px; margin: 6px 0 4px 0; color: var(--text-main); font-family: 'Plus Jakarta Sans', sans-serif;">${escapeHTML(pass.eventTitle)}</h3>
        <p style="font-size: 12px; color: var(--text-muted); margin: 0;">${escapeHTML(pass.venue)} &bull; ${formattedDate}</p>
      </div>

      <div class="pass-code">${escapeHTML(pass.passCode)}</div>

      <div class="pass-qr-sim" title="Scan at event entry gate">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white"/>
          <!-- Simplified simulated QR code matrix -->
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
          <rect x="52" y="18" width="8" height="8" fill="#0F172A"/>
          <rect x="40" y="32" width="16" height="8" fill="#0F172A"/>
          <rect x="10" y="40" width="16" height="8" fill="#0F172A"/>
          <rect x="30" y="48" width="12" height="12" fill="#0F172A"/>
          <rect x="48" y="48" width="12" height="12" fill="#0F172A"/>
          <rect x="66" y="40" width="24" height="8" fill="#0F172A"/>
          <rect x="66" y="54" width="10" height="14" fill="#0F172A"/>
          <rect x="80" y="54" width="10" height="20" fill="#0F172A"/>
          <rect x="40" y="66" width="10" height="24" fill="#0F172A"/>
          <rect x="56" y="74" width="16" height="10" fill="#0F172A"/>
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
        <div>
          <div class="pass-meta-label">Registered Email</div>
          <div class="pass-meta-val">${escapeHTML(pass.studentEmail)}</div>
        </div>
        <div>
          <div class="pass-meta-label">Pass Status</div>
          <div class="pass-meta-val" style="color: var(--success);">ACTIVE &bull; VERIFIED</div>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
      <a href="dashboard.html" class="btn btn-outline btn-sm">View in Dashboard</a>
      <button class="btn btn-primary btn-sm" onclick="window.print()">Print / Save PDF</button>
      <button class="btn btn-outline btn-sm" onclick="document.getElementById('event-reg-modal').style.display='none'">Close</button>
    </div>
  `;
}

function viewDigitalPass(eventId) {
  const user = Storage.getCurrentUser();
  if (!user) return;
  const registrations = Storage.getEventRegistrations();
  const pass = registrations.find(r => r.eventId === eventId && r.studentEmail === user.email);
  if (pass) {
    const modal = document.getElementById("event-reg-modal");
    document.getElementById("event-modal-form-view").style.display = "none";
    showDigitalPassInModal(pass);
    modal.style.display = "flex";
  }
}

// ---------------- CREATE EVENT (ADMIN / LEAD) ----------------
function setupCreateEventModal() {
  const openBtn = document.getElementById("create-event-trigger");
  const modal = document.getElementById("create-event-modal");
  const form = document.getElementById("create-event-form");
  const closeBtn = document.getElementById("create-event-close");

  if (!openBtn || !modal || !form) return;

  const user = Storage.getCurrentUser();
  // Show button for admin or club leads
  if (user && (user.role === "admin" || user.role === "lead")) {
    openBtn.style.display = "inline-flex";
  }

  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("new-event-title").value.trim();
    const clubName = document.getElementById("new-event-club").value.trim();
    const category = document.getElementById("new-event-category").value;
    const date = document.getElementById("new-event-date").value;
    const venue = document.getElementById("new-event-venue").value.trim();
    const fee = document.getElementById("new-event-fee").value.trim() || "Free";
    const prizes = document.getElementById("new-event-prizes").value.trim();
    const capacity = parseInt(document.getElementById("new-event-capacity").value) || 200;
    const description = document.getElementById("new-event-desc").value.trim();

    Storage.addEvent({
      title,
      clubName,
      clubId: "custom-" + Date.now(),
      category,
      date,
      venue,
      fee,
      prizes,
      capacity,
      description,
      banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
      tags: [category, "Campus Event"]
    });

    currentEvents = Storage.getEvents();
    renderEvents();
    modal.style.display = "none";
    form.reset();
    showToast("New campus event published successfully!", "success");
  });
}

