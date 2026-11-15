// js/club-details.js - Individual Club Details & Join Request Controller

let currentClub = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadClubData();
  initApplicationModal();
  initEditClubModal();
});

async function loadClubData() {
  const params = new URLSearchParams(window.location.search);
  const clubId = params.get("id");

  if (!clubId) {
    showClubNotFound();
    return;
  }

  try {
    currentClub = await API.getClub(clubId);
    if (!currentClub) {
      showClubNotFound();
      return;
    }

    document.title = `${currentClub.name} | ClubHub`;

    // Render Banner & Logo
    const bannerBg = document.getElementById("hero-cover-bg");
    const bannerUrl = currentClub.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80";
    if (bannerBg) {
      bannerBg.style.backgroundImage = `url('${bannerUrl}')`;
    }

    const logoImg = document.getElementById("club-logo");
    if (logoImg) {
      logoImg.src = bannerUrl;
      logoImg.alt = currentClub.name;
    }

    // Name & Category
    const nameEl = document.getElementById("club-name");
    if (nameEl) nameEl.textContent = currentClub.name;

    const catBadge = document.getElementById("club-category-badge");
    if (catBadge) catBadge.textContent = currentClub.category;

    const taglineEl = document.getElementById("club-tagline");
    if (taglineEl) taglineEl.textContent = currentClub.category + " Society at TINT";

    // Description
    const descEl = document.getElementById("club-description");
    if (descEl) descEl.textContent = currentClub.description;

    // Member count & Coordinator
    const memberCountEl = document.getElementById("club-member-count");
    if (memberCountEl) {
      const count = currentClub.member_count || 0;
      memberCountEl.innerHTML = `<strong>${count}</strong> Active ${count === 1 ? 'Member' : 'Members'}`;
    }

    const meetingInfoEl = document.getElementById("club-meeting-info");
    if (meetingInfoEl) {
      const coordName = currentClub.coordinator ? currentClub.coordinator.full_name : "Campus Secretariat";
      meetingInfoEl.innerHTML = `Lead Coordinator: <strong>${escapeHTML(coordName)}</strong>`;
    }

    // Recruitment Status
    const statusBadge = document.getElementById("club-status-badge");
    const widgetStatus = document.getElementById("widget-status");
    if (currentClub.recruitment_open) {
      if (statusBadge) {
        statusBadge.className = "badge badge-status-open";
        statusBadge.innerHTML = `<span class="badge-dot"></span> Recruiting Now`;
      }
      if (widgetStatus) {
        widgetStatus.className = "meta-value status-open";
        widgetStatus.textContent = "Active / Open";
      }
    } else {
      if (statusBadge) {
        statusBadge.className = "badge badge-status-closed";
        statusBadge.textContent = "Recruitment Closed";
      }
      if (widgetStatus) {
        widgetStatus.className = "meta-value";
        widgetStatus.textContent = "Closed";
      }
    }

    // Action button state
    updateJoinButtonState();

    // Load Club Events if container exists
    await loadClubEvents(currentClub.id);

  } catch (err) {
    showClubNotFound(err.message);
  }
}

function updateJoinButtonState() {
  const heroApplyBtn = document.getElementById("hero-apply-btn");
  const widgetApplyBtn = document.getElementById("open-apply-modal-btn");
  const existingAppBanner = document.getElementById("existing-application-banner");
  const existingAppText = document.getElementById("existing-app-status-text");

  if (!heroApplyBtn && !widgetApplyBtn) return;

  const status = currentClub ? currentClub.user_status : "none";
  const currentUser = API.getCurrentUser();
  const isSuperAdmin = currentUser && currentUser.role === "admin";
  const isCoordinator = currentUser && currentUser.role === "coordinator";
  const isOwner = currentUser && (isSuperAdmin || (isCoordinator && currentClub && currentClub.coordinator_id === currentUser.id));

  const adminActionsDiv = document.getElementById("club-details-admin-actions");
  const editBtn = document.getElementById("club-details-edit-btn");
  const deleteBtn = document.getElementById("club-details-delete-btn");

  if (isOwner && adminActionsDiv) {
    adminActionsDiv.style.display = "inline-flex";
    if (heroApplyBtn) heroApplyBtn.style.display = "none";

    if (editBtn) {
      editBtn.onclick = () => openEditClubModal();
    }
    if (deleteBtn) {
      deleteBtn.onclick = () => handleDeleteClub();
    }
  } else {
    if (adminActionsDiv) adminActionsDiv.style.display = "none";
    if (heroApplyBtn) heroApplyBtn.style.display = "inline-block";
  }

  if (status === "admin") {
    if (widgetApplyBtn) {
      widgetApplyBtn.textContent = "Manage in Club Admin";
      widgetApplyBtn.className = "btn btn-outline btn-block btn-lg";
      widgetApplyBtn.onclick = () => window.location.href = "admin.html";
    }
    if (existingAppBanner) {
      existingAppBanner.style.display = "flex";
      if (existingAppText) existingAppText.textContent = "You are the Coordinator / Admin of this society.";
    }
  } else if (status === "member") {
    if (heroApplyBtn) {
      heroApplyBtn.textContent = "✓ Member";
      heroApplyBtn.className = "btn btn-success disabled";
      heroApplyBtn.style.pointerEvents = "none";
    }
    if (widgetApplyBtn) {
      widgetApplyBtn.textContent = "✓ You are a Member";
      widgetApplyBtn.className = "btn btn-success btn-block btn-lg disabled";
      widgetApplyBtn.disabled = true;
    }
    if (existingAppBanner) {
      existingAppBanner.style.display = "flex";
      if (existingAppText) existingAppText.textContent = "Your membership has been approved! You are an active core member.";
    }
  } else if (status === "pending") {
    if (heroApplyBtn) {
      heroApplyBtn.textContent = "Request Pending";
      heroApplyBtn.className = "btn btn-warning disabled";
      heroApplyBtn.style.pointerEvents = "none";
    }
    if (widgetApplyBtn) {
      widgetApplyBtn.textContent = "Request Pending Review";
      widgetApplyBtn.className = "btn btn-warning btn-block btn-lg disabled";
      widgetApplyBtn.disabled = true;
    }
    if (existingAppBanner) {
      existingAppBanner.style.display = "flex";
      if (existingAppText) existingAppText.textContent = "Your candidacy is currently Pending Review by the club lead.";
    }
  } else if (status === "rejected") {
    if (heroApplyBtn) {
      heroApplyBtn.textContent = "Re-request Join";
      heroApplyBtn.className = "btn btn-outline";
      heroApplyBtn.onclick = (e) => { e.preventDefault(); openModal(); };
    }
    if (widgetApplyBtn) {
      widgetApplyBtn.textContent = "Re-apply for Membership";
      widgetApplyBtn.className = "btn btn-cta btn-block btn-lg";
      widgetApplyBtn.onclick = () => openModal();
    }
    if (existingAppBanner) {
      existingAppBanner.style.display = "flex";
      if (existingAppText) existingAppText.textContent = "Previous request was rejected. You may submit a new request below.";
    }
  } else {
    // None
    if (heroApplyBtn) {
      heroApplyBtn.textContent = "Join Society";
      heroApplyBtn.className = "btn btn-cta";
      heroApplyBtn.onclick = (e) => { e.preventDefault(); openModal(); };
    }
    if (widgetApplyBtn) {
      widgetApplyBtn.textContent = "Join This Society";
      widgetApplyBtn.className = "btn btn-cta btn-block btn-lg";
      widgetApplyBtn.onclick = () => openModal();
    }
    if (existingAppBanner) {
      existingAppBanner.style.display = "none";
    }
  }
}

function openModal() {
  const user = requireAuth();
  if (!user) return;

  const modal = document.getElementById("applyModal");
  if (!modal) return;

  const clubNameEl = document.getElementById("modal-club-name");
  if (clubNameEl && currentClub) clubNameEl.textContent = `Apply to ${currentClub.name}`;

  // Pre-fill user data
  const nameInput = document.getElementById("app-student-name");
  if (nameInput) nameInput.value = user.full_name || user.name || "";

  const deptInput = document.getElementById("app-branch");
  if (deptInput) deptInput.value = user.department || "";

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.style.display = "block";
  }
}

function initApplicationModal() {
  const modal = document.getElementById("applyModal");
  const closeBtn = document.getElementById("close-apply-modal-btn");
  const form = document.getElementById("recruitment-apply-form");

  if (!modal || !form) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (typeof modal.close === "function") modal.close();
      else modal.style.display = "none";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = requireAuth();
    if (!user) return;

    if (!currentClub) return;

    const motivation = document.getElementById("app-motivation") ? document.getElementById("app-motivation").value.trim() : "Interested in participating in society events and projects";
    const skills = document.getElementById("app-experience") ? document.getElementById("app-experience").value.trim() : "General";
    const submitBtn = form.querySelector("button[type='submit']");

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Submitting...";
      }

      const res = await API.submitJoinRequest(currentClub.id, motivation, skills);

      if (typeof modal.close === "function") modal.close();
      else modal.style.display = "none";

      if (res && res.status === "Approved") {
        currentClub.user_status = "member";
        showToast("You are an active member of this society!", "success");
      } else {
        currentClub.user_status = "pending";
        showToast("Join request submitted successfully! Your status is now Pending.", "success");
      }

      updateJoinButtonState();
      await loadClubData();

    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("already an active member")) {
        currentClub.user_status = "member";
        if (typeof modal.close === "function") modal.close();
        else modal.style.display = "none";
        updateJoinButtonState();
        showToast("You are already an active member of this society.", "info");
      } else if (msg.includes("already have a pending") || msg.includes("already pending")) {
        currentClub.user_status = "pending";
        if (typeof modal.close === "function") modal.close();
        else modal.style.display = "none";
        updateJoinButtonState();
        showToast("You already have a pending join request for this society.", "info");
      } else {
        showToast(msg || "Failed to submit application.", "error");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Submit Application";
      }
    }
  });
}

async function loadClubEvents(clubId) {
  const container = document.getElementById("club-events-list");
  if (!container) return;

  try {
    const events = await API.getEvents({ club_id: clubId });
    if (!events || events.length === 0) {
      container.innerHTML = `<div style="padding: 20px; font-size: 13px; color: var(--text-secondary); text-align: center;">No scheduled events at this time.</div>`;
      return;
    }

    container.innerHTML = events.map(ev => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 8px;">
        <div>
          <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">${escapeHTML(ev.title)}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${new Date(ev.event_date).toLocaleDateString()} &bull; ${escapeHTML(ev.location)}</div>
        </div>
        <a href="events.html" class="btn btn-outline btn-sm">View</a>
      </div>
    `).join("");
  } catch (e) {
    // Silent fail
  }
}

function showClubNotFound(msg = "Society Not Found") {
  const main = document.querySelector(".main-content");
  if (main && typeof UIStates !== "undefined") {
    main.innerHTML = `
      <div class="container" style="text-align: center; padding: 100px 20px;">
        <h2 style="font-size: 28px; margin-bottom: 12px; color: var(--text-main);">${escapeHTML(msg)}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">The society you are looking for does not exist or has been removed.</p>
        <a href="clubs.html" class="btn btn-primary">Back to Clubs Directory</a>
      </div>
    `;
  }
}

// ---------------- EDIT CLUB MODAL (FOR AUTHORIZED LEAD) ----------------
function initEditClubModal() {
  const modal = document.getElementById("edit-club-modal");
  const closeBtn = document.getElementById("close-edit-club-modal-btn");
  const form = document.getElementById("edit-club-form");
  const fileInput = document.getElementById("edit-club-file");
  const preview = document.getElementById("edit-club-preview");

  if (!modal || !form) return;

  if (fileInput && preview) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("Image must be smaller than 5MB.", "error");
          fileInput.value = "";
          return;
        }
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentClub) return;

    const name = document.getElementById("edit-club-name").value.trim();
    const category = document.getElementById("edit-club-category").value;
    const recruitmentVal = document.getElementById("edit-club-recruitment").value;
    const description = document.getElementById("edit-club-desc").value.trim();
    const imageUrl = document.getElementById("edit-club-image-url").value.trim();
    const submitBtn = form.querySelector("button[type='submit']");

    if (!name || !category || !description) {
      showToast("Please fill in society name, category, and description.", "error");
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Saving Changes...";
      }

      let finalImageUrl = imageUrl || undefined;
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file) {
        showToast("Uploading society cover image...", "info");
        const upRes = await API.uploadImage(file);
        finalImageUrl = upRes.url;
      }

      const payload = {
        name,
        category,
        description,
        recruitment_open: recruitmentVal === "open",
        ...(finalImageUrl ? { image_url: finalImageUrl } : {})
      };

      await API.updateClub(currentClub.id, payload);
      showToast(`Society '${name}' updated successfully!`, "success");
      modal.style.display = "none";
      await loadClubData();

    } catch (err) {
      showToast(err.message || "Failed to update society profile.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Save Changes";
      }
    }
  });
}

function openEditClubModal() {
  if (!currentClub) return;
  const modal = document.getElementById("edit-club-modal");
  if (!modal) return;

  document.getElementById("edit-club-id").value = currentClub.id;
  document.getElementById("edit-club-name").value = currentClub.name || "";
  document.getElementById("edit-club-category").value = currentClub.category || "Technical";
  document.getElementById("edit-club-recruitment").value = currentClub.recruitment_open ? "open" : "closed";
  document.getElementById("edit-club-desc").value = currentClub.description || "";
  document.getElementById("edit-club-image-url").value = currentClub.image_url || "";

  const preview = document.getElementById("edit-club-preview");
  if (preview) {
    if (currentClub.image_url) {
      preview.innerHTML = `<img src="${escapeHTML(currentClub.image_url)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      preview.innerHTML = "Preview";
    }
  }

  const fileInput = document.getElementById("edit-club-file");
  if (fileInput) fileInput.value = "";

  modal.style.display = "flex";
}

async function handleDeleteClub() {
  if (!currentClub) return;
  const currentUser = API.getCurrentUser();
  if (!currentUser || (currentUser.role !== "coordinator" && currentUser.role !== "admin")) {
    showToast("Access forbidden: Only Club Admins can delete societies.", "error");
    return;
  }

  if (!confirm(`Are you sure you want to permanently delete '${currentClub.name}'?\n\nWarning: This will delete all member rosters, pending requests, and scheduled events for this society. This action cannot be undone.`)) {
    return;
  }

  try {
    showToast(`Deleting society '${currentClub.name}'...`, "info");
    await API.deleteClub(currentClub.id);
    showToast(`Society '${currentClub.name}' has been permanently deleted.`, "success");
    setTimeout(() => {
      window.location.href = "clubs.html";
    }, 800);
  } catch (err) {
    showToast(err.message || "Failed to delete society.", "error");
  }
}
