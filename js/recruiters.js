// js/recruiters.js - Campus Placement & Recruiter Portal Controller

let currentJobs = [];
let searchQuery = "";
let activeJobId = null;

document.addEventListener("DOMContentLoaded", () => {
  initRecruitersPage();
});

function initRecruitersPage() {
  currentJobs = Storage.getJobs();
  renderJobs();
  setupSearchInput();
  setupApplyModal();
}

function setupSearchInput() {
  const input = document.getElementById("job-search-input");
  if (!input) return;

  input.addEventListener("input", debounce((e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderJobs();
  }, 200));
}

function renderJobs() {
  const grid = document.getElementById("job-grid");
  const countEl = document.getElementById("job-count-badge");
  if (!grid) return;

  let filtered = currentJobs.filter(job => {
    if (!searchQuery) return true;
    return job.company.toLowerCase().includes(searchQuery) ||
      job.role.toLowerCase().includes(searchQuery) ||
      job.location.toLowerCase().includes(searchQuery) ||
      (job.skills && job.skills.some(s => s.toLowerCase().includes(searchQuery)));
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} Openings Active`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 64px 20px; background: var(--bg-card); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--primary); opacity: 0.85; margin-bottom: 12px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        <h3 style="font-size: 18px; margin-bottom: 6px;">No internship openings match your search</h3>
        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">Try searching by company name (Microsoft, Google, TCS) or role keywords.</p>
        <button class="btn btn-outline btn-sm" onclick="resetJobSearch()">View All Openings</button>
      </div>
    `;
    return;
  }

  const applications = Storage.getJobApplications();
  const user = Storage.getCurrentUser();
  const userEmail = user ? user.email : "";

  grid.innerHTML = filtered.map(job => {
    const hasApplied = userEmail && applications.some(a => a.jobId === job.id && a.studentEmail === userEmail);
    const skillsHtml = (job.skills || []).map(s => `<span class="job-skill-chip">${escapeHTML(s)}</span>`).join("");

    return `
      <div class="job-card" data-job-id="${job.id}">
        <div class="job-top-row">
          <img src="${job.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120'}" alt="${escapeHTML(job.company)}" class="job-company-logo">
          <div class="job-title-info">
            <h3>${escapeHTML(job.role)}</h3>
            <span class="job-company-name">${escapeHTML(job.company)}</span>
          </div>
        </div>

        <div class="job-stipend-badge">
          <span>💰</span>
          <span>${escapeHTML(job.stipend || 'Competitive Stipend')}</span>
        </div>

        <div class="job-details-meta">
          <div class="job-meta-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHTML(job.location)} &bull; ${escapeHTML(job.duration || '2-3 Months')}</span>
          </div>
          <div class="job-meta-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Criteria: <strong>${escapeHTML(job.eligibility || 'All Engineering Branches')}</strong></span>
          </div>
        </div>

        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${escapeHTML(job.description || '')}
        </p>

        <div class="job-skills-wrap">
          ${skillsHtml}
        </div>

        <div class="job-card-footer">
          <div class="job-deadline">
            Deadline: <strong>${formatDate(job.deadline)}</strong>
          </div>

          ${hasApplied ? `
            <button class="btn btn-outline btn-sm" disabled style="color: var(--success); border-color: var(--success);">
              ✓ Applied
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="openApplyModal('${job.id}')">
              Apply Now
            </button>
          `}
        </div>
      </div>
    `;
  }).join("");
}

function resetJobSearch() {
  searchQuery = "";
  const input = document.getElementById("job-search-input");
  if (input) input.value = "";
  renderJobs();
}

// ---------------- APPLY MODAL ----------------
function setupApplyModal() {
  const modal = document.getElementById("job-apply-modal");
  const form = document.getElementById("job-apply-form");
  const closeBtn = document.getElementById("job-apply-close");

  if (!modal || !form) return;

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
    if (!activeJobId) return;

    const studentName = document.getElementById("apply-name").value.trim();
    const studentRoll = document.getElementById("apply-roll").value.trim().toUpperCase();
    const studentEmail = document.getElementById("apply-email").value.trim();
    const studentCgpa = document.getElementById("apply-cgpa").value.trim();
    const githubUrl = document.getElementById("apply-github").value.trim();
    const resumeUrl = document.getElementById("apply-resume").value.trim();

    // Collect checked badges
    const badgesIncluded = [];
    document.querySelectorAll(".apply-badge-chk:checked").forEach(chk => {
      badgesIncluded.push(chk.value);
    });

    const result = Storage.applyForJob(activeJobId, {
      studentName,
      studentRoll,
      studentEmail,
      studentCgpa,
      githubUrl,
      resumeUrl,
      badgesIncluded
    });

    if (result.success) {
      currentJobs = Storage.getJobs();
      renderJobs();
      modal.style.display = "none";
      form.reset();
      showToast("Application submitted successfully to company talent pool!", "success");
    } else {
      showToast(result.message, "error");
    }
  });
}

function openApplyModal(jobId) {
  activeJobId = jobId;
  const job = Storage.getJobById(jobId);
  if (!job) return;

  const modal = document.getElementById("job-apply-modal");
  const user = Storage.getCurrentUser();

  document.getElementById("modal-job-title").textContent = job.role;
  document.getElementById("modal-job-sub").textContent = `${job.company} • Stipend: ${job.stipend}`;

  if (user) {
    document.getElementById("apply-name").value = user.name || "";
    document.getElementById("apply-roll").value = user.roll || "";
    document.getElementById("apply-email").value = user.email || "";
    document.getElementById("apply-cgpa").value = "8.74";
  }

  // Render user's verified badges
  const badgesBox = document.getElementById("apply-badges-container");
  if (badgesBox && user) {
    const badges = Storage.getVerifiedBadges(user.email);
    if (badges.length > 0) {
      badgesBox.innerHTML = `
        <label class="form-label" style="margin-bottom: 6px;">Attach Verified Campus Credentials:</label>
        <div style="display: flex; flex-direction: column; gap: 6px; background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
          ${badges.map(b => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
              <input type="checkbox" class="apply-badge-chk" value="${escapeHTML(b.title)}" checked>
              <span>🛡️ <strong>${escapeHTML(b.title)}</strong> (ID: <code>${escapeHTML(b.verificationHash)}</code>)</span>
            </label>
          `).join("")}
        </div>
      `;
    } else {
      badgesBox.innerHTML = "";
    }
  }

  modal.style.display = "flex";
}

