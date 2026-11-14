// js/network.js - Student Peer Network & Collab Feed Controller

let selectedTag = "all";

document.addEventListener("DOMContentLoaded", async () => {
  setupFilterChips();
  setupCreatePostModal();
  await loadAndRenderPosts();
});

function setupFilterChips() {
  const chips = document.querySelectorAll(".net-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedTag = chip.getAttribute("data-tag") || "all";
      loadAndRenderPosts();
    });
  });
}

async function loadAndRenderPosts() {
  const list = document.getElementById("net-feed-list");
  if (!list) return;

  list.innerHTML = `
    <div style="text-align: center; padding: 48px; color: var(--text-secondary);">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
      <div>Loading discussions...</div>
    </div>
  `;

  try {
    const posts = await API.getNetworkPosts({ tag: selectedTag });

    if (!posts || posts.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
          <div style="font-size: 36px; margin-bottom: 12px;">💬</div>
          <h3 style="font-size: 18px; margin: 0 0 8px; color: var(--text-main); font-weight: 700;">No discussions yet</h3>
          <p style="color: var(--text-secondary); font-size: 14px; margin: 0 auto 20px; max-width: 420px;">
            Be the first campus scholar to initiate a project collaboration, form a study group, or find hackathon teammates!
          </p>
          <button type="button" class="btn btn-cta btn-sm" onclick="openCreatePostModal()">
            Start a Discussion
          </button>
        </div>
      `;
      return;
    }

    list.innerHTML = posts.map(post => {
      const author = post.author || {};
      const authorName = author.full_name || "Campus Peer";
      const authorDept = author.department ? `${author.department} (${author.year} Year)` : "Collegiate Engineering";
      const authorInitials = authorName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "CP";
      const timeStr = new Date(post.created_at).toLocaleDateString([], { month: "short", day: "numeric" });
      const upvoted = post.has_upvoted;

      return `
        <article class="net-post-card" id="post-${post.id}" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 22px; margin-bottom: 16px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">
                ${escapeHTML(authorInitials)}
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text-main); font-size: 15px;">${escapeHTML(authorName)}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${escapeHTML(authorDept)} &bull; ${timeStr}</div>
              </div>
            </div>
            <span class="badge" style="font-size: 11px;">${escapeHTML(post.tag)}</span>
          </div>

          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; margin: 0 0 8px; color: var(--text-main);">
            ${escapeHTML(post.title)}
          </h3>

          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px;">
            ${escapeHTML(post.content)}
          </p>

          <div style="display: flex; gap: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
            <button 
              type="button" 
              class="btn btn-outline btn-sm ${upvoted ? 'btn-primary' : ''}" 
              onclick="handleUpvote(${post.id})"
              style="display: inline-flex; align-items: center; gap: 6px;"
            >
              ▲ <span>${post.upvotes_count}</span> Upvotes
            </button>
            <button 
              type="button" 
              class="btn btn-outline btn-sm" 
              onclick="toggleCommentsDrawer(${post.id})"
              style="display: inline-flex; align-items: center; gap: 6px;"
            >
              💬 <span id="comments-count-${post.id}">${post.comments_count || 0}</span> Comments
            </button>
          </div>

          <!-- Comments Drawer -->
          <div id="comments-drawer-${post.id}" style="display: none; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 14px;">
            <div id="comments-list-${post.id}" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
              <div style="font-size: 12px; color: var(--text-muted);">Loading comments...</div>
            </div>

            <form onsubmit="handleAddComment(event, ${post.id})" style="display: flex; gap: 8px;">
              <input type="text" id="comment-input-${post.id}" class="form-input" placeholder="Write a constructive reply..." required style="height: 38px;">
              <button type="submit" class="btn btn-primary btn-sm">Reply</button>
            </form>
          </div>
        </article>
      `;
    }).join("");

  } catch (err) {
    list.innerHTML = `
      <div style="text-align: center; color: var(--danger); padding: 36px;">
        Failed to load feed: ${escapeHTML(err.message)}
        <div style="margin-top: 10px;"><button class="btn btn-outline btn-sm" onclick="loadAndRenderPosts()">Retry</button></div>
      </div>
    `;
  }

  if (typeof Storage !== "undefined") {
    Storage.saveNetworkPosts(currentPosts);
  }

  renderPosts();
}

async function handleUpvote(postId) {
  const user = requireAuth();
  if (!user) return;

  try {
    await API.toggleUpvote(postId);
    await loadAndRenderPosts();
  } catch (err) {
    showToast(err.message || "Could not upvote.", "error");
  }
}

async function toggleCommentsDrawer(postId) {
  const drawer = document.getElementById(`comments-drawer-${postId}`);
  if (!drawer) return;

  if (drawer.style.display === "none") {
    drawer.style.display = "block";
    await loadPostComments(postId);
  } else {
    drawer.style.display = "none";
  }
}

async function loadPostComments(postId) {
  const container = document.getElementById(`comments-list-${postId}`);
  if (!container) return;

  try {
    const comments = await API.getComments(postId);
    if (!comments || comments.length === 0) {
      container.innerHTML = `<div style="font-size: 12px; color: var(--text-muted);">No replies yet. Be the first to reply!</div>`;
      return;
    }

    container.innerHTML = comments.map(c => {
      const a = c.author || {};
      const authorName = a.full_name || "Peer";
      const timeStr = new Date(c.created_at).toLocaleDateString([], { month: "short", day: "numeric" });
      return `
        <div style="background: var(--bg-surface); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: var(--text-main);">${escapeHTML(authorName)}</strong>
            <span style="font-size: 11px; color: var(--text-muted);">${timeStr}</span>
          </div>
          <div style="color: var(--text-secondary);">${escapeHTML(c.content)}</div>
        </div>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<div style="font-size: 12px; color: var(--danger);">Failed to load comments.</div>`;
  }
}

async function handleAddComment(e, postId) {
  e.preventDefault();
  const user = requireAuth();
  if (!user) return;

  const input = document.getElementById(`comment-input-${postId}`);
  if (!input || !input.value.trim()) return;

  const content = input.value.trim();

  try {
    await API.addComment(postId, content);
    input.value = "";
    showToast("Reply published!", "success");
    await loadPostComments(postId);

    const countEl = document.getElementById(`comments-count-${postId}`);
    if (countEl) {
      const cur = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = cur + 1;
    }
  } catch (err) {
    showToast(err.message || "Failed to post comment.", "error");
  }
}

// ---------------- CREATE POST MODAL ----------------
function setupCreatePostModal() {
  const trigger = document.getElementById("create-post-trigger");
  const modal = document.getElementById("create-post-modal");
  const closeBtn = document.getElementById("create-post-close");
  const form = document.getElementById("create-post-form");

  if (trigger) trigger.addEventListener("click", openCreatePostModal);
  if (closeBtn && modal) closeBtn.addEventListener("click", () => { modal.style.display = "none"; });

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = requireAuth();
      if (!user) return;

      const title = document.getElementById("post-title-input").value.trim();
      const tag = document.getElementById("post-tag-select").value;
      const content = document.getElementById("post-content-input").value.trim();
      const submitBtn = form.querySelector("button[type='submit']");

      if (!title || !content) {
        showToast("Please fill in both title and content.", "error");
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Publishing...";
        }

        await API.createNetworkPost({ title, tag, content });
        showToast("Collaboration post published to feed!", "success");
        if (modal) modal.style.display = "none";
        form.reset();
        await loadAndRenderPosts();

      } catch (err) {
        showToast(err.message || "Failed to publish post.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "Publish Discussion";
        }
      }
    });
  }
}

function openCreatePostModal() {
  const user = requireAuth();
  if (!user) return;

  const modal = document.getElementById("create-post-modal");
  if (modal) modal.style.display = "flex";
}
