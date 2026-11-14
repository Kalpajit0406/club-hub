/**
 * js/states.js - Standardized State Management & Micro-UI Helpers for ClubHub
 * Covers: Loading Skeletons, Genuine Empty States, No Search Results, Error Retries & Toasts.
 */

const UIStates = {
  /**
   * Generates shimmer skeleton cards for grid loading
   */
  renderSkeletonCards(count = 6, layout = "grid") {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card" aria-hidden="true">
          <div class="skeleton-banner skeleton-shimmer"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-title skeleton-shimmer"></div>
            <div class="skeleton-line skeleton-text skeleton-shimmer"></div>
            <div class="skeleton-line skeleton-text-short skeleton-shimmer"></div>
            <div class="skeleton-footer">
              <div class="skeleton-tag skeleton-shimmer"></div>
              <div class="skeleton-btn skeleton-shimmer"></div>
            </div>
          </div>
        </div>
      `;
    }
    return html;
  },

  /**
   * Renders a clean, actionable empty state
   */
  renderEmptyState({
    title = "No items available yet",
    description = "New entries will appear here as soon as campus activity starts.",
    icon = "calendar",
    actionText = null,
    actionHref = null,
    actionId = null
  }) {
    const iconSvg = typeof getIcon === "function" ? getIcon(icon, 36) : "";
    const actionBtn = actionText
      ? actionHref
        ? `<a href="${actionHref}" class="btn btn-primary" style="margin-top: 16px;">${actionText}</a>`
        : `<button type="button" id="${actionId || 'empty-state-action'}" class="btn btn-primary" style="margin-top: 16px;">${actionText}</button>`
      : "";

    return `
      <div class="ch-empty-state" role="status">
        <div class="empty-state-icon-wrap">
          ${iconSvg}
        </div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-desc">${description}</p>
        ${actionBtn}
      </div>
    `;
  },

  /**
   * Renders a No Results Found card with quick filter reset
   */
  renderNoResultsState(query = "", onClearAction = "window.location.reload()") {
    const queryDisplay = query ? `matching "<strong>${escapeHtml(query)}</strong>"` : "matching your selected filters";
    return `
      <div class="ch-no-results-state" role="status">
        <div class="no-results-icon-wrap">
          ${typeof getIcon === "function" ? getIcon("search", 32) : "🔍"}
        </div>
        <h3>No matching results found</h3>
        <p>We couldn't find any records ${queryDisplay}. Try adjusting your keywords or clearing the active filters.</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="${onClearAction}" style="margin-top: 14px;">
          ${typeof getIcon === "function" ? getIcon("refresh-cw", 14) : ""}
          Reset All Filters
        </button>
      </div>
    `;
  },

  /**
   * Renders an Error & Retry state
   */
  renderErrorState({
    title = "Unable to load data",
    message = "A network or server error occurred while retrieving campus records.",
    retryFnName = "location.reload()"
  }) {
    return `
      <div class="ch-error-state" role="alert">
        <div class="error-state-icon-wrap">
          ${typeof getIcon === "function" ? getIcon("alert-triangle", 32) : "⚠️"}
        </div>
        <h3>${title}</h3>
        <p>${message}</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="${retryFnName}" style="margin-top: 14px;">
          ${typeof getIcon === "function" ? getIcon("refresh-cw", 14) : ""}
          Retry Request
        </button>
      </div>
    `;
  }
};

/**
 * Toast Notification System
 */
function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("ch-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "ch-toast-container";
    container.className = "ch-toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `ch-toast ch-toast-${type}`;

  const iconName = type === "success" ? "check" : type === "error" ? "alert-triangle" : type === "warning" ? "alert-triangle" : "bell";
  const iconSvg = typeof getIcon === "function" ? getIcon(iconName, 18) : "";

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-body">${escapeHtml(message)}</div>
    <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
  `;

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.add("toast-leaving");
    setTimeout(() => toast.remove(), 200);
  });

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    if (toast.isConnected) {
      toast.classList.add("toast-leaving");
      setTimeout(() => toast.remove(), 200);
    }
  }, duration);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

