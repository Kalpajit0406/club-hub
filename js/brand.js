/**
 * js/brand.js - Central Brand Component Renderer for ClubHub
 * Injects the custom logo & wordmark.
 */

const Brand = {
  getLogoMarkSVG(size = 36) {
    return `
      <img src="assets/brand/logo.svg" alt="ClubHub" style="height: ${size}px; width: auto; object-fit: contain; border-radius: 4px; display: block;" />
    `;
  },

  renderAll() {
    document.querySelectorAll(".nav-brand, .brand-logo").forEach(el => {
      el.innerHTML = `
        <div class="brand-icon-wrap" style="background: transparent; border: none; padding: 0;">
          <img src="assets/brand/logo.svg" alt="ClubHub" style="height: 36px; width: auto; max-height: 40px; object-fit: contain; border-radius: 4px; display: block;" />
        </div>
      `;
    });
  }
};

document.addEventListener("DOMContentLoaded", () => Brand.renderAll());
