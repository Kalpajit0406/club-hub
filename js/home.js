// js/home.js - Logic for Landing Page (index.html)

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderFeaturedClubs();
  initHeroSearch();
});

// Render category cards with dynamic club count
function renderCategories() {
  const container = document.getElementById("categories-grid");
  if (!container || typeof CATEGORIES === "undefined" || typeof CLUBS_DATA === "undefined") return;

  // Filter out the 'all' category for the home category cards
  const displayCats = CATEGORIES.filter(c => c.id !== "all");

  const iconsMap = {
    "Technical": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    "Cultural": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    "Sports": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M14.83 9.17l4.24-4.24"/><path d="M4.93 19.07l4.24-4.24"/></svg>`,
    "Literary": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    "Social": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    "Entrepreneurship": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`
  };

  container.innerHTML = displayCats.map(cat => {
    const count = CLUBS_DATA.filter(club => club.category === cat.id).length;
    const icon = iconsMap[cat.id] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
    return `
      <a href="clubs.html?category=${encodeURIComponent(cat.id)}" class="category-card" title="Browse ${cat.name}">
        <div class="category-icon-box">
          ${icon}
        </div>
        <div class="category-name">${escapeHTML(cat.name)}</div>
        <div class="category-count">${count} Active ${count === 1 ? 'Club' : 'Clubs'}</div>
      </a>
    `;
  }).join("");
}

// Render 3 featured clubs
function renderFeaturedClubs() {
  const container = document.getElementById("featured-clubs-grid");
  if (!container || typeof CLUBS_DATA === "undefined") return;

  const featured = CLUBS_DATA.filter(club => club.featured).slice(0, 3);

  container.innerHTML = featured.map(club => {
    const isSaved = typeof Storage !== "undefined" && Storage.isBookmarked(club.id);
    const tagsHtml = club.tags.slice(0, 3).map(t => `<span class="club-card-tag">${escapeHTML(t)}</span>`).join("");

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
  container.querySelectorAll(".club-card-bookmark-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const clubId = btn.getAttribute("data-club-id");
      if (typeof Storage !== "undefined") {
        const isNowSaved = Storage.toggleBookmark(clubId);
        btn.classList.toggle("saved", isNowSaved);
        btn.title = isNowSaved ? "Remove from saved" : "Save club";
        showToast(isNowSaved ? "Club saved to your bookmarks!" : "Club removed from bookmarks", "info");
      }
    });
  });
}

// Hero Search form submission
function initHeroSearch() {
  const form = document.getElementById("hero-search-form");
  const input = document.getElementById("hero-search-input");

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      window.location.href = `clubs.html?search=${encodeURIComponent(query)}`;
    } else {
      window.location.href = `clubs.html`;
    }
  });
}
