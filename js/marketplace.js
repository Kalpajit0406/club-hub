// js/marketplace.js - Student Campus Marketplace Controller

let currentMarketplace = [];
let selectedCategory = "all";
let searchQuery = "";
let currentSort = "newest";

document.addEventListener("DOMContentLoaded", () => {
  initMarketplacePage();
});

function initMarketplacePage() {
  currentMarketplace = Storage.getMarketplaceItems();
  renderMarketplace();
  setupFilterChips();
  setupSearchInput();
  setupSortSelect();
  setupListItemModal();
  setupContactModal();
}

function setupFilterChips() {
  const chips = document.querySelectorAll(".mkt-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedCategory = chip.getAttribute("data-category") || "all";
      renderMarketplace();
    });
  });
}

function setupSearchInput() {
  const input = document.getElementById("mkt-search-input");
  if (!input) return;

  input.addEventListener("input", debounce((e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderMarketplace();
  }, 200));
}

function setupSortSelect() {
  const select = document.getElementById("mkt-sort-select");
  if (!select) return;

  select.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderMarketplace();
  });
}

function renderMarketplace() {
  const grid = document.getElementById("mkt-grid");
  const countEl = document.getElementById("mkt-count-badge");
  if (!grid) return;

  let filtered = currentMarketplace.filter(item => {
    const matchesCat = selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery) ||
      (item.description && item.description.toLowerCase().includes(searchQuery)) ||
      (item.sellerName && item.sellerName.toLowerCase().includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  // Sorting
  if (currentSort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    // Newest
    filtered.sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0));
  }

  if (countEl) {
    countEl.textContent = `${filtered.length} Items Listed`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 64px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <h3 style="font-size: 18px; margin-bottom: 6px;">No campus items match your criteria</h3>
        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">Try adjusting your search terms or selecting another category.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    let discountPercent = 0;
    if (item.originalPrice && item.originalPrice > item.price) {
      discountPercent = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
    }

    return `
      <div class="mkt-card" data-item-id="${item.id}">
        <div class="mkt-img-wrap">
          <img src="${item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'}" alt="${escapeHTML(item.title)}" class="mkt-img" loading="lazy">
          <span class="mkt-condition-badge">${escapeHTML(item.condition || 'Good')}</span>
          <span class="mkt-cat-badge">${escapeHTML(item.category)}</span>
        </div>

        <div class="mkt-card-body">
          <div class="mkt-price-row">
            <span class="mkt-price">₹${item.price}</span>
            ${item.originalPrice ? `<span class="mkt-original-price">₹${item.originalPrice}</span>` : ''}
            ${discountPercent > 0 ? `<span class="mkt-discount-badge">${discountPercent}% OFF</span>` : ''}
          </div>

          <h3 class="mkt-title">${escapeHTML(item.title)}</h3>
          <p class="mkt-desc">${escapeHTML(item.description || '')}</p>

          <div class="mkt-seller-meta">
            <div class="mkt-seller-info">
              <span class="mkt-seller-name">${escapeHTML(item.sellerName || 'Verified Student')}</span>
              <span class="mkt-seller-loc">${escapeHTML(item.location || 'Campus Canteen')}</span>
            </div>

            <button class="btn btn-outline btn-sm" onclick="openContactModal('${item.id}')">
              Contact
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function resetFilters() {
  selectedCategory = "all";
  searchQuery = "";
  const input = document.getElementById("mkt-search-input");
  if (input) input.value = "";
  document.querySelectorAll(".mkt-chip").forEach(c => {
    if (c.getAttribute("data-category") === "all") c.classList.add("active");
    else c.classList.remove("active");
  });
  renderMarketplace();
}

// ---------------- CONTACT SELLER MODAL ----------------
function setupContactModal() {
  const modal = document.getElementById("contact-seller-modal");
  const closeBtn = document.getElementById("contact-seller-close");
  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

function openContactModal(itemId) {
  const item = currentMarketplace.find(i => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById("contact-seller-modal");
  const body = document.getElementById("contact-seller-body");

  const cleanPhone = (item.sellerPhone || "").replace(/[^0-9]/g, "");
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(item.sellerName)},%20I%20am%20interested%20in%20buying%20your%20'${encodeURIComponent(item.title)}'%20listed%20on%20ClubHub.` : "#";

  body.innerHTML = `
    <div style="display: flex; gap: 16px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 16px;">
      <img src="${item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" alt="${escapeHTML(item.title)}" style="width: 64px; height: 64px; border-radius: var(--radius-sm); object-fit: cover;">
      <div>
        <h4 style="margin: 0 0 4px 0; font-size: 15px; color: var(--text-main); font-family: 'Plus Jakarta Sans', sans-serif;">${escapeHTML(item.title)}</h4>
        <div style="font-size: 16px; font-weight: 800; color: var(--primary);">₹${item.price}</div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--text-muted);">Seller:</span>
        <span style="font-weight: 600; color: var(--text-main);">${escapeHTML(item.sellerName)} (${escapeHTML(item.sellerBranch || 'TINT Student')})</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--text-muted);">Campus Pickup:</span>
        <span style="font-weight: 600; color: var(--text-main);">${escapeHTML(item.location || 'College Library / Canteen')}</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--text-muted);">Phone / WhatsApp:</span>
        <span style="font-weight: 600; font-family: monospace;">${escapeHTML(item.sellerPhone || '+91 98765 00000')}</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--text-muted);">College Email:</span>
        <span style="font-weight: 600;">${escapeHTML(item.sellerEmail || 'student@tint.edu.in')}</span>
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 24px;">
      ${cleanPhone ? `
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="flex: 1; text-align: center; background: #25D366; border-color: #25D366; color: #FFFFFF;">
          💬 Chat on WhatsApp
        </a>
      ` : ''}
      <a href="mailto:${item.sellerEmail}?subject=ClubHub Inquiry: ${encodeURIComponent(item.title)}" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;">
        ✉️ Email Seller
      </a>
    </div>
  `;

  modal.style.display = "flex";
}

// ---------------- LIST ITEM MODAL ----------------
function setupListItemModal() {
  const openBtn = document.getElementById("list-item-trigger");
  const modal = document.getElementById("list-item-modal");
  const form = document.getElementById("list-item-form");
  const closeBtn = document.getElementById("list-item-close");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    const user = Storage.getCurrentUser();
    if (user) {
      document.getElementById("seller-name").value = user.name || "";
      document.getElementById("seller-email").value = user.email || "";
      document.getElementById("seller-branch").value = `${user.branch || 'Engineering'} (${user.year || '2nd Year'})`;
    }
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

    const title = document.getElementById("item-title").value.trim();
    const category = document.getElementById("item-category").value;
    const condition = document.getElementById("item-condition").value;
    const price = parseInt(document.getElementById("item-price").value) || 0;
    const originalPrice = parseInt(document.getElementById("item-orig-price").value) || null;
    const description = document.getElementById("item-desc").value.trim();
    const location = document.getElementById("item-loc").value.trim();
    const sellerName = document.getElementById("seller-name").value.trim();
    const sellerPhone = document.getElementById("seller-phone").value.trim();
    const sellerEmail = document.getElementById("seller-email").value.trim();
    const sellerBranch = document.getElementById("seller-branch").value.trim();

    // Default image based on category
    let image = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500";
    if (category === "Electronics") {
      image = "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500";
    } else if (category === "Equipment") {
      image = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500";
    }

    Storage.addMarketplaceItem({
      title,
      category,
      condition,
      price,
      originalPrice,
      description,
      location,
      sellerName,
      sellerPhone,
      sellerEmail,
      sellerBranch,
      image
    });

    currentMarketplace = Storage.getMarketplaceItems();
    renderMarketplace();
    modal.style.display = "none";
    form.reset();
    showToast("Your item has been listed on the Campus Marketplace!", "success");
  });
}

