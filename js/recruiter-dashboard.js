// js/recruiter-dashboard.js - Recruiter / Corporate Partner Dashboard

document.addEventListener("DOMContentLoaded", () => {
  initRecruiterDashboard();
});

function initRecruiterDashboard() {
  const user = Storage.getCurrentUser();
  if (!user || user.role !== "recruiter") {
    // If not recruiter, still allow demo viewing but warn or suggest
  }

  renderRecruiterStats();
  renderPostedJobs();
  renderCandidatePool();
  setupPostJobModal();
  setupTabs();
}

function setupTabs() {
  const tabs = document.querySelectorAll(".rec-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.getAttribute("data-tab");
      document.querySelectorAll(".rec-tab-panel").forEach(p => {
        p.style.display = p.id === target ? "block" : "none";
      });
    });
  });
}

function renderRecruiterStats() {
  const jobs = Storage.getJobs();
  const applications = Storage.getJobApplications();

  const activeDrivesEl = document.getElementById("stat-active-drives");
  const totalApplicantsEl = document.getElementById("stat-total-applicants");
  const reviewedEl = document.getElementById("stat-reviewed-candidates");

  if (activeDrivesEl) activeDrivesEl.textContent = jobs.length;
  if (totalApplicantsEl) totalApplicantsEl.textContent = applications.length;
  if (reviewedEl) {
    const reviewedCount = applications.filter(a => a.status === "SHORTLISTED" || a.status === "ACCEPTED").length;
    reviewedEl.textContent = reviewedCount;
  }
}

function renderPostedJobs() {
  const tbody = document.getElementById("rec-jobs-tbody");
  if (!tbody) return;

  const jobs = Storage.getJobs();
  if (jobs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No active hiring drives posted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = jobs.map(j => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(j.role)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(j.department || j.company)}</div>
      </td>
      <td><strong>${escapeHTML(j.stipend || 'Competitive')}</strong></td>
      <td>${escapeHTML(j.location)}</td>
      <td><span class="badge badge-primary">${j.applicantsCount || 0} Applied</span></td>
      <td>${formatDate(j.deadline)}</td>
      <td>
        <span class="badge badge-success">ACTIVE DRIVE</span>
      </td>
    </tr>
  `).join("");
}

function renderCandidatePool() {
  const tbody = document.getElementById("rec-candidates-tbody");
  if (!tbody) return;

  const applications = Storage.getJobApplications();
  if (applications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No student applications received yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = applications.map(app => {
    const badgesHtml = (app.badgesIncluded || []).map(b => `
      <span class="badge-verified-tag">🛡️ ${escapeHTML(b)}</span>
    `).join("");

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(app.studentName)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(app.studentRoll)} &bull; ${escapeHTML(app.studentEmail)}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHTML(app.role)}</div>
          <div style="font-size: 11px; color: var(--primary);">${escapeHTML(app.company)}</div>
        </td>
        <td>
          <span style="font-weight: 800; color: var(--text-main);">${escapeHTML(app.studentCgpa || 'N/A')}</span>
        </td>
        <td>
          ${badgesHtml || '<span style="color: var(--text-muted); font-size: 11px;">None attached</span>'}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            ${app.githubUrl ? `<a href="${app.githubUrl}" target="_blank" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 11px;">GitHub</a>` : ''}
            ${app.resumeUrl ? `<a href="${app.resumeUrl}" target="_blank" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 11px;">Resume</a>` : ''}
          </div>
        </td>
        <td>
          <select class="form-select" style="font-size: 11px; padding: 4px 8px; height: 32px;" onchange="updateCandidateStatus('${app.id}', this.value)">
            <option value="UNDER_REVIEW" ${app.status === 'UNDER_REVIEW' ? 'selected' : ''}>Under Review</option>
            <option value="SHORTLISTED" ${app.status === 'SHORTLISTED' ? 'selected' : ''}>Shortlist for Interview</option>
            <option value="ACCEPTED" ${app.status === 'ACCEPTED' ? 'selected' : ''}>Offer Extended</option>
            <option value="REJECTED" ${app.status === 'REJECTED' ? 'selected' : ''}>Not Selected</option>
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

function updateCandidateStatus(appId, newStatus) {
  Storage.updateJobApplicationStatus(appId, newStatus, `Status updated by recruiter to ${newStatus}`);
  renderRecruiterStats();
  showToast(`Applicant status updated to ${newStatus}`, "info");
}

function setupPostJobModal() {
  const openBtn = document.getElementById("post-job-trigger");
  const modal = document.getElementById("post-job-modal");
  const form = document.getElementById("post-job-form");
  const closeBtn = document.getElementById("post-job-close");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    const user = Storage.getCurrentUser();
    if (user && user.company) {
      document.getElementById("post-company").value = user.company;
    }
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

    const company = document.getElementById("post-company").value.trim();
    const role = document.getElementById("post-role").value.trim();
    const stipend = document.getElementById("post-stipend").value.trim();
    const duration = document.getElementById("post-duration").value.trim();
    const location = document.getElementById("post-location").value.trim();
    const eligibility = document.getElementById("post-eligibility").value.trim();
    const skills = document.getElementById("post-skills").value.split(",").map(s => s.trim()).filter(Boolean);
    const deadline = document.getElementById("post-deadline").value;
    const description = document.getElementById("post-description").value.trim();

    Storage.addJob({
      company,
      role,
      stipend,
      duration,
      location,
      eligibility,
      skills,
      deadline,
      description,
      logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120"
    });

    renderRecruiterStats();
    renderPostedJobs();
    modal.style.display = "none";
    form.reset();
    showToast("New hiring drive published to campus student body!", "success");
  });
}

