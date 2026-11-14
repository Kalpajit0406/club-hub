// js/network.js - Student Peer Network & Collab Feed Controller

let currentPosts = [];
let selectedTag = "all";

document.addEventListener("DOMContentLoaded", () => {
  initNetworkPage();
});

function initNetworkPage() {
  currentPosts = typeof Storage !== "undefined" ? Storage.getNetworkPosts() : [];
  renderTrendingTopics();
  setupFilterChips();
  setupCreatePostModal();
  renderPosts();
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

function renderTrendingTopics() {
  const container = document.getElementById("net-trending-topics");
  if (!container) return;

  // Calculate tag counts from current posts
  const tagCounts = {};
  currentPosts.forEach(p => {
    if (p.tag) {
      tagCounts[p.tag] = (tagCounts[p.tag] || 0) + 1;
    }
  });

  // Ensure default trending topics
  const defaults = {
    "#HackathonTeam": 12,
    "#SmartIndiaHackathon": 8,
    "#ProjectCollab": 9,
    "#StudyGroup": 5
  };

  const merged = { ...defaults };
  Object.keys(tagCounts).forEach(tag => {
    merged[tag] = (merged[tag] || 0) + tagCounts[tag];
  });

  const sortedTags = Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, 5);

  container.innerHTML = sortedTags.map(([tag, count]) => `
    <div class="net-trend-item">
      <span class="net-trend-tag" onclick="filterByTag('${escapeHTML(tag)}')">${escapeHTML(tag)}</span>
      <span class="net-trend-count">${count} posts</span>
    </div>
  `).join("");
}

function filterByTag(tag) {
  selectedTag = tag;
  const chips = document.querySelectorAll(".net-chip");
  chips.forEach(c => {
    if (c.getAttribute("data-tag") === tag) c.classList.add("active");
    else c.classList.remove("active");
  });
  renderPosts();
}

function renderPosts() {
  const list = document.getElementById("net-feed-list");
  if (!list) return;

  let filtered = currentPosts.filter(p => {
    if (selectedTag === "all") return true;
    return (p.tag || "").toLowerCase() === selectedTag.toLowerCase();
  });

  if (filtered.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderNoResultsState(list, {
        query: selectedTag,
        onClear: "resetTagFilter()"
      });
    } else {
      list.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-state-title">No posts under ${escapeHTML(selectedTag)} yet</h3>
          <p class="empty-state-desc">Be the first campus scholar to initiate a collaboration discussion.</p>
          <button class="btn btn-outline btn-sm" onclick="resetTagFilter()">View All Posts</button>
        </div>
      `;
    }
    return;
  }

  const messageIcon = typeof Icons !== "undefined" ? Icons.render("message-square", { width: 14, height: 14 }) : "";

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
      <article class="net-card" id="post-card-${post.id}">
        <div class="net-card-header">
          <div class="net-author-wrap">
            <img src="${post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" alt="${escapeHTML(post.authorName)}" class="net-avatar" loading="lazy">
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
            ${messageIcon}
            <span>${commentsCount} ${commentsCount === 1 ? 'Reply' : 'Replies'}</span>
          </button>
        </div>

        <!-- Comments Drawer -->
        <div id="comments-box-${post.id}" class="net-comments-box" style="display: none;">
          <div id="comments-list-${post.id}">
            ${commentsHtml}
          </div>

          <form class="net-comment-form" onsubmit="submitComment(event, '${post.id}')">
            <input type="text" class="net-comment-input" id="comment-input-${post.id}" placeholder="Write a supportive reply or connect with author..." required autocomplete="off">
            <button type="submit" class="btn btn-primary btn-sm">Reply</button>
          </form>
        </div>
      </article>
    `;
  }).join("");
}

function resetTagFilter() {
  selectedTag = "all";
  const chips = document.querySelectorAll(".net-chip");
  chips.forEach(c => {
    if ((c.getAttribute("data-tag") || "all") === "all") c.classList.add("active");
    else c.classList.remove("active");
  });
  renderPosts();
}

function handleUpvote(postId) {
  const post = currentPosts.find(p => p.id === postId);
  if (!post) return;

  if (post.userUpvoted) {
    post.upvotes = Math.max(0, (post.upvotes || 1) - 1);
    post.userUpvoted = false;
  } else {
    post.upvotes = (post.upvotes || 0) + 1;
    post.userUpvoted = true;
    if (typeof UIStates !== "undefined") {
      UIStates.showToast("Upvoted post!", "success");
    }
  }

  if (typeof Storage !== "undefined") {
    Storage.saveNetworkPosts(currentPosts);
  }

  renderPosts();
}

function toggleComments(postId) {
  const box = document.getElementById(`comments-box-${postId}`);
  if (!box) return;
  box.style.display = box.style.display === "none" ? "flex" : "none";
}

function submitComment(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`comment-input-${postId}`);
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const post = currentPosts.find(p => p.id === postId);
  if (!post) return;

  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const authorName = user ? user.name : "Aditya Verma";

  if (!post.comments) post.comments = [];
  post.comments.push({
    author: authorName,
    text: text,
    time: "Just now"
  });

  if (typeof Storage !== "undefined") {
    Storage.saveNetworkPosts(currentPosts);
  }

  input.value = "";
  renderPosts();

  // Re-open comment drawer
  const box = document.getElementById(`comments-box-${postId}`);
  if (box) box.style.display = "flex";

  if (typeof UIStates !== "undefined") {
    UIStates.showToast("Reply published!", "info");
  }
}

function setupCreatePostModal() {
  const triggerBtn = document.getElementById("create-post-trigger");
  const modal = document.getElementById("create-post-modal");
  const closeBtn = document.getElementById("create-post-close");
  const cancelBtn = document.getElementById("cancel-post-btn");
  const form = document.getElementById("create-post-form");

  if (triggerBtn && modal) {
    triggerBtn.onclick = () => {
      if (typeof modal.showModal === "function") modal.showModal();
      else modal.style.display = "block";
    };
  }

  const closePost = () => {
    if (!modal) return;
    if (typeof modal.close === "function") modal.close();
    else modal.style.display = "none";
  };

  if (closeBtn) closeBtn.onclick = closePost;
  if (cancelBtn) cancelBtn.onclick = closePost;

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const tag = document.getElementById("post-tag").value;
      const content = document.getElementById("post-content").value.trim();

      if (!tag || !content) {
        if (typeof UIStates !== "undefined") {
          UIStates.showToast("Please provide content for your collaboration post.", "warning");
        }
        return;
      }

      const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;

      const newPost = {
        id: "post-" + Date.now(),
        authorName: user ? user.name : "Aditya Verma",
        authorBranch: user ? `${user.department || 'CSE'} ${user.year || 2}nd Year` : "CSE 2nd Year",
        avatar: user && user.avatar ? user.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        tag: tag,
        content: content,
        timestamp: new Date().toISOString(),
        upvotes: 1,
        userUpvoted: true,
        comments: []
      };

      currentPosts.unshift(newPost);
      if (typeof Storage !== "undefined") {
        Storage.saveNetworkPosts(currentPosts);
      }

      closePost();
      form.reset();
      renderTrendingTopics();
      renderPosts();

      if (typeof UIStates !== "undefined") {
        UIStates.showToast("Collaboration posted successfully to campus feed!", "success");
      }
    };
  }
}
