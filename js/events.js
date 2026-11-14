// js/events.js - Campus Events & Workshops Controller

let currentEvents = [];
let selectedCategory = "all";
let searchQuery = "";
let activeEventForRegistration = null;

document.addEventListener("DOMContentLoaded", () => {
  initEventsPage();
});

function initEventsPage() {
  currentEvents = typeof Storage !== "undefined" ? Storage.getEvents() : [];
  setupFilterChips();
  setupSearchInput();
  setupRegistrationModal();
  setupCreateEventModal();
  renderEvents();
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
  const clearBtn = document.getElementById("events-search-clear");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = val ? "inline-flex" : "none";
    searchQuery = val.toLowerCase();
    renderEvents();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      searchQuery = "";
      clearBtn.style.display = "none";
      renderEvents();
      input.focus();
    });
  }
}

function renderEvents() {
  const grid = document.getElementById("events-grid");
  const countEl = document.getElementById("events-count-badge");
  if (!grid) return;

  let filtered = currentEvents.filter(ev => {
    const matchesCat = selectedCategory === "all" || (ev.category || "").toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      (ev.title || "").toLowerCase().includes(searchQuery) ||
      (ev.clubName || "").toLowerCase().includes(searchQuery) ||
      (ev.venue || "").toLowerCase().includes(searchQuery) ||
      (ev.tags && ev.tags.some(t => t.toLowerCase().includes(searchQuery)));
    return matchesCat && matchesSearch;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} Events Listed`;
  }

  if (filtered.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderNoResultsState(grid, {
        query: searchQuery || selectedCategory,
        onClear: "resetFilters()"
      });
    } else {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3 class="empty-state-title">No events match your criteria</h3>
          <p class="empty-state-desc">Try adjusting your search terms or selecting another category.</p>
          <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset Filters</button>
        </div>
      `;
    }
    return;
  }

  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";

  const calendarIcon = typeof Icons !== "undefined" ? Icons.render("calendar", { width: 14, height: 14 }) : "";
  const mapPinIcon = typeof Icons !== "undefined" ? Icons.render("map-pin", { width: 14, height: 14 }) : "";
  const checkIcon = typeof Icons !== "undefined" ? Icons.render("check", { width: 14, height: 14 }) : "";

  grid.innerHTML = filtered.map(ev => {
    const d = new Date(ev.date);
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    const day = d.getDate();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const isRegistered = userEmail && typeof Storage !== "undefined" && Storage.isRegisteredForEvent(ev.id, userEmail);

    const registeredCount = ev.registeredCount || 0;
    const capacity = ev.capacity || 200;
    const capacityPct = Math.min(100, Math.round((registeredCount / capacity) * 100));
    const fillClass = capacityPct > 85 ? "full" : (capacityPct > 60 ? "high" : "");

    const isFree = !ev.fee || ev.fee.toLowerCase().includes("free") || ev.fee === "₹0";

    return `
      <article class="event-card" data-event-id="${ev.id}">
        <div class="event-banner-wrap">
          <img src="${ev.banner || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800'}" alt="${escapeHTML(ev.title)}" class="event-banner-img" loading="lazy">
          <div class="event-date-badge">
            <span class="event-date-month">${month}</span>
            <span class="event-date-day">${day}</span>
          </div>
          <span class="event-cat-badge">${escapeHTML(ev.category || 'Campus')}</span>
        </div>

        <div class="event-card-body">
          <div class="event-club-meta">
            ${calendarIcon}
            <span>${escapeHTML(ev.clubName || 'University Chapter')}</span>
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
              ${calendarIcon}
              <span>${month} ${day}, ${d.getFullYear()} &bull; ${time}</span>
            </div>
            <div class="event-detail-item">
              ${mapPinIcon}
              <span>${escapeHTML(ev.venue || 'Campus Auditorium')}</span>
            </div>
          </div>

          <!-- Capacity progress meter -->
          <div class="capacity-meter-wrap">
            <div class="capacity-meter-header">
              <span>Confirmed Seats</span>
              <span><strong>${registeredCount}</strong> / ${capacity} (${capacityPct}%)</span>
            </div>
            <div class="capacity-progress-bar">
              <div class="capacity-fill ${fillClass}" style="width: ${capacityPct}%;"></div>
            </div>
          </div>

          <div class="event-card-footer">
            <span class="event-fee-badge ${isFree ? 'free' : ''}">
              ${isFree ? 'Free Admission' : escapeHTML(ev.fee)}
            </span>

            ${isRegistered ? `
              <button class="btn btn-outline btn-sm" onclick="viewDigitalPass('${ev.id}')" style="color: var(--color-success); border-color: var(--color-success);">
                ${checkIcon} Registered (View Pass)
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="openRegisterModal('${ev.id}')">
                Register &amp; Get Pass
              </button>
            `}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function resetFilters() {
  selectedCategory = "all";
  searchQuery = "";
  const input = document.getElementById("events-search-input");
  if (input) input.value = "";
  const clearBtn = document.getElementById("events-search-clear");
  if (clearBtn) clearBtn.style.display = "none";

  const chips = document.querySelectorAll(".events-chip");
  chips.forEach(c => {
    if ((c.getAttribute("data-category") || "all") === "all") c.classList.add("active");
    else c.classList.remove("active");
  });

  renderEvents();
}

function openRegisterModal(eventId) {
  const event = currentEvents.find(e => e.id === eventId);
  if (!event) return;

  activeEventForRegistration = event;
  const modal = document.getElementById("event-reg-modal");
  const modalTitle = document.getElementById("modal-event-title");
  const modalSub = document.getElementById("modal-event-sub");
  const formView = document.getElementById("event-modal-form-view");
  const passView = document.getElementById("event-modal-pass-view");

  if (modalTitle) modalTitle.textContent = `Register: ${event.title}`;
  if (modalSub) modalSub.textContent = `Organized by ${event.clubName} • ${event.venue}`;

  if (formView) formView.style.display = "block";
  if (passView) passView.style.display = "none";

  // Pre-fill user data
  if (typeof Storage !== "undefined") {
    const user = Storage.getCurrentUser();
    if (user) {
      const nameInput = document.getElementById("reg-student-name");
      const rollInput = document.getElementById("reg-student-roll");
      const emailInput = document.getElementById("reg-student-email");
      if (nameInput && user.name) nameInput.value = user.name;
      if (rollInput && user.rollNumber) rollInput.value = user.rollNumber;
      if (emailInput && user.email) emailInput.value = user.email;
    }
  }

  if (modal) {
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.style.display = "block";
    }
  }
}

function closeRegisterModal() {
  const modal = document.getElementById("event-reg-modal");
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.style.display = "none";
  }
}

function setupRegistrationModal() {
  const closeBtn = document.getElementById("event-reg-close");
  const cancelBtn = document.getElementById("cancel-reg-btn");
  const form = document.getElementById("event-reg-form");

  if (closeBtn) closeBtn.onclick = closeRegisterModal;
  if (cancelBtn) cancelBtn.onclick = closeRegisterModal;

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!activeEventForRegistration) return;

      const name = document.getElementById("reg-student-name").value.trim();
      const roll = document.getElementById("reg-student-roll").value.trim();
      const email = document.getElementById("reg-student-email").value.trim();

      if (!name || !roll || !email) {
        if (typeof UIStates !== "undefined") {
          UIStates.showToast("Please fill in all attendee fields.", "warning");
        }
        return;
      }

      const passCode = "PASS-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + activeEventForRegistration.id.substring(0, 4).toUpperCase();

      const regRecord = {
        eventId: activeEventForRegistration.id,
        eventTitle: activeEventForRegistration.title,
        eventDate: activeEventForRegistration.date,
        eventVenue: activeEventForRegistration.venue,
        clubName: activeEventForRegistration.clubName,
        studentName: name,
        rollNumber: roll,
        email: email,
        passCode: passCode,
        registeredAt: new Date().toISOString()
      };

      if (typeof Storage !== "undefined") {
        Storage.registerForEvent(regRecord);
      }

      // Increment registered count locally
      activeEventForRegistration.registeredCount = (activeEventForRegistration.registeredCount || 0) + 1;

      renderDigitalPassView(regRecord);
      renderEvents();

      if (typeof UIStates !== "undefined") {
        UIStates.showToast("Registration confirmed! Your Digital Entry Pass is ready.", "success");
      }
    };
  }
}

function viewDigitalPass(eventId) {
  const event = currentEvents.find(e => e.id === eventId);
  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";

  let regRecord = null;
  if (typeof Storage !== "undefined") {
    const userRegs = Storage.getUserEventRegistrations(userEmail);
    regRecord = userRegs.find(r => r.eventId === eventId);
  }

  if (!regRecord) {
    regRecord = {
      eventId: eventId,
      eventTitle: event ? event.title : "Campus Event",
      eventDate: event ? event.date : new Date().toISOString(),
      eventVenue: event ? event.venue : "Campus Auditorium",
      clubName: event ? event.clubName : "ClubHub Society",
      studentName: user ? user.name : "Registered Student",
      rollNumber: user ? user.rollNumber : "23/CS/101",
      email: userEmail || "student@tint.edu.in",
      passCode: "PASS-" + eventId.substring(0, 4).toUpperCase() + "-VERIFIED",
      registeredAt: new Date().toISOString()
    };
  }

  const modal = document.getElementById("event-reg-modal");
  const modalTitle = document.getElementById("modal-event-title");
  const modalSub = document.getElementById("modal-event-sub");
  if (modalTitle) modalTitle.textContent = "Digital Entry Pass";
  if (modalSub) modalSub.textContent = regRecord.eventTitle;

  renderDigitalPassView(regRecord);

  if (modal) {
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.style.display = "block";
    }
  }
}

function renderDigitalPassView(regRecord) {
  const formView = document.getElementById("event-modal-form-view");
  const passView = document.getElementById("event-modal-pass-view");
  if (formView) formView.style.display = "none";
  if (!passView) return;

  const d = new Date(regRecord.eventDate);
  const formattedDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  passView.style.display = "block";
  passView.innerHTML = `
    <div class="digital-pass-card">
      <span class="digital-pass-badge">✓ OFFICIAL ENTRY PASS</span>
      <h3 style="margin: 0 0 6px; font-size: 1.125rem; font-weight: 800;">${escapeHTML(regRecord.eventTitle)}</h3>
      <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 12px;">
        ${escapeHTML(regRecord.clubName)} &bull; ${escapeHTML(regRecord.eventVenue)}
      </div>

      <div class="digital-pass-code">${escapeHTML(regRecord.passCode)}</div>

      <div class="digital-pass-barcode">
        ${Array.from({ length: 30 }).map((_, i) => `<div class="barcode-bar" style="height: ${18 + (i % 5) * 5}px;"></div>`).join("")}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left; font-size: 0.75rem; background: var(--bg-surface); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 14px;">
        <div><strong style="color: var(--text-secondary);">Attendee:</strong> ${escapeHTML(regRecord.studentName)}</div>
        <div><strong style="color: var(--text-secondary);">Roll No:</strong> ${escapeHTML(regRecord.rollNumber)}</div>
        <div><strong style="color: var(--text-secondary);">Event Date:</strong> ${formattedDate}</div>
        <div><strong style="color: var(--text-secondary);">Status:</strong> <span style="color: var(--color-success); font-weight: 700;">Confirmed</span></div>
      </div>
    </div>

    <div class="modal-footer" style="margin-top: 16px;">
      <button type="button" class="btn btn-outline" onclick="closeRegisterModal()">Done</button>
      <button type="button" class="btn btn-primary" onclick="window.print()">Print / Save Pass</button>
    </div>
  `;
}

function setupCreateEventModal() {
  const triggerBtn = document.getElementById("create-event-trigger");
  const modal = document.getElementById("create-event-modal");
  const closeBtn = document.getElementById("create-event-close");
  const cancelBtn = document.getElementById("cancel-create-btn");
  const form = document.getElementById("create-event-form");

  // Check if current user is admin or coordinator
  if (typeof Storage !== "undefined") {
    const user = Storage.getCurrentUser();
    if (user && (user.role === "Admin" || user.role === "Coordinator")) {
      if (triggerBtn) triggerBtn.style.display = "inline-flex";
    }
  }

  if (triggerBtn && modal) {
    triggerBtn.onclick = () => {
      if (typeof modal.showModal === "function") modal.showModal();
      else modal.style.display = "block";
    };
  }

  const closeCreate = () => {
    if (!modal) return;
    if (typeof modal.close === "function") modal.close();
    else modal.style.display = "none";
  };

  if (closeBtn) closeBtn.onclick = closeCreate;
  if (cancelBtn) cancelBtn.onclick = closeCreate;

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const title = document.getElementById("new-event-title").value.trim();
      const clubName = document.getElementById("new-event-club").value.trim();
      const category = document.getElementById("new-event-category").value;
      const date = document.getElementById("new-event-date").value;
      const venue = document.getElementById("new-event-venue").value.trim();
      const fee = document.getElementById("new-event-fee").value.trim() || "Free";
      const prizes = document.getElementById("new-event-prizes").value.trim();
      const capacity = parseInt(document.getElementById("new-event-capacity").value, 10) || 200;
      const desc = document.getElementById("new-event-desc").value.trim();

      const newEvent = {
        id: "evt-" + Date.now(),
        title,
        clubName,
        category,
        date: new Date(date).toISOString(),
        venue,
        fee,
        prizes,
        capacity,
        registeredCount: 0,
        description: desc,
        banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
      };

      currentEvents.unshift(newEvent);
      if (typeof Storage !== "undefined") {
        Storage.saveEvents(currentEvents);
      }

      closeCreate();
      form.reset();
      renderEvents();

      if (typeof UIStates !== "undefined") {
        UIStates.showToast("Event published successfully to campus calendar!", "success");
      }
    };
  }
}
