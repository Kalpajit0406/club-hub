// js/marketplace.js - Student Campus Marketplace Controller

let currentMarketplace = [];
let selectedCategory = "all";
let searchQuery = "";
let currentSort = "newest";

document.addEventListener("DOMContentLoaded", () => {
  initMarketplacePage();
});

function initMarketplacePage() {
  currentMarketplace = typeof Storage !== "undefined" ? Storage.getMarketplaceItems() : [];
  setupFilterChips();
  setupSearchInput();
  setupSortSelect();
  setupListItemModal();
  setupContactModal();
  renderMarketplace();
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
  const clearBtn = document.getElementById("mkt-search-clear");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = val ? "inline-flex" : "none";
    searchQuery = val.toLowerCase();
    renderMarketplace();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      searchQuery = "";
      clearBtn.style.display = "none";
      renderMarketplace();
      input.focus();
    });
  }
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
    const matchesCat = selectedCategory === "all" || (item.category || "").toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery ||
      (item.title || "").toLowerCase().includes(searchQuery) ||
      (item.description && item.description.toLowerCase().includes(searchQuery)) ||
      (item.sellerName && item.sellerName.toLowerCase().includes(searchQuery)) ||
      (item.location && item.location.toLowerCase().includes(searchQuery));
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
    if (typeof UIStates !== "undefined") {
      UIStates.renderNoResultsState(grid, {
        query: searchQuery || selectedCategory,
        onClear: "resetFilters()"
      });
    } else {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3 class="empty-state-title">No items match your criteria</h3>
          <p class="empty-state-desc">Try adjusting your search terms or selecting another category.</p>
          <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset Filters</button>
        </div>
      `;
    }
    return;
  }

  const mapPinIcon = typeof Icons !== "undefined" ? Icons.render("map-pin", { width: 12, height: 12 }) : "";
  const userIcon = typeof Icons !== "undefined" ? Icons.render("user", { width: 13, height: 13 }) : "";
  const verifiedSvg = typeof getVerifiedBadgeSvg === "function" ? getVerifiedBadgeSvg() : "";

  grid.innerHTML = filtered.map(item => {
    let discountPercent = 0;
    if (item.originalPrice && item.originalPrice > item.price) {
      discountPercent = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
    }

    const itemImage = item.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500";

    return `
      <article class="mkt-card" data-item-id="${item.id}">
        <div class="mkt-img-wrap">
          <img src="${itemImage}" alt="${escapeHTML(item.title)}" class="mkt-img" loading="lazy">
          <span class="mkt-condition-badge">${escapeHTML(item.condition || 'Pre-owned')}</span>
          ${discountPercent > 0 ? `<span class="mkt-discount-badge">${discountPercent}% OFF</span>` : ''}
        </div>

        <div class="mkt-card-body">
          <div class="mkt-price-row">
            <span class="mkt-current-price">₹${item.price.toLocaleString('en-IN')}</span>
            ${item.originalPrice ? `<span class="mkt-orig-price">₹${item.originalPrice.toLocaleString('en-IN')}</span>` : ''}
          </div>

          <h3 class="mkt-item-title">${escapeHTML(item.title)}</h3>
          <p class="mkt-item-desc">${escapeHTML(item.description || 'No description provided.')}</p>

          <div class="mkt-seller-info">
            <div class="mkt-seller-user">
              ${userIcon}
              <span>${escapeHTML(item.sellerName || 'Verified Student')}</span>
              ${verifiedSvg}
            </div>
            <div class="mkt-pickup-loc">
              ${mapPinIcon}
              <span>${escapeHTML(item.location || 'Campus')}</span>
            </div>
          </div>

          <div class="mkt-card-footer">
            <span class="badge badge-outline">${escapeHTML(item.category || 'General')}</span>
            <button class="btn btn-primary btn-sm" onclick="openContactModal('${item.id}')">
              Contact Seller
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function resetFilters() {
  selectedCategory = "all";
  searchQuery = "";
  currentSort = "newest";

  const input = document.getElementById("mkt-search-input");
  if (input) input.value = "";
  const clearBtn = document.getElementById("mkt-search-clear");
  if (clearBtn) clearBtn.style.display = "none";

  const select = document.getElementById("mkt-sort-select");
  if (select) select.value = "newest";

  const chips = document.querySelectorAll(".mkt-chip");
  chips.forEach(c => {
    if ((c.getAttribute("data-category") || "all") === "all") c.classList.add("active");
    else c.classList.remove("active");
  });

  renderMarketplace();
}

function openContactModal(itemId) {
  const item = currentMarketplace.find(i => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById("contact-seller-modal");
  const body = document.getElementById("contact-seller-body");
  if (!modal || !body) return;

  const cleanPhone = (item.sellerPhone || "").replace(/\D/g, "");
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${item.sellerName}, I am contacting you regarding your ClubHub listing: "${item.title}" for ₹${item.price}. Is this item still available?`)}`
    : "#";

  body.innerHTML = `
    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 12px;">
      Inquiring about: <strong style="color: var(--text-primary);">${escapeHTML(item.title)}</strong> (₹${item.price})
    </div>

    <div class="seller-dialog-card">
      <div class="seller-detail-row">
        <strong>Seller Name:</strong>
        <span>${escapeHTML(item.sellerName)} (Verified Student)</span>
      </div>
      <div class="seller-detail-row">
        <strong>Department:</strong>
        <span>${escapeHTML(item.sellerBranch || 'B.Tech Student')}</span>
      </div>
      <div class="seller-detail-row">
        <strong>Campus Meetup:</strong>
        <span>${escapeHTML(item.location || 'Campus Central Library')}</span>
      </div>
      <div class="seller-detail-row">
        <strong>College Email:</strong>
        <a href="mailto:${escapeHTML(item.sellerEmail)}" style="color: var(--primary-color);">${escapeHTML(item.sellerEmail)}</a>
      </div>
      <div class="seller-detail-row">
        <strong>Phone / WhatsApp:</strong>
        <span>${escapeHTML(item.sellerPhone || 'Contact via email')}</span>
      </div>
    </div>

    <div class="callout callout-info" style="margin-bottom: 16px;">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <div><strong>Safety Tip:</strong> Meet in public campus spots like the cafeteria, central library, or departmental lobbies. Inspect the item thoroughly before making payment.</div>
    </div>

    <div class="seller-action-btn-group">
      ${cleanPhone ? `
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="flex: 1; text-align: center; text-decoration: none;">
          Chat on WhatsApp &rarr;
        </a>
      ` : ''}
      <a href="mailto:${escapeHTML(item.sellerEmail)}" class="btn btn-outline" style="flex: 1; text-align: center; text-decoration: none;">
        Send Email
      </a>
    </div>
  `;

  if (typeof modal.showModal === "function") modal.showModal();
  else modal.style.display = "block";
}

function setupContactModal() {
  const modal = document.getElementById("contact-seller-modal");
  const closeBtn = document.getElementById("contact-seller-close");
  if (closeBtn && modal) {
    closeBtn.onclick = () => {
      if (typeof modal.close === "function") modal.close();
      else modal.style.display = "none";
    };
  }
}

function setupListItemModal() {
  const triggerBtn = document.getElementById("list-item-trigger");
  const modal = document.getElementById("list-item-modal");
  const closeBtn = document.getElementById("list-item-close");
  const cancelBtn = document.getElementById("cancel-list-btn");
  const form = document.getElementById("list-item-form");

  if (triggerBtn && modal) {
    triggerBtn.onclick = () => {
      // Pre-fill seller profile if logged in
      if (typeof Storage !== "undefined") {
        const user = Storage.getCurrentUser();
        if (user) {
          const nameInput = document.getElementById("seller-name");
          const branchInput = document.getElementById("seller-branch");
          const emailInput = document.getElementById("seller-email");
          if (nameInput && user.name) nameInput.value = user.name;
          if (branchInput && user.department) branchInput.value = `${user.department} ${user.year || 2}nd Year`;
          if (emailInput && user.email) emailInput.value = user.email;
        }
      }

      if (typeof modal.showModal === "function") modal.showModal();
      else modal.style.display = "block";
    };
  }

  const closeList = () => {
    if (!modal) return;
    if (typeof modal.close === "function") modal.close();
    else modal.style.display = "none";
  };

  if (closeBtn) closeBtn.onclick = closeList;
  if (cancelBtn) cancelBtn.onclick = closeList;

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();

      const title = document.getElementById("item-title").value.trim();
      const category = document.getElementById("item-category").value;
      const condition = document.getElementById("item-condition").value;
      const price = parseFloat(document.getElementById("item-price").value) || 0;
      const origPrice = parseFloat(document.getElementById("item-orig-price").value) || null;
      const location = document.getElementById("item-loc").value.trim();
      const description = document.getElementById("item-desc").value.trim();
      const sellerName = document.getElementById("seller-name").value.trim();
      const sellerBranch = document.getElementById("seller-branch").value.trim();
      const sellerPhone = document.getElementById("seller-phone").value.trim();
      const sellerEmail = document.getElementById("seller-email").value.trim();

      if (!title || !price || !location || !sellerName || !sellerPhone || !sellerEmail) {
        if (typeof UIStates !== "undefined") {
          UIStates.showToast("Please fill in all required listing fields.", "warning");
        }
        return;
      }

      const defaultImages = {
        Books: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
        Equipment: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500",
        Electronics: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500"
      };

      const newItem = {
        id: "item-" + Date.now(),
        title,
        category,
        condition,
        price,
        originalPrice: origPrice,
        location,
        description,
        sellerName,
        sellerBranch,
        sellerPhone,
        sellerEmail,
        image: defaultImages[category] || defaultImages.Books,
        postedDate: new Date().toISOString()
      };

      currentMarketplace.unshift(newItem);
      if (typeof Storage !== "undefined") {
        Storage.saveMarketplaceItems(currentMarketplace);
      }

      closeList();
      form.reset();
      renderMarketplace();

      if (typeof UIStates !== "undefined") {
        UIStates.showToast("Item listed successfully on Campus Marketplace!", "success");
      }
    };
  }
}
