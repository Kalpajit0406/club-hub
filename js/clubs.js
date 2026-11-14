// js/clubs.js - Catalog, Search, Multi-Filter & Sorting Logic

// Application state for the catalog page
const catalogState = {
  searchQuery: "",
  category: "all",
  status: "ALL", // "ALL" | "OPEN" | "CLOSED"
  sortBy: "recommended" // "recommended" | "name-asc" | "members-desc" | "newest"
};

document.addEventListener("DOMContentLoaded", () => {
  parseURLParameters();
  renderCategoryChips();
  initFilterControls();
  applyFiltersAndRender();
});

// Read initial filters from URL (e.g., clubs.html?category=Technical or ?search=robotics)
function parseURLParameters() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has("search")) {
    catalogState.searchQuery = params.get("search").trim();
    const searchInput = document.getElementById("catalog-search-input");
    if (searchInput) {
      searchInput.value = catalogState.searchQuery;
      toggleSearchClearBtn(true);
    }
  }

  if (params.has("category")) {
    catalogState.category = params.get("category");
  }

  if (params.has("filter") && params.get("filter") === "open") {
    catalogState.status = "OPEN";
    const statusSelect = document.getElementById("status-filter-select");
    if (statusSelect) statusSelect.value = "OPEN";
  }
}

// Render Category Filter Chips
function renderCategoryChips() {
  const container = document.getElementById("category-chips-container");
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

  // Attach click listener for chips
  container.querySelectorAll(".category-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      container.querySelectorAll(".category-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      catalogState.category = chip.getAttribute("data-category");
      applyFiltersAndRender();
    });
  });
}

// Setup input listeners for search, status, and sorting
function initFilterControls() {
  const searchInput = document.getElementById("catalog-search-input");
  const clearBtn = document.getElementById("catalog-search-clear");
  const statusSelect = document.getElementById("status-filter-select");
  const sortSelect = document.getElementById("sort-select");

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value.trim();
      toggleSearchClearBtn(val.length > 0);
      debounceTimer = setTimeout(() => {
        catalogState.searchQuery = val;
        applyFiltersAndRender();
      }, 200);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      catalogState.searchQuery = "";
      toggleSearchClearBtn(false);
      applyFiltersAndRender();
      searchInput.focus();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      catalogState.status = e.target.value;
      applyFiltersAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      catalogState.sortBy = e.target.value;
      applyFiltersAndRender();
    });
  }
}

function toggleSearchClearBtn(show) {
  const clearBtn = document.getElementById("catalog-search-clear");
  if (clearBtn) {
    if (show) clearBtn.classList.add("visible");
    else clearBtn.classList.remove("visible");
  }
}

// Filter, Sort, and Render Clubs
function applyFiltersAndRender() {
  const gridContainer = document.getElementById("clubs-catalog-grid");
  const countEl = document.getElementById("results-count-number");
  if (!gridContainer || typeof CLUBS_DATA === "undefined") return;

  let results = [...CLUBS_DATA];

  // 1. Category Filter
  if (catalogState.category && catalogState.category.toLowerCase() !== "all") {
    results = results.filter(club => 
      club.category.toLowerCase() === catalogState.category.toLowerCase()
    );
  }

  // 2. Recruitment Status Filter
  if (catalogState.status !== "ALL") {
    results = results.filter(club => club.status === catalogState.status);
  }

  // 3. Search Query Filter (Fuzzy matching on name, acronym, description, tags, domains)
  if (catalogState.searchQuery) {
    const q = catalogState.searchQuery.toLowerCase();
    results = results.filter(club => {
      const matchName = club.name.toLowerCase().includes(q);
      const matchAcronym = (club.acronym || "").toLowerCase().includes(q);
      const matchDesc = club.description.toLowerCase().includes(q);
      const matchTags = (club.tags || []).some(t => t.toLowerCase().includes(q));
      const matchDomains = (club.domains || []).some(d => d.toLowerCase().includes(q));
      return matchName || matchAcronym || matchDesc || matchTags || matchDomains;
    });
  }

  // 4. Sorting
  if (catalogState.sortBy === "name-asc") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else if (catalogState.sortBy === "members-desc") {
    results.sort((a, b) => b.memberCount - a.memberCount);
  } else if (catalogState.sortBy === "newest") {
    results.sort((a, b) => b.established - a.established);
  } else {
    // Recommended default: Featured clubs first, then by member count
    results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.memberCount - a.memberCount;
    });
  }

  // Update counter
  if (countEl) {
    countEl.textContent = results.length;
  }

  // Render cards or empty state
  if (results.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3 class="empty-state-title">No clubs found</h3>
        <p class="empty-state-desc">
          We couldn't find any clubs matching your current search and filters. Try adjusting your search term or reset all filters.
        </p>
        <button type="button" class="btn btn-primary btn-sm" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = results.map(club => {
    const isSaved = typeof Storage !== "undefined" && Storage.isBookmarked(club.id);
    const tagsHtml = (club.tags || []).slice(0, 3).map(t => `<span class="club-card-tag">${escapeHTML(t)}</span>`).join("");

    return `
      <article class="club-card">
        <div class="club-card-banner">
          <img src="${club.banner}" alt="${escapeHTML(club.name)} banner" loading="lazy">
          <div class="club-card-status-badge">
            ${getStatusBadge(club.status)}
          </div>
          <button 
            class="club-card-bookmark-btn ${isSaved ? 'saved' : ''}" 
            data-club-id="${club.id}" 
            title="${isSaved ? 'Remove from saved' : 'Save club'}"
            aria-label="Bookmark club"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
        
        <div class="club-card-body">
          <img src="${club.logo}" alt="${escapeHTML(club.name)} logo" class="club-card-avatar" loading="lazy">
          <div class="club-card-header">
            <div class="club-card-title-row">
              <h3 class="club-card-title">
                <a href="club-details.html?id=${club.id}">${escapeHTML(club.name)}</a>
              </h3>
              ${getVerifiedBadgeSvg()}
            </div>
            <div class="club-card-meta">
              ${getCategoryBadge(club.category)}
              <span class="club-card-stats">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ${club.memberCount} members
              </span>
            </div>
          </div>
          
          <p class="club-card-desc">${escapeHTML(club.tagline)}</p>
          
          <div class="club-card-tags">
            ${tagsHtml}
          </div>
          
          <div class="club-card-footer">
            <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm">View Details</a>
            ${club.status === "OPEN" 
              ? `<a href="club-details.html?id=${club.id}&apply=true" class="btn btn-primary btn-sm">Apply Now</a>` 
              : `<span class="badge badge-status-closed">Recruitment Closed</span>`
            }
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Attach bookmark toggle listeners
  gridContainer.querySelectorAll(".club-card-bookmark-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const clubId = btn.getAttribute("data-club-id");
      if (typeof Storage !== "undefined") {
        const isNowSaved = Storage.toggleBookmark(clubId);
        btn.classList.toggle("saved", isNowSaved);
        btn.title = isNowSaved ? "Remove from saved" : "Save club";
        showToast(isNowSaved ? "Club bookmarked successfully!" : "Club removed from bookmarks", "info");
      }
    });
  });
}

// Reset all filters
function resetAllFilters() {
  catalogState.searchQuery = "";
  catalogState.category = "all";
  catalogState.status = "ALL";
  catalogState.sortBy = "recommended";

  const searchInput = document.getElementById("catalog-search-input");
  if (searchInput) searchInput.value = "";
  toggleSearchClearBtn(false);

  const statusSelect = document.getElementById("status-filter-select");
  if (statusSelect) statusSelect.value = "ALL";

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = "recommended";

  const container = document.getElementById("category-chips-container");
  if (container) {
    container.querySelectorAll(".category-chip").forEach(chip => {
      if (chip.getAttribute("data-category") === "all") chip.classList.add("active");
      else chip.classList.remove("active");
    });
  }

  // Clean URL without reloading
  window.history.replaceState({}, document.title, window.location.pathname);

  applyFiltersAndRender();
}
