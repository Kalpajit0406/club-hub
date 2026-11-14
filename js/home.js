// js/home.js - Dynamic Landing Page Controller for ClubHub

document.addEventListener("DOMContentLoaded", async () => {
  await loadHomepageStats();
});

async function loadHomepageStats() {
  try {
    if (typeof API === "undefined") return;
    const stats = await API.getPublicStats();

    const clubsEl = document.getElementById("stat-clubs-count");
    if (clubsEl) clubsEl.textContent = stats.total_clubs;

    const studentsEl = document.getElementById("stat-students-count");
    if (studentsEl) studentsEl.textContent = stats.total_students;

    const eventsEl = document.getElementById("stat-events-count");
    if (eventsEl) eventsEl.textContent = stats.total_events;

    const membersEl = document.getElementById("stat-memberships-count");
    if (membersEl) membersEl.textContent = stats.total_memberships;
  } catch (err) {
    console.warn("Could not load public stats:", err);
  }
}
