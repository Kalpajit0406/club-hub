/**
 * js/brand.js - Central Brand Component Renderer for ClubHub
 * Injects the custom geometric Connected-Node logo mark & typography.
 */

const Brand = {
  getLogoMarkSVG(size = 36) {
    return `
      <svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" class="ch-brand-mark" aria-hidden="true">
        <defs>
          <linearGradient id="chBrandGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#2F5BE7"/>
            <stop offset="100%" stop-color="#1D4ED8"/>
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#0B1220"/>
        <rect width="48" height="48" rx="12" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5"/>
        <path d="M 24 11 C 15 11 11 16 11 24 C 11 32 15 37 24 37" stroke="url(#chBrandGrad)" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M 19 24 L 33 24 M 33 13 L 33 35" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="24" cy="11" r="3.5" fill="#2F5BE7" stroke="#FFFFFF" stroke-width="1.8"/>
        <circle cx="24" cy="37" r="3.5" fill="#0F766E" stroke="#FFFFFF" stroke-width="1.8"/>
        <circle cx="19" cy="24" r="2.75" fill="#F4B544" stroke="#0B1220" stroke-width="1.5"/>
        <circle cx="33" cy="24" r="3" fill="#2F5BE7" stroke="#FFFFFF" stroke-width="1.8"/>
      </svg>
    `;
  },

  renderAll() {
    document.querySelectorAll(".nav-brand, .brand-logo").forEach(el => {
      el.innerHTML = `
        <div class="brand-icon-wrap">
          ${this.getLogoMarkSVG(34)}
        </div>
        <div class="brand-text">
          <span class="brand-title">Club<span class="brand-accent">Hub</span></span>
          <span class="brand-sub">Campus OS</span>
        </div>
      `;
    });
  }
};

document.addEventListener("DOMContentLoaded", () => Brand.renderAll());

