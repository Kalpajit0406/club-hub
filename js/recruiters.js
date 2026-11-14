// js/recruiters.js - Campus Placement & Recruiter Portal Controller

let currentJobs = [];
let searchQuery = "";
let activeJobId = null;

document.addEventListener("DOMContentLoaded", () => {
  initRecruitersPage();
});

function initRecruitersPage() {
  currentJobs = typeof Storage !== "undefined" ? Storage.getJobs() : [];
  setupSearchInput();
  setupApplyModal();
  renderJobs();
}

function setupSearchInput() {
  const input = document.getElementById("job-search-input");
  const clearBtn = document.getElementById("job-search-clear");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = val ? "inline-flex" : "none";
    searchQuery = val.toLowerCase();
    renderJobs();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      searchQuery = "";
      clearBtn.style.display = "none";
      renderJobs();
      input.focus();
    });
  }
}

function renderJobs() {
  const grid = document.getElementById("job-grid");
  const countEl = document.getElementById("job-count-badge");
  if (!grid) return;

  let filtered = currentJobs.filter(job => {
    if (!searchQuery) return true;
    return (job.company || "").toLowerCase().includes(searchQuery) ||
      (job.role || "").toLowerCase().includes(searchQuery) ||
      (job.location || "").toLowerCase().includes(searchQuery) ||
      (job.skills && job.skills.some(s => s.toLowerCase().includes(searchQuery)));
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} Openings Active`;
  }

  if (filtered.length === 0) {
    if (typeof UIStates !== "undefined") {
      UIStates.renderNoResultsState(grid, {
        query: searchQuery,
        onClear: "resetJobSearch()"
      });
    } else {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3 class="empty-state-title">No internship openings match your search</h3>
          <p class="empty-state-desc">Try searching by company name (Microsoft, Google, TCS) or role keywords.</p>
          <button class="btn btn-outline btn-sm" onclick="resetJobSearch()">View All Openings</button>
        </div>
      `;
    }
    return;
  }

  const applications = typeof Storage !== "undefined" ? Storage.getJobApplications() : [];
  const user = typeof Storage !== "undefined" ? Storage.getCurrentUser() : null;
  const userEmail = user ? user.email : "";

  const mapPinIcon = typeof Icons !== "undefined" ? Icons.render("map-pin", { width: 14, height: 14 }) : "";
  const clockIcon = typeof Icons !== "undefined" ? Icons.render("clock", { width: 14, height: 14 }) : "";

  grid.innerHTML = filtered.map(job => {
    const hasApplied = userEmail && applications.some(a => a.jobId === job.id && a.studentEmail === userEmail);
    const skillsHtml = (job.skills || []).map(s => `<span class="rec-skill-tag">${escapeHTML(s)}</span>`).join("");

    return `
      <article class="rec-card" data-job-id="${job.id}">
        <div class="rec-card-top">
          <div class="rec-company-wrap">
            <img src="${job.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120'}" alt="${escapeHTML(job.company)}" class="rec-company-logo" loading="lazy">
            <div>
              <div class="rec-company-name">${escapeHTML(job.company)}</div>
              <h3 class="rec-role-title">${escapeHTML(job.role)}</h3>
            </div>
          </div>
          <span class="rec-stipend-pill">${escapeHTML(job.stipend || 'Competitive')}</span>
        </div>

        <div class="rec-meta-tags">
          <span class="rec-meta-item">
            ${mapPinIcon}
            <span>${escapeHTML(job.location || 'Bengaluru')} &bull; ${escapeHTML(job.duration || '2 Months')}</span>
          </span>
          <span class="rec-meta-item">
            ${clockIcon}
            <span>Criteria: <strong>${escapeHTML(job.eligibility || 'All Batches')}</strong></span>
          </span>
        </div>

        <p class="rec-desc">
          ${escapeHTML(job.description || 'Full-time summer internship opportunity with mentorship, industry stipend, and potential pre-placement interview consideration.')}
        </p>

        <div class="rec-skills-wrap">
          ${skillsHtml}
        </div>

        <div class="rec-card-footer">
          <span class="rec-deadline">Deadline: ${job.deadline ? new Date(job.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : 'Rolling'}</span>

          ${hasApplied ? `
            <span class="badge badge-teal">✓ Application Submitted</span>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="openApplyModal('${job.id}')">
              Apply via ClubHub
            </button>
          `}
        </div>
      </article>
    `;
  }).join("");
}

function resetJobSearch() {
  searchQuery = "";
  const input = document.getElementById("job-search-input");
  if (input) input.value = "";
  const clearBtn = document.getElementById("job-search-clear");
  if (clearBtn) clearBtn.style.display = "none";
  renderJobs();
}

function openApplyModal(jobId) {
  const job = currentJobs.find(j => j.id === jobId);
  if (!job) return;

  activeJobId = jobId;
  const modal = document.getElementById("job-apply-modal");
  const title = document.getElementById("modal-job-title");
  const sub = document.getElementById("modal-job-sub");
  const badgesBox = document.getElementById("apply-badges-container");

  if (title) title.textContent = `Apply: ${job.role}`;
  if (sub) sub.textContent = `${job.company} • ${job.location} • Stipend: ${job.stipend}`;

  // Pre-fill user data
  if (typeof Storage !== "undefined") {
    const user = Storage.getCurrentUser();
    if (user) {
      const nameIn = document.getElementById("apply-name");
      const rollIn = document.getElementById("apply-roll");
      const emailIn = document.getElementById("apply-email");
      const cgpaIn = document.getElementById("apply-cgpa");
      if (nameIn && user.name) nameIn.value = user.name;
      if (rollIn && user.rollNumber) rollIn.value = user.rollNumber;
      if (emailIn && user.email) emailIn.value = user.email;
      if (cgpaIn && user.cgpa) cgpaIn.value = user.cgpa;

      // Render verified credentials if available
      const badges = Storage.getVerifiedBadges(user.email);
      if (badgesBox) {
        if (badges && badges.length > 0) {
          badgesBox.innerHTML = `
            <div style="background: rgba(21, 128, 61, 0.06); border: 1px solid rgba(21, 128, 61, 0.25); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 14px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-success); margin-bottom: 4px;">
                ✓ Verified Campus Credentials Attached
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${badges.map(b => `<span class="badge badge-teal" style="font-size: 11px;">${escapeHTML(b.title)}</span>`).join("")}
              </div>
            </div>
          `;
        } else {
          badgesBox.innerHTML = "";
        }
      }
    }
  }

  if (modal) {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.style.display = "block";
  }
}

function closeApplyModal() {
  const modal = document.getElementById("job-apply-modal");
  if (!modal) return;
  if (typeof modal.close === "function") modal.close();
  else modal.style.display = "none";
}

function setupApplyModal() {
  const closeBtn = document.getElementById("job-apply-close");
  const cancelBtn = document.getElementById("cancel-apply-btn");
  const form = document.getElementById("job-apply-form");

  if (closeBtn) closeBtn.onclick = closeApplyModal;
  if (cancelBtn) cancelBtn.onclick = closeApplyModal;

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!activeJobId) return;

      const job = currentJobs.find(j => j.id === activeJobId);
      if (!job) return;

      const name = document.getElementById("apply-name").value.trim();
      const roll = document.getElementById("apply-roll").value.trim();
      const email = document.getElementById("apply-email").value.trim();
      const cgpa = document.getElementById("apply-cgpa").value.trim();
      const github = document.getElementById("apply-github").value.trim();
      const resume = document.getElementById("apply-resume").value.trim();

      if (!name || !roll || !email || !cgpa || !github || !resume) {
        if (typeof UIStates !== "undefined") {
          UIStates.showToast("Please fill in all candidate application fields.", "warning");
        }
        return;
      }

      const applications = typeof Storage !== "undefined" ? Storage.getJobApplications() : [];
      const newApp = {
        id: "app-" + Date.now(),
        jobId: job.id,
        jobRole: job.role,
        company: job.company,
        studentName: name,
        studentRoll: roll,
        studentEmail: email,
        cgpa: cgpa,
        github: github,
        resume: resume,
        status: "Under Review",
        appliedDate: new Date().toISOString()
      };

      applications.unshift(newApp);
      if (typeof Storage !== "undefined") {
        Storage.saveJobApplications(applications);
      }

      closeApplyModal();
      renderJobs();

      if (typeof UIStates !== "undefined") {
        UIStates.showToast("Application submitted successfully to " + job.company + "! Track under your Student Command Center.", "success");
      }
    };
  }
}
