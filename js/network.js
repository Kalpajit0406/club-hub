// js/network.js - Student Peer Network & Collab Feed Controller

let currentPosts = [];
let selectedTag = "all";

document.addEventListener("DOMContentLoaded", () => {
  initNetworkPage();
});

function initNetworkPage() {
  currentPosts = Storage.getNetworkPosts();
  renderPosts();
  setupFilterChips();
  setupCreatePostModal();
}

function setupFilterChips() {
  const chips = document.querySelectorAll(".net-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedTag = chip.getAttribute("data-tag") || "all";
      renderPosts();
    });
  });
}

function renderPosts() {
  const list = document.getElementById("net-feed-list");
  if (!list) return;

  let filtered = currentPosts.filter(p => {
    if (selectedTag === "all") return true;
    return p.tag.toLowerCase() === selectedTag.toLowerCase();
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <h3 style="font-size: 16px; margin-bottom: 6px;">No posts under ${escapeHTML(selectedTag)} yet</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 14px;">Be the first campus scholar to initiate a collaboration discussion.</p>
        <button class="btn btn-outline btn-sm" onclick="resetTagFilter()">View All Posts</button>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(post => {
    const d = new Date(post.timestamp);
    const timeFormatted = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const commentsCount = (post.comments || []).length;

    const commentsHtml = (post.comments || []).map(c => `
      <div class="net-comment-item">
        <div class="net-comment-meta">
          <span class="net-comment-author">${escapeHTML(c.author)}</span>
          <span class="net-comment-time">${escapeHTML(c.time || 'Recently')}</span>
        </div>
        <div>${escapeHTML(c.text)}</div>
      </div>
    `).join("");

    return `
      <div class="net-card" id="post-card-${post.id}">
        <div class="net-card-header">
          <div class="net-author-wrap">
            <img src="${post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" alt="${escapeHTML(post.authorName)}" class="net-avatar">
            <div class="net-author-info">
              <span class="net-author-name">${escapeHTML(post.authorName)}</span>
              <span class="net-author-meta">${escapeHTML(post.authorBranch || 'TINT Student')} &bull; ${timeFormatted}</span>
            </div>
          </div>
          <span class="net-tag-pill">${escapeHTML(post.tag)}</span>
        </div>

        <div class="net-body">${escapeHTML(post.content)}</div>

        <div class="net-card-actions">
          <button class="net-action-btn ${post.userUpvoted ? 'upvoted' : ''}" onclick="handleUpvote('${post.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            <span>${post.upvotes || 0} Upvotes</span>
          </button>

          <button class="net-action-btn" onclick="toggleComments('${post.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>${commentsCount} ${commentsCount === 1 ? 'Comment' : 'Comments'}</span>
          </button>
        </div>

        <!-- Comments Drawer -->
        <div id="comments-box-${post.id}" class="net-comments-box" style="display: none;">
          <div id="comments-list-${post.id}">
            ${commentsHtml}
          </div>

          <form class="net-comment-form" onsubmit="submitComment(event, '${post.id}')">
            <input type="text" class="net-comment-input" id="comment-input-${post.id}" placeholder="Write a supportive reply or connect with author..." required>
            <button type="submit" class="btn btn-primary btn-sm">Reply</button>
          </form>
        </div>
      </div>
    `;
  }).join("");
}

function resetTagFilter() {
  selectedTag = "all";
  document.querySelectorAll(".net-chip").forEach(c => {
    if (c.getAttribute("data-tag") === "all") c.classList.add("active");
    else c.classList.remove("active");
  });
  renderPosts();
}

function handleUpvote(postId) {
  const updated = Storage.togglePostUpvote(postId);
  if (updated) {
    currentPosts = Storage.getNetworkPosts();
    renderPosts();
  }
}

function toggleComments(postId) {
  const box = document.getElementById(`comments-box-${postId}`);
  if (!box) return;
  box.style.display = box.style.display === "none" ? "block" : "none";
}

function submitComment(e, postId) {
  e.preventDefault();
  const input = document.getElementById(`comment-input-${postId}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const user = Storage.getCurrentUser();
  const authorName = user ? user.name : "Peer Scholar";

  Storage.addPostComment(postId, {
    author: authorName,
    text
  });

  currentPosts = Storage.getNetworkPosts();
  renderPosts();
  // Keep comments drawer open
  const box = document.getElementById(`comments-box-${postId}`);
  if (box) box.style.display = "block";
  showToast("Comment posted to campus feed!", "success");
}

// ---------------- CREATE POST MODAL ----------------
function setupCreatePostModal() {
  const openBtn = document.getElementById("create-post-trigger");
  const modal = document.getElementById("create-post-modal");
  const form = document.getElementById("create-post-form");
  const closeBtn = document.getElementById("create-post-close");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
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

    const tag = document.getElementById("post-tag").value;
    const content = document.getElementById("post-content").value.trim();
    const user = Storage.getCurrentUser();

    Storage.createNetworkPost({
      authorName: user ? user.name : "Aditya Verma",
      authorRoll: user ? user.roll : "2023CSB1042",
      authorBranch: user ? `${user.branch} (${user.year})` : "CSE 2nd Year",
      avatar: user && user.avatar ? user.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      tag,
      content
    });

    currentPosts = Storage.getNetworkPosts();
    renderPosts();
    modal.style.display = "none";
    form.reset();
    showToast("Your post is live on the Student Collab Feed!", "success");
  });
}

