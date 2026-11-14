// js/clubs.js - Catalog, Search, Multi-Filter, Sorting & Join Request Logic

const catalogState = {
  searchQuery: "",
  category: "all",
  status: "ALL",
  sortBy: "RECOMMENDED"
};

document.addEventListener("DOMContentLoaded", () => {
  parseURLParameters();
  renderCategoryChips();
  initFilterControls();
  initCreateClubModal();
  loadAndRenderClubs();
});

function parseURLParameters() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("search")) {
    catalogState.searchQuery = params.get("search").trim();
    const input = document.getElementById("club-search-input");
    if (input) input.value = catalogState.searchQuery;
  }
  if (params.has("category")) {
    catalogState.category = params.get("category");
  }
  if (params.has("status")) {
    catalogState.status = params.get("status").toUpperCase();
    const select = document.getElementById("status-filter");
    if (select) select.value = catalogState.status;
  }
}

function renderCategoryChips() {
  const container = document.getElementById("category-chips-list");
  if (!container || typeof CATEGORIES === "undefined") return;

  container.innerHTML = CATEGORIES.map(cat => {
    const isActive = catalogState.category.toLowerCase() === cat.id.toLowerCase();
    return `
      <button 
        type="button" 
        class="category-chip ${isActive ? 'active' : ''}" 
        data-category="${cat.id}"
      >
        ${escapeHTML(cat.name)}
      </button>
    `;
  }).join("");

  container.querySelectorAll(".category-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".category-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      catalogState.category = btn.getAttribute("data-category");
      loadAndRenderClubs();
    });
  });
}

function initFilterControls() {
  const searchInput = document.getElementById("club-search-input");
  const clearBtn = document.getElementById("search-clear-btn");
  const statusFilter = document.getElementById("status-filter");
  const sortFilter = document.getElementById("sort-filter");
  const resetBtn = document.getElementById("reset-all-filters-btn");
  const emptyResetBtn = document.getElementById("empty-reset-btn");

  let debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      catalogState.searchQuery = searchInput.value.trim();
      if (clearBtn) clearBtn.style.display = catalogState.searchQuery ? "block" : "none";
      debounceTimer = setTimeout(() => {
        loadAndRenderClubs();
      }, 300);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      catalogState.searchQuery = "";
      clearBtn.style.display = "none";
      loadAndRenderClubs();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      catalogState.status = statusFilter.value;
      loadAndRenderClubs();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", () => {
      catalogState.sortBy = sortFilter.value;
      loadAndRenderClubs();
    });
  }

  const resetAll = () => {
    catalogState.searchQuery = "";
    catalogState.category = "all";
    catalogState.status = "ALL";
    catalogState.sortBy = "RECOMMENDED";
    if (searchInput) searchInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    if (statusFilter) statusFilter.value = "ALL";
    if (sortFilter) sortFilter.value = "RECOMMENDED";
    renderCategoryChips();
    loadAndRenderClubs();
  };

  if (resetBtn) resetBtn.addEventListener("click", resetAll);
  if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetAll);
}

async function loadAndRenderClubs() {
  const grid = document.getElementById("clubs-grid");
  const noResults = document.getElementById("no-results-state");
  const activeFilterBar = document.getElementById("active-filter-bar");
  const activeFilterLabel = document.getElementById("active-filter-label");

  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
      <div style="font-weight: 500;">Loading campus societies...</div>
    </div>
  `;

  if (noResults) noResults.style.display = "none";

  // Active filter indicator
  const hasFilter = catalogState.category !== "all" || catalogState.searchQuery || catalogState.status !== "ALL";
  if (activeFilterBar) {
    activeFilterBar.style.display = hasFilter ? "flex" : "none";
    if (activeFilterLabel) {
      const parts = [];
      if (catalogState.category !== "all") parts.push(`Category: ${catalogState.category}`);
      if (catalogState.searchQuery) parts.push(`Query: "${catalogState.searchQuery}"`);
      if (catalogState.status !== "ALL") parts.push(`Status: ${catalogState.status}`);
      activeFilterLabel.textContent = parts.join(" • ") || "All Societies";
    }
  }

  try {
    const clubs = await API.getClubs({
      category: catalogState.category,
      search: catalogState.searchQuery,
      recruitment_open: catalogState.status,
      sort: catalogState.sortBy
    });

    if (!clubs || clubs.length === 0) {
      grid.innerHTML = "";
      if (noResults) {
        noResults.style.display = "block";
        const titleEl = noResults.querySelector(".empty-state-title");
        const descEl = noResults.querySelector(".empty-state-desc");
        if (!hasFilter) {
          if (titleEl) titleEl.textContent = "No clubs yet – create the first one!";
          if (descEl) descEl.textContent = "Your campus directory is ready. Charter the first student society and become its coordinator!";
        } else {
          if (titleEl) titleEl.textContent = "No matching societies found";
          if (descEl) descEl.textContent = "We couldn't find any campus clubs matching your search filters. Try clearing filters or using different keywords.";
        }
      }
      return;
    }

    if (noResults) noResults.style.display = "none";

    grid.innerHTML = clubs.map(club => {
      const isSaved = typeof Storage !== "undefined" && Storage.isBookmarked(club.id);
      const isRecruiting = club.recruitment_open;
      const statusBadge = isRecruiting
        ? `<span class="badge badge-status-open"><span class="badge-dot"></span> Recruiting Now</span>`
        : `<span class="badge badge-status-closed">Recruitment Closed</span>`;

      // Category color class
      const catClass = getCategoryClass(club.category);

      // Join button state
      let actionBtnHtml = "";
      if (club.user_status === "admin") {
        actionBtnHtml = `<a href="admin.html" class="btn btn-outline btn-sm" style="font-weight: 700;">Club Admin</a>`;
      } else if (club.user_status === "member") {
        actionBtnHtml = `<span class="badge-status-member" style="padding: 6px 14px; border-radius: var(--radius-btn); font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">✓ Member</span>`;
      } else if (club.user_status === "pending") {
        actionBtnHtml = `<button type="button" class="btn btn-warning btn-sm" disabled style="opacity: 0.9; cursor: default;">Request Pending</button>`;
      } else if (club.user_status === "rejected") {
        actionBtnHtml = `<button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="handleJoinClub(${club.id}, event)">Rejected (Request Again)</button>`;
      } else {
        if (isRecruiting) {
          actionBtnHtml = `<button type="button" class="btn btn-cta btn-sm btn-join-club" onclick="handleJoinClub(${club.id}, event)">Join Club</button>`;
        } else {
          actionBtnHtml = `<button type="button" class="btn btn-outline btn-sm" disabled style="opacity: 0.6;">Closed</button>`;
        }
      }

      const coordinatorName = club.coordinator ? club.coordinator.full_name : "Campus Secretariat";
      const membersCount = club.member_count || 0;
      const bannerImg = club.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80";

      return `
        <article class="club-card" style="display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); overflow: hidden; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s;">
          <div style="position: relative; height: 160px; overflow: hidden; background: var(--bg-surface);">
            <img src="${escapeHTML(bannerImg)}" alt="${escapeHTML(club.name)}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
            <div style="position: absolute; top: 12px; left: 12px;">
              ${statusBadge}
            </div>
            <button 
              type="button" 
              class="club-card-save-btn ${isSaved ? 'saved' : ''}" 
              onclick="handleToggleBookmark(event, ${club.id})"
              aria-label="Save society"
              style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.4); border: none; border-radius: 50%; width: 34px; height: 34px; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer;"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>

          <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
            <div style="margin-bottom: 10px;">
              <span class="badge ${catClass}" style="font-size: 11px; font-weight: 700; text-transform: uppercase;">
                ${escapeHTML(club.category)}
              </span>
            </div>

            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; margin: 0 0 8px 0; color: var(--text-main);">
              <a href="club-details.html?id=${club.id}" style="color: inherit; text-decoration: none;">${escapeHTML(club.name)}</a>
            </h3>

            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 16px 0; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHTML(club.description)}
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 12px; margin-bottom: 16px;">
              <span><strong>${membersCount}</strong> ${membersCount === 1 ? 'Member' : 'Members'}</span>
              <span>Lead: <strong>${escapeHTML(coordinatorName)}</strong></span>
            </div>

            <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between;">
              <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm">View Details</a>
              ${actionBtnHtml}
            </div>
          </div>
        </article>
      `;
    }).join("");

  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--danger);">
        <p style="font-weight: 600;">Failed to load clubs from backend.</p>
        <p style="font-size: 13px; color: var(--text-secondary);">${escapeHTML(err.message)}</p>
        <button class="btn btn-outline btn-sm" onclick="loadAndRenderClubs()" style="margin-top: 12px;">Retry</button>
      </div>
    `;
  }
}

function getCategoryClass(cat) {
  if (!cat) return "tag-tech";
  const c = cat.toLowerCase();
  if (c.includes("tech") || c.includes("cod")) return "tag-tech";
  if (c.includes("cultur") || c.includes("music") || c.includes("art")) return "tag-cultural";
  if (c.includes("sport") || c.includes("athlet")) return "tag-sports";
  if (c.includes("liter") || c.includes("debat")) return "tag-literary";
  if (c.includes("social") || c.includes("commun")) return "tag-social";
  if (c.includes("entrepr") || c.includes("cell") || c.includes("biz")) return "tag-ecell";
  return "tag-tech";
}

async function handleJoinClub(clubId, event) {
  const user = requireAuth();
  if (!user) return;

  const btn = event ? (event.currentTarget || event.target) : null;
  const originalHtml = btn ? btn.innerHTML : "Join Club";

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="display:inline-block; width:12px; height:12px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; vertical-align:middle; margin-right:4px;"></span> Submitting...`;
  }

  try {
    showToast("Submitting your join request...", "info");
    const res = await API.submitJoinRequest(clubId);
    
    if (res && res.status === "Approved") {
      showToast("You are an active member of this society!", "success");
      if (btn) {
        btn.outerHTML = `<span class="badge-status-member" style="padding: 6px 14px; border-radius: var(--radius-btn); font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">✓ Member</span>`;
      }
    } else {
      showToast("Join request submitted! Status is now Pending.", "success");
      if (btn) {
        btn.outerHTML = `<button type="button" class="btn btn-warning btn-sm" disabled style="opacity: 0.9; cursor: default;">Request Pending</button>`;
      }
    }
    await loadAndRenderClubs();
  } catch (err) {
    const msg = err.message || "";
    if (msg.includes("already an active member")) {
      showToast("You are already an active member of this society.", "info");
      if (btn) {
        btn.outerHTML = `<span class="badge-status-member" style="padding: 6px 14px; border-radius: var(--radius-btn); font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">✓ Member</span>`;
      }
    } else if (msg.includes("already have a pending") || msg.includes("already pending")) {
      showToast("You already have a pending join request for this society.", "info");
      if (btn) {
        btn.outerHTML = `<button type="button" class="btn btn-warning btn-sm" disabled style="opacity: 0.9; cursor: default;">Request Pending</button>`;
      }
    } else {
      showToast(msg || "Failed to submit join request.", "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  }
}

function handleToggleBookmark(e, clubId) {
  e.preventDefault();
  e.stopPropagation();
  if (typeof Storage !== "undefined") {
    const isAdded = Storage.toggleBookmark(clubId);
    showToast(isAdded ? "Club saved to bookmarks!" : "Club removed from bookmarks.", "info");
    loadAndRenderClubs();
  }
}

// ---------------- CREATE CLUB MODAL ----------------
function initCreateClubModal() {
  const openBtn = document.getElementById("open-create-club-btn");
  const modal = document.getElementById("create-club-modal");
  const closeBtn = document.getElementById("close-create-club-btn");
  const form = document.getElementById("create-club-form");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    const user = requireAuth();
    if (!user) return;
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = requireAuth();
    if (!user) return;

    const name = document.getElementById("club-name-input").value.trim();
    const category = document.getElementById("club-category-input").value;
    const description = document.getElementById("club-desc-input").value.trim();
    const imageUrl = document.getElementById("club-image-input") ? document.getElementById("club-image-input").value.trim() : null;
    const submitBtn = form.querySelector("button[type='submit']");

    if (!name || !category || !description) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Chartering Society...";
      }

      await API.createClub({
        name,
        category,
        description,
        image_url: imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
        recruitment_open: true
      });

      showToast(`Club '${name}' created! You are now its coordinator.`, "success");
      modal.style.display = "none";
      form.reset();
      await loadAndRenderClubs();

    } catch (err) {
      showToast(err.message || "Failed to create club.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Charter Club";
      }
    }
  });
}
