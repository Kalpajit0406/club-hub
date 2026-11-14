// js/home.js - Logic for Landing Page (index.html)

document.addEventListener("DOMContentLoaded", () => {
  renderFeaturedClubs();
  initHeroSearch();
});

// Render featured clubs with semantic action buttons & clean SVGs
function renderFeaturedClubs() {
  const container = document.getElementById("home-featured-clubs-grid") || document.getElementById("featured-clubs-grid");
  if (!container || typeof CLUBS_DATA === "undefined") return;

  const featured = CLUBS_DATA.filter(club => club.featured).slice(0, 3);
  const clubsToRender = featured.length > 0 ? featured : CLUBS_DATA.slice(0, 3);

  const usersIcon = typeof Icons !== "undefined" ? Icons.render("users", { width: 14, height: 14 }) : "";
  const bookmarkIcon = typeof Icons !== "undefined" ? Icons.render("bookmark", { width: 16, height: 16 }) : "";
  const verifiedSvg = typeof getVerifiedBadgeSvg === "function" ? getVerifiedBadgeSvg() : "";

  container.innerHTML = clubsToRender.map(club => {
    const isSaved = typeof Storage !== "undefined" && Storage.isBookmarked(club.id);
    const tagsHtml = (club.tags || []).slice(0, 3).map(t => `<span class="club-card-tag">${escapeHTML(t)}</span>`).join("");

    return `
      <article class="club-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-card); overflow: hidden; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
        <div style="height: 140px; position: relative; overflow: hidden; background: var(--bg-surface);">
          <img src="${club.banner}" alt="${escapeHTML(club.name)} banner" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
          <div style="position: absolute; top: 12px; left: 12px; z-index: 2;">
            ${typeof getStatusBadge === "function" ? getStatusBadge(club.status) : `<span class="badge">${club.status}</span>`}
          </div>
          <button 
            type="button"
            class="club-card-bookmark-btn ${isSaved ? 'saved' : ''}" 
            data-club-id="${club.id}" 
            title="${isSaved ? 'Remove from saved' : 'Save club'}"
            aria-label="Bookmark club"
            style="position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer;"
          >
            ${bookmarkIcon}
          </button>
        </div>
        
        <div style="padding: 0 20px 20px; position: relative; display: flex; flex-direction: column; flex: 1;">
          <img src="${club.logo}" alt="${escapeHTML(club.name)} logo" style="width: 58px; height: 58px; border-radius: var(--radius-md); border: 3px solid var(--bg-card); box-shadow: var(--shadow-sm); background: #FFFFFF; object-fit: cover; margin-top: -29px; margin-bottom: 12px; position: relative; z-index: 3;" loading="lazy">
          
          <div style="margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-primary);">
                <a href="club-details.html?id=${club.id}" style="color: inherit; text-decoration: none;">${escapeHTML(club.name)}</a>
              </h3>
              ${verifiedSvg}
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 0.8125rem; color: var(--text-secondary);">
              ${typeof getCategoryBadge === "function" ? getCategoryBadge(club.category) : `<span class="badge">${club.category}</span>`}
              <span style="display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted);">
                ${usersIcon}
                ${club.memberCount} members
              </span>
            </div>
          </div>
          
          <p style="font-size: 0.875rem; line-height: 1.55; color: var(--text-secondary); margin: 0 0 16px; flex: 1;">${escapeHTML(club.tagline)}</p>
          
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px;">
            ${tagsHtml}
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; border-top: 1px solid var(--border-color); margin-top: auto;">
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

  attachBookmarkListeners(container);
}

// Hero Search form submission
function initHeroSearch() {
  const searchForm = document.querySelector(".hero-search-wrap") || document.getElementById("hero-search-form");
  const searchInput = document.querySelector(".hero-search-input") || document.getElementById("hero-search-input");

  if (!searchForm || !searchInput) return;

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `clubs.html?search=${encodeURIComponent(query)}`;
    } else {
      window.location.href = "clubs.html";
    }
  });
}

// Bookmark click delegation
function attachBookmarkListeners(container) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".club-card-bookmark-btn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const clubId = btn.getAttribute("data-club-id");
    if (!clubId || typeof Storage === "undefined") return;

    const isNowSaved = Storage.toggleBookmark(clubId);
    btn.classList.toggle("saved", isNowSaved);
    btn.setAttribute("title", isNowSaved ? "Remove from saved" : "Save club");

    const club = (typeof CLUBS_DATA !== "undefined" ? CLUBS_DATA : []).find(c => c.id === clubId);
    const clubName = club ? club.name : "Society";
    
    if (typeof UIStates !== "undefined") {
      UIStates.showToast(
        isNowSaved ? `Added ${clubName} to your saved societies.` : `Removed ${clubName} from saved list.`,
        "info"
      );
    }
  });
}
