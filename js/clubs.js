// js/clubs.js - Catalog, Search, Multi-Filter, Sorting & Micro-UI State Logic

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
  updateLiveDirectoryStats();
  applyFiltersAndRender();
});

// Read initial filters from URL (e.g., clubs.html?category=Technical or ?search=robotics)
function parseURLParameters() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has("search")) {
    catalogState.searchQuery = params.get("search").trim();
    const searchInput = document.getElementById("club-search-input") || document.getElementById("catalog-search-input");
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
    const statusSelect = document.getElementById("status-filter") || document.getElementById("status-filter-select");
    if (statusSelect) statusSelect.value = "OPEN";
  }
}

// Compute and display real-time catalog statistics
function updateLiveDirectoryStats() {
  const statsEl = document.getElementById("catalog-live-stats");
  if (!statsEl || typeof CLUBS_DATA === "undefined") return;

  const totalClubs = CLUBS_DATA.length;
  const openRecruitment = CLUBS_DATA.filter(c => c.status === "OPEN").length;
  const totalMembers = CLUBS_DATA.reduce((sum, c) => sum + (c.memberCount || 0), 0);

  const shieldIcon = typeof Icons !== "undefined" ? Icons.render("shield-check", { width: 15, height: 15 }) : "";
  statsEl.innerHTML = `
    ${shieldIcon}
    <span><strong>${totalClubs}</strong> Recognized Societies &bull; <strong>${openRecruitment}</strong> Recruiting &bull; <strong>${totalMembers.toLocaleString()}+</strong> Members</span>
  `;
}

// Render Category Filter Chips
function renderCategoryChips() {
  const container = document.getElementById("category-chips-list") || document.getElementById("category-chips-container");
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
  const searchInput = document.getElementById("club-search-input") || document.getElementById("catalog-search-input");
  const clearBtn = document.getElementById("search-clear-btn") || document.getElementById("catalog-search-clear");
  const statusSelect = document.getElementById("status-filter") || document.getElementById("status-filter-select");
  const sortSelect = document.getElementById("sort-filter") || document.getElementById("sort-select");
  const resetBtn = document.getElementById("reset-all-filters-btn") || document.getElementById("reset-filters-btn");

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

  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }
}

function toggleSearchClearBtn(show) {
  const clearBtn = document.getElementById("search-clear-btn") || document.getElementById("catalog-search-clear");
  if (clearBtn) {
    clearBtn.style.display = show ? "inline-flex" : "none";
  }
}

// Filter, Sort, and Render Clubs
function applyFiltersAndRender() {
  const gridContainer = document.getElementById("clubs-grid") || document.getElementById("clubs-catalog-grid");
  const countEl = document.getElementById("results-count-number");
  const activeBar = document.getElementById("active-filter-bar");
  const activeLabel = document.getElementById("active-filter-label");

  if (!gridContainer || typeof CLUBS_DATA === "undefined") return;

  let results = [...CLUBS_DATA];

  // 1. Category Filter
  const isCategoryFiltered = catalogState.category && catalogState.category.toLowerCase() !== "all";
  if (isCategoryFiltered) {
    results = results.filter(club => 
      club.category.toLowerCase() === catalogState.category.toLowerCase()
    );
  }

  // 2. Recruitment Status Filter
  const isStatusFiltered = catalogState.status !== "ALL";
  if (isStatusFiltered) {
    results = results.filter(club => club.status === catalogState.status);
  }

  // 3. Search Query Filter (Fuzzy matching on name, acronym, description, tags, domains)
  const isSearchActive = Boolean(catalogState.searchQuery);
  if (isSearchActive) {
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

  // Update active filter banner
  if (activeBar && activeLabel) {
    const hasActiveFilters = isCategoryFiltered || isStatusFiltered || isSearchActive;
    if (hasActiveFilters) {
      activeBar.style.display = "flex";
      let filterDescriptions = [];
      if (isCategoryFiltered) filterDescriptions.push(catalogState.category);
      if (isStatusFiltered) filterDescriptions.push(catalogState.status === "OPEN" ? "Recruiting" : "Closed");
      if (isSearchActive) filterDescriptions.push(`"${catalogState.searchQuery}"`);
      activeLabel.textContent = filterDescriptions.join(" • ");
    } else {
      activeBar.style.display = "none";
    }
  }

  // Update counter
  if (countEl) {
    countEl.textContent = results.length;
  }

  // Render cards or empty state
  if (results.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderNoResultsState(gridContainer, {
        query: catalogState.searchQuery || catalogState.category,
        onClear: "resetAllFilters()"
      });
    } else {
      gridContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3 class="empty-state-title">No clubs found</h3>
          <p class="empty-state-desc">We couldn't find any clubs matching your current search and filters.</p>
          <button type="button" class="btn btn-primary btn-sm" onclick="resetAllFilters()">Reset All Filters</button>
        </div>
      `;
    }
    return;
  }

  const usersIcon = typeof Icons !== "undefined" ? Icons.render("users", { width: 14, height: 14 }) : "";
  const bookmarkIcon = typeof Icons !== "undefined" ? Icons.render("bookmark", { width: 16, height: 16 }) : "";
  const verifiedSvg = typeof getVerifiedBadgeSvg === "function" ? getVerifiedBadgeSvg() : "";

  gridContainer.innerHTML = results.map(club => {
    const isSaved = typeof Storage !== "undefined" && Storage.isBookmarked(club.id);
    const tagsHtml = (club.tags || []).slice(0, 3).map(t => `<span class="club-card-tag">${escapeHTML(t)}</span>`).join("");

    return `
      <article class="club-card">
        <div class="club-card-banner">
          <img src="${club.banner}" alt="${escapeHTML(club.name)} banner" loading="lazy">
          <div class="club-card-status-badge">
            ${typeof getStatusBadge === "function" ? getStatusBadge(club.status) : `<span class="badge">${club.status}</span>`}
          </div>
          <button 
            class="club-card-bookmark-btn ${isSaved ? 'saved' : ''}" 
            data-club-id="${club.id}" 
            title="${isSaved ? 'Remove from saved' : 'Save club'}"
            aria-label="Bookmark club"
          >
            ${bookmarkIcon}
          </button>
        </div>
        
        <div class="club-card-body">
          <img src="${club.logo}" alt="${escapeHTML(club.name)} logo" class="club-card-avatar" loading="lazy">
          <div class="club-card-header">
            <div class="club-card-title-row">
              <h3 class="club-card-title">
                <a href="club-details.html?id=${club.id}">${escapeHTML(club.name)}</a>
              </h3>
              ${verifiedSvg}
            </div>
            <div class="club-card-meta">
              ${typeof getCategoryBadge === "function" ? getCategoryBadge(club.category) : `<span class="badge">${club.category}</span>`}
              <span class="club-card-stats">
                ${usersIcon}
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
        if (typeof UIStates !== "undefined") {
          UIStates.showToast(isNowSaved ? "Club bookmarked successfully!" : "Club removed from bookmarks", "info");
        }
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

  const searchInput = document.getElementById("club-search-input") || document.getElementById("catalog-search-input");
  if (searchInput) searchInput.value = "";
  toggleSearchClearBtn(false);

  const statusSelect = document.getElementById("status-filter") || document.getElementById("status-filter-select");
  if (statusSelect) statusSelect.value = "ALL";

  const sortSelect = document.getElementById("sort-filter") || document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = "recommended";

  const container = document.getElementById("category-chips-list") || document.getElementById("category-chips-container");
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
