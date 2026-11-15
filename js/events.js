// js/events.js - Campus Events & Digital Pass Ticketing Controller

let selectedCategory = "all";
let searchQuery = "";
let debounceTimer = null;
let loadedEvents = [];

document.addEventListener("DOMContentLoaded", async () => {
  setupFilterChips();
  setupSearchInput();
  setupCreateEventModal();
  setupEditEventModal();
  await loadAndRenderEvents();
});

function setupFilterChips() {
  const chips = document.querySelectorAll(".events-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedCategory = chip.getAttribute("data-category") || "all";
      loadAndRenderEvents();
    });
  });
}

function setupSearchInput() {
  const input = document.getElementById("events-search-input");
  const clearBtn = document.getElementById("events-search-clear");
  if (!input) return;

  input.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    searchQuery = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = searchQuery ? "flex" : "none";
    debounceTimer = setTimeout(() => {
      loadAndRenderEvents();
    }, 300);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      searchQuery = "";
      clearBtn.style.display = "none";
      loadAndRenderEvents();
    });
  }
}

async function loadAndRenderEvents() {
  const grid = document.getElementById("events-grid");
  const countEl = document.getElementById("events-count-badge");

  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-secondary);">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
      <div>Loading campus events...</div>
    </div>
  `;

  try {
    const events = await API.getEvents({
      category: selectedCategory,
      search: searchQuery
    });
    loadedEvents = events || [];

    if (countEl) {
      countEl.textContent = `${loadedEvents.length} Events Scheduled`;
    }

    if (!events || events.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card);">
          <div style="font-size: 36px; margin-bottom: 12px;">📅</div>
          <h3 style="font-size: 18px; margin: 0 0 8px; color: var(--text-main); font-weight: 700;">No upcoming events yet</h3>
          <p style="color: var(--text-secondary); font-size: 14px; margin: 0 auto; max-width: 420px;">
            Campus societies and chapter leads will publish national hackathons, robowars, and hands-on codelabs here.
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = events.map(ev => {
      const clubName = ev.club ? ev.club.name : "Campus Club";
      const bannerImg = ev.banner_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80";
      const dateObj = new Date(ev.event_date);
      const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const currentUser = API.getCurrentUser();
      const isSuperAdmin = currentUser && currentUser.role === "admin";
      const isCoordinator = currentUser && currentUser.role === "coordinator";
      const isOwner = currentUser && (isSuperAdmin || (isCoordinator && ev.club && ev.club.coordinator_id === currentUser.id));
      const isAdminOrCoordinator = currentUser && (currentUser.role === "coordinator" || currentUser.role === "admin");

      let actionHtml = "";
      if (isOwner) {
        actionHtml = `
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="openEditEventModal(${ev.id})" style="padding: 4px 10px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" title="Edit Event Details">✏️ Edit</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="handleDeleteEvent(${ev.id}, '${escapeHTML(ev.title)}')" style="padding: 4px 10px; font-size: 12px; font-weight: 600; color: var(--danger); border-color: var(--danger); display: inline-flex; align-items: center; gap: 4px;" title="Delete Scheduled Event">🗑️ Delete</button>
          </div>
        `;
      } else if (isAdminOrCoordinator) {
        actionHtml = `
          <span class="btn btn-outline btn-sm" style="color: var(--warm-accent, #F59E0B); border-color: var(--warm-accent, #F59E0B); cursor: default; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="Club Admins have direct organizer access to campus events.">
            🛡️ Admin Access
          </span>
        `;
      } else if (ev.is_registered) {
        actionHtml = `
          <button type="button" class="btn btn-outline btn-sm" style="color: var(--success); border-color: var(--success);" onclick="showPassModal('${escapeHTML(ev.title)}', '${escapeHTML(clubName)}', '${escapeHTML(ev.pass_code)}', '${dateStr} ${timeStr}', '${escapeHTML(ev.location)}')">
            ✓ Pass Held
          </button>
        `;
      } else {
        actionHtml = `
          <button type="button" class="btn btn-cta btn-sm" onclick="handleEventRegistration(${ev.id}, '${escapeHTML(ev.title)}', '${escapeHTML(clubName)}')">
            Register &amp; Get Pass
          </button>
        `;
      }

      const ownerBadge = isOwner
        ? `<span class="badge" style="position: absolute; top: 12px; right: 12px; font-size: 11px; background: rgba(245,158,11,0.92); color: #000; font-weight: 700; border: none;">🛡️ Your Event</span>`
        : "";

      return `
        <article class="event-card" style="display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); overflow: hidden; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s;">
          <div style="position: relative; height: 160px; overflow: hidden; background: var(--bg-surface);">
            <img src="${escapeHTML(bannerImg)}" alt="${escapeHTML(ev.title)}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
            <span class="badge" style="position: absolute; top: 12px; left: 12px; font-size: 11px; background: rgba(0,0,0,0.6); color: #FFF; border: none;">
              ${escapeHTML(ev.category)}
            </span>
            ${ownerBadge}
          </div>

          <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
            <div style="font-size: 12px; color: var(--primary); font-weight: 700; margin-bottom: 6px;">
              ${dateStr} &bull; ${timeStr}
            </div>

            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; margin: 0 0 8px; color: var(--text-main);">
              ${escapeHTML(ev.title)}
            </h3>

            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
              Organized by <strong>${escapeHTML(clubName)}</strong> &bull; 📍 ${escapeHTML(ev.location)}
            </div>

            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 20px; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHTML(ev.description)}
            </p>

            <div style="border-top: 1px solid var(--border); padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: var(--success); font-weight: 700;">Free Entry</span>
              ${actionHtml}
            </div>
          </div>
        </article>
      `;
    }).join("");

  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--danger);">
        <p style="font-weight: 600;">Failed to load events from backend.</p>
        <p style="font-size: 13px; color: var(--text-secondary);">${escapeHTML(err.message)}</p>
        <button class="btn btn-outline btn-sm" onclick="loadAndRenderEvents()" style="margin-top: 12px;">Retry</button>
      </div>
    `;
  }
}

async function handleEventRegistration(eventId, title, clubName) {
  const user = requireAuth();
  if (!user) return;

  if (user.role === "coordinator" || user.role === "admin") {
    showToast("Club Admins have direct organizer access to campus events.", "info");
    return;
  }

  try {
    showToast(`Registering for ${title}...`, "info");
    const reg = await API.registerForEvent(eventId);
    showToast("Registration confirmed! Digital Pass generated.", "success");
    await loadAndRenderEvents();
    showPassModal(title, clubName, reg.pass_code, "Confirmed", "Campus Venue");
  } catch (err) {
    showToast(err.message || "Failed to register for event.", "error");
  }
}

function showPassModal(title, clubName, passCode, dateStr, location) {
  const modal = document.getElementById("event-reg-modal");
  const formView = document.getElementById("event-modal-form-view");
  const passView = document.getElementById("event-modal-pass-view");
  const modalTitle = document.getElementById("modal-event-title");
  const modalSub = document.getElementById("modal-event-sub");

  if (!modal || !passView) return;

  const user = API.getCurrentUser() || {};
  const attendeeName = user.full_name || user.name || "Attendee";

  if (modalTitle) modalTitle.textContent = "Digital Entry Pass";
  if (modalSub) modalSub.textContent = "Cryptographically verified campus entry ticket";

  if (formView) formView.style.display = "none";
  passView.style.display = "block";

  passView.innerHTML = `
    <div style="text-align: center; padding: 10px 0;">
      <h3 style="font-size: 18px; margin: 0 0 4px; font-weight: 800; color: var(--text-main);">${escapeHTML(title)}</h3>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 18px;">Hosted by ${escapeHTML(clubName)}</div>

      <!-- QR Simulation -->
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
          <span style="color: var(--text-muted);">Pass Code:</span>
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

      <button type="button" class="btn btn-outline btn-block" onclick="document.getElementById('event-reg-modal').style.display='none'">Close Pass</button>
    </div>
  `;

  modal.style.display = "flex";
}

// ---------------- CREATE EVENT MODAL (FOR COORDINATORS) ----------------
function setupCreateEventModal() {
  const slot = document.getElementById("admin-event-actions-slot");
  const modal = document.getElementById("create-event-modal");
  const closeBtn = document.getElementById("create-event-close");
  const form = document.getElementById("create-event-form");
  const clubSelect = document.getElementById("new-event-club-select");

  const regModal = document.getElementById("event-reg-modal");
  const regClose = document.getElementById("event-reg-close");
  if (regClose && regModal) {
    regClose.addEventListener("click", () => { regModal.style.display = "none"; });
  }

  // Strictly for students and logged-out users: empty slot
  const user = API.getCurrentUser();
  if (!user || (user.role !== "coordinator" && user.role !== "admin")) {
    if (slot) slot.innerHTML = "";
    return;
  }

  // Inject only for verified Club Admins (single plus icon, clean title)
  if (slot) {
    slot.innerHTML = `
      <button type="button" id="create-event-trigger" class="btn btn-cta">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Schedule Event
      </button>
    `;
  }

  const trigger = document.getElementById("create-event-trigger");
  const bannerFile = document.getElementById("new-event-banner-file");
  const bannerPreview = document.getElementById("new-event-banner-preview");

  if (!trigger || !modal || !form) return;

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

  trigger.addEventListener("click", async () => {
    const currentUser = API.getCurrentUser();
    if (!currentUser || (currentUser.role !== "coordinator" && currentUser.role !== "admin")) {
      showToast("Access forbidden: Only Club Admins can schedule events.", "error");
      return;
    }

    try {
      const clubs = await API.getCoordinatedClubs();

      if (!clubs || clubs.length === 0) {
        showToast("You are not coordinating any clubs yet. Please charter a club in the Admin portal.", "warning");
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 1200);
        return;
      }

      if (clubSelect) {
        clubSelect.innerHTML = clubs.map(c => `
          <option value="${c.id}">${escapeHTML(c.name)}</option>
        `).join("");
      }

      if (bannerPreview) bannerPreview.innerHTML = "Preview";
      if (bannerFile) bannerFile.value = "";

      modal.style.display = "flex";
    } catch (err) {
      showToast(err.message || "Failed to load clubs.", "error");
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", () => { modal.style.display = "none"; });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const clubId = clubSelect ? Number(clubSelect.value) : null;
    const title = document.getElementById("new-event-title").value.trim();
    const category = document.getElementById("new-event-category").value;
    const dateVal = document.getElementById("new-event-date").value;
    const location = document.getElementById("new-event-venue").value.trim();
    const desc = document.getElementById("new-event-desc").value.trim();
    const bannerUrlInp = document.getElementById("new-event-banner-url") ? document.getElementById("new-event-banner-url").value.trim() : null;
    const submitBtn = form.querySelector("button[type='submit']");

    if (!clubId || !title || !dateVal || !location) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Scheduling...";
      }

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
        club_id: clubId,
        title,
        category,
        event_date: new Date(dateVal).toISOString(),
        location,
        description: desc || "Campus event",
        banner_url: finalBannerUrl
      });

      showToast(`Event '${title}' scheduled successfully!`, "success");
      modal.style.display = "none";
      form.reset();
      await loadAndRenderEvents();
    } catch (err) {
      showToast(err.message || "Failed to schedule event.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Schedule to Campus";
      }
    }
  });
}

// ---------------- EDIT EVENT MODAL & MANAGEMENT ----------------
function setupEditEventModal() {
  const modal = document.getElementById("edit-event-modal");
  const closeBtn = document.getElementById("edit-event-close");
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

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

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
    const venue = document.getElementById("edit-event-venue").value.trim();
    const desc = document.getElementById("edit-event-desc").value.trim();
    const bannerUrlInp = document.getElementById("edit-event-banner-url").value.trim();
    const submitBtn = form.querySelector("button[type='submit']");

    if (!title || !dateVal || !venue) {
      showToast("Please provide event title, date, and venue.", "error");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Saving...";
      }

      let finalBannerUrl = bannerUrlInp || undefined;
      const file = bannerFile && bannerFile.files && bannerFile.files[0];
      if (file) {
        showToast("Uploading banner image...", "info");
        const upRes = await API.uploadImage(file);
        finalBannerUrl = upRes.url;
      }

      const payload = {
        title,
        category,
        event_date: new Date(dateVal).toISOString(),
        location: venue,
        description: desc || "Campus event",
        ...(finalBannerUrl ? { banner_url: finalBannerUrl } : {})
      };

      await API.updateEvent(eventId, payload);
      showToast(`Event '${title}' updated successfully.`, "success");
      modal.style.display = "none";
      await loadAndRenderEvents();
    } catch (err) {
      showToast(err.message || "Failed to update event.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Save Changes";
      }
    }
  });
}

window.openEditEventModal = function(eventId) {
  const ev = loadedEvents.find(e => e.id === eventId);
  const modal = document.getElementById("edit-event-modal");
  if (!modal) return;

  if (ev) {
    populateAndShowEditModal(ev, modal);
  } else {
    API.getEvent(eventId).then(fetched => {
      populateAndShowEditModal(fetched, modal);
    }).catch(err => {
      showToast(err.message || "Failed to fetch event details.", "error");
    });
  }
};

function populateAndShowEditModal(ev, modal) {
  document.getElementById("edit-event-id").value = ev.id;
  document.getElementById("edit-event-title").value = ev.title || "";
  document.getElementById("edit-event-category").value = ev.category || "Workshop";

  if (ev.event_date) {
    const d = new Date(ev.event_date);
    const pad = n => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    document.getElementById("edit-event-date").value = localIso;
  }

  document.getElementById("edit-event-venue").value = ev.location || "";
  document.getElementById("edit-event-desc").value = ev.description || "";
  document.getElementById("edit-event-banner-url").value = ev.banner_url || "";

  const preview = document.getElementById("edit-event-banner-preview");
  if (preview) {
    if (ev.banner_url) {
      preview.innerHTML = `<img src="${escapeHTML(ev.banner_url)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      preview.innerHTML = "Preview";
    }
  }

  const fileInput = document.getElementById("edit-event-banner-file");
  if (fileInput) fileInput.value = "";

  modal.style.display = "flex";
}

window.handleDeleteEvent = async function(eventId, title) {
  const currentUser = API.getCurrentUser();
  if (!currentUser || (currentUser.role !== "coordinator" && currentUser.role !== "admin")) {
    showToast("Access forbidden: Only Club Admins can delete events.", "error");
    return;
  }

  if (!confirm(`Are you sure you want to permanently delete the event '${title}'?\n\nThis will remove the event from public listings and revoke any issued attendee passes. This action cannot be undone.`)) {
    return;
  }

  try {
    showToast(`Deleting event '${title}'...`, "info");
    await API.deleteEvent(eventId);
    showToast(`Event '${title}' has been deleted successfully.`, "success");
    await loadAndRenderEvents();
  } catch (err) {
    showToast(err.message || "Failed to delete event.", "error");
  }
};
