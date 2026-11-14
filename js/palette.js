// js/palette.js - Live Theme Color Palette Engine with Real-Time Switcher

const PALETTES = [
  {
    id: "default",
    name: "ClubHub Royal Blue",
    desc: "Default Collegiate SaaS Theme",
    swatches: ["#2563EB", "#1E3A8A", "#BFDBFE", "#F8FAFC"]
  },
  {
    id: "olive-earthy",
    name: "Olive & Earthy",
    desc: "Organic Greens & Warm Umber",
    swatches: ["#717744", "#373D20", "#BCBD8B", "#EFF1ED"]
  },
  {
    id: "solar-blue",
    name: "Solar Blue & Amber",
    desc: "Vibrant Cyan & Sunburst Gold",
    swatches: ["#219EBC", "#023047", "#FB8500", "#8ECAE6"]
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean Gradient",
    desc: "Royal Blue to Aqua Marine",
    swatches: ["#0077B6", "#023E8A", "#00B4D8", "#CAF0F8"]
  },
  {
    id: "nordic-sage",
    name: "Nordic Sage & Pine",
    desc: "Deep Forest Pine & Sage Mist",
    swatches: ["#124559", "#01161E", "#598392", "#AEC3B0"]
  },
  {
    id: "warm-slate",
    name: "Warm Slate & Cream",
    desc: "Oxford Navy & Eggshell Cream",
    swatches: ["#1D2D44", "#0D1321", "#3E5C76", "#748CAB"]
  },
  {
    id: "indigo-steel",
    name: "Indigo Steel Spectrum",
    desc: "Cobalt Engineering Palette",
    swatches: ["#0466C8", "#0353A4", "#002855", "#5C677D"]
  },
  {
    id: "dusk-lavender",
    name: "Dusk & Lavender",
    desc: "Indigo Dusk & Almond Peach",
    swatches: ["#474973", "#161B33", "#A69CAC", "#F1DAC4"]
  },
  {
    id: "oxford-blues",
    name: "Classic Oxford Blues",
    desc: "Prussian Academy & Carolina Blue",
    swatches: ["#1F487E", "#1D3461", "#6290C8", "#829CBC"]
  }
];

const PALETTE_STORAGE_KEY = "clubhub_active_palette";

function getActivePalette() {
  return localStorage.getItem(PALETTE_STORAGE_KEY) || "indigo-steel";
}

function applyPalette(paletteId) {
  if (!paletteId) paletteId = "indigo-steel";
  document.documentElement.setAttribute("data-palette", paletteId);
  localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);

  // Update dots in button if rendered
  updateButtonSwatches(paletteId);

  // Update selected class in dropdown
  document.querySelectorAll(".palette-item").forEach(item => {
    if (item.dataset.paletteId === paletteId) {
      item.classList.add("selected");
    } else {
      item.classList.remove("selected");
    }
  });
}

function updateButtonSwatches(paletteId) {
  const current = PALETTES.find(p => p.id === paletteId) || PALETTES[0];
  const dotsContainer = document.querySelector(".palette-btn-dots");
  if (dotsContainer) {
    dotsContainer.innerHTML = current.swatches
      .slice(0, 3)
      .map(c => `<span class="palette-dot" style="background-color: ${c}"></span>`)
      .join("");
  }
}

function initPaletteEngine() {
  const active = getActivePalette();
  applyPalette(active);
  renderPaletteSwitcher();
}

function renderPaletteSwitcher() {
  if (document.querySelector(".palette-switcher-wrapper")) return;

  const currentId = getActivePalette();
  const current = PALETTES.find(p => p.id === currentId) || PALETTES[0];

  const wrapper = document.createElement("div");
  wrapper.className = "palette-switcher-wrapper";

  const itemsHtml = PALETTES.map(p => `
    <li class="palette-item ${p.id === currentId ? 'selected' : ''}" data-palette-id="${p.id}">
      <div class="palette-item-info">
        <span class="palette-item-name">${p.name}</span>
        <span class="palette-item-sub">${p.desc}</span>
      </div>
      <div class="palette-swatches">
        ${p.swatches.map(c => `<span class="palette-swatch-chip" style="background-color: ${c}" title="${c}"></span>`).join("")}
      </div>
    </li>
  `).join("");

  wrapper.innerHTML = `
    <button type="button" class="palette-btn" title="Choose Live Color Palette" aria-expanded="false">
      <div class="palette-btn-dots">
        ${current.swatches.slice(0, 3).map(c => `<span class="palette-dot" style="background-color: ${c}"></span>`).join("")}
      </div>
      <span>Theme</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="palette-dropdown-menu">
      <div class="palette-dropdown-header">
        <h4>Live Color Palette</h4>
        <p>Real-time theme preview (Coolors)</p>
      </div>
      <ul class="palette-item-list">
        ${itemsHtml}
      </ul>
    </div>
  `;

  // Insert into navbar or fallback
  const navActions = document.querySelector(".nav-actions");
  if (navActions) {
    navActions.insertBefore(wrapper, navActions.firstChild);
  } else {
    wrapper.classList.add("palette-floating-trigger");
    document.body.appendChild(wrapper);
  }

  // Toggle behavior
  const btn = wrapper.querySelector(".palette-btn");
  const menu = wrapper.querySelector(".palette-dropdown-menu");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("active");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Handle item click
  wrapper.querySelectorAll(".palette-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const pId = item.dataset.paletteId;
      applyPalette(pId);
      menu.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
      if (typeof showToast === "function") {
        const pObj = PALETTES.find(p => p.id === pId);
        showToast(`Theme switched to ${pObj.name}`, "info");
      }
    });
  });

  // Close on outside click
  document.addEventListener("click", () => {
    menu.classList.remove("active");
    btn.setAttribute("aria-expanded", "false");
  });
}

// Auto-initialize when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPaletteEngine);
} else {
  initPaletteEngine();
}

