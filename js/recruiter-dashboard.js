// js/recruiter-dashboard.js - Recruiter / Corporate Partner Dashboard

document.addEventListener("DOMContentLoaded", () => {
  initRecruiterDashboard();
});

function initRecruiterDashboard() {
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
  const jobs = typeof Storage !== "undefined" ? Storage.getJobs() : [];
  const applications = typeof Storage !== "undefined" ? Storage.getJobApplications() : [];

  const activeDrivesEl = document.getElementById("stat-active-drives");
  const totalApplicantsEl = document.getElementById("stat-total-applicants");
  const reviewedEl = document.getElementById("stat-reviewed-candidates");

  if (activeDrivesEl) activeDrivesEl.textContent = jobs.length;
  if (totalApplicantsEl) totalApplicantsEl.textContent = applications.length;
  if (reviewedEl) {
    const reviewedCount = applications.filter(a => a.status === "SHORTLISTED" || a.status === "Shortlisted" || a.status === "Offer Extended" || a.status === "ACCEPTED").length;
    reviewedEl.textContent = reviewedCount;
  }
}

function renderPostedJobs() {
  const tbody = document.getElementById("rec-jobs-tbody");
  if (!tbody) return;

  const jobs = typeof Storage !== "undefined" ? Storage.getJobs() : [];
  if (jobs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No active hiring drives posted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = jobs.map(j => {
    const formattedDeadline = j.deadline ? new Date(j.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Rolling";

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${escapeHTML(j.role)}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHTML(j.company)}</div>
        </td>
        <td><strong>${escapeHTML(j.stipend || 'Competitive')}</strong></td>
        <td>${escapeHTML(j.location || 'Campus / Hybrid')}</td>
        <td><span class="badge badge-teal">${j.applicantsCount || 0} Applied</span></td>
        <td>${formattedDeadline}</td>
        <td>
          <span class="badge badge-status-open">Active Drive</span>
        </td>
      </tr>
    `;
  }).join("");
}

function renderCandidatePool() {
  const tbody = document.getElementById("rec-candidates-tbody");
  if (!tbody) return;

  const applications = typeof Storage !== "undefined" ? Storage.getJobApplications() : [];
  if (applications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No student applications received yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = applications.map(app => {
    const roleName = app.jobRole || app.role || "Software Intern";
    const cgpa = app.cgpa || app.studentCgpa || "8.50";
    const githubLink = app.github || app.githubUrl;
    const resumeLink = app.resume || app.resumeUrl;

    const badgesHtml = (app.badgesIncluded || ["SIH 2026 Winner", "GDSC Lead"]).map(b => `
      <span class="badge badge-teal" style="font-size: 11px; margin-right: 4px;">🛡️ ${escapeHTML(b)}</span>
    `).join("");

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${escapeHTML(app.studentName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHTML(app.studentRoll || '23/CS/104')} &bull; ${escapeHTML(app.studentEmail)}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHTML(roleName)}</div>
          <div style="font-size: 0.75rem; color: var(--primary-color);">${escapeHTML(app.company || 'Tech Partner')}</div>
        </td>
        <td>
          <span style="font-weight: 800; color: var(--text-primary);">${escapeHTML(cgpa)}</span>
        </td>
        <td>
          ${badgesHtml}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            ${githubLink ? `<a href="${githubLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 11px;">GitHub</a>` : ''}
            ${resumeLink ? `<a href="${resumeLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 11px;">Resume</a>` : ''}
          </div>
        </td>
        <td>
          <select class="rec-status-select" onchange="updateCandidateStatus('${app.id}', this.value)">
            <option value="Under Review" ${app.status === 'Under Review' || app.status === 'UNDER_REVIEW' ? 'selected' : ''}>Under Review</option>
            <option value="Shortlisted" ${app.status === 'Shortlisted' || app.status === 'SHORTLISTED' ? 'selected' : ''}>Shortlisted for Interview</option>
            <option value="Offer Extended" ${app.status === 'Offer Extended' || app.status === 'ACCEPTED' ? 'selected' : ''}>Offer Extended</option>
            <option value="Not Selected" ${app.status === 'Not Selected' || app.status === 'REJECTED' ? 'selected' : ''}>Not Selected</option>
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

function updateCandidateStatus(appId, newStatus) {
  if (typeof Storage !== "undefined") {
    const apps = Storage.getJobApplications();
    const app = apps.find(a => a.id === appId);
    if (app) {
      app.status = newStatus;
      Storage.saveJobApplications(apps);
    }
  }

  renderRecruiterStats();
  if (typeof UIStates !== "undefined") {
    UIStates.showToast(`Applicant status updated to: ${newStatus}`, "info");
  }
}

function setupPostJobModal() {
  const openBtn = document.getElementById("post-job-trigger");
  const modal = document.getElementById("post-job-modal");
  const form = document.getElementById("post-job-form");
  const closeBtn = document.getElementById("post-job-close");
  const cancelBtn = document.getElementById("cancel-post-job-btn");

  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.style.display = "block";
  });

  const closeModal = () => {
    if (typeof modal.close === "function") modal.close();
    else modal.style.display = "none";
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const company = document.getElementById("post-company").value.trim();
    const role = document.getElementById("post-role").value.trim();
    const stipend = document.getElementById("post-stipend").value.trim();
    const duration = document.getElementById("post-duration").value.trim() || "2-3 Months";
    const location = document.getElementById("post-location").value.trim();
    const eligibility = document.getElementById("post-eligibility").value.trim();
    const skills = document.getElementById("post-skills").value.split(",").map(s => s.trim()).filter(Boolean);
    const deadline = document.getElementById("post-deadline").value;
    const description = document.getElementById("post-description").value.trim();

    if (typeof Storage !== "undefined") {
      const jobs = Storage.getJobs();
      jobs.unshift({
        id: "job-" + Date.now(),
        company,
        role,
        stipend,
        duration,
        location,
        eligibility,
        skills,
        deadline,
        description,
        applicantsCount: 0,
        logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120"
      });
      Storage.saveJobs(jobs);
    }

    renderRecruiterStats();
    renderPostedJobs();
    closeModal();
    form.reset();

    if (typeof UIStates !== "undefined") {
      UIStates.showToast("New hiring drive published to campus student body!", "success");
    }
  });
}
