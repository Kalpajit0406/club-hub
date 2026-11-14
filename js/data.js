// js/data.js - Central Category Definitions and Collegiate Baseline Seed Data

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: "grid" },
  { id: "Technical", name: "Technical & Coding", icon: "code" },
  { id: "Cultural", name: "Cultural & Arts", icon: "music" },
  { id: "Sports", name: "Sports & Athletics", icon: "activity" },
  { id: "Literary", name: "Literary & Debating", icon: "book-open" },
  { id: "Social", name: "Social & Community", icon: "heart" },
  { id: "Entrepreneurship", name: "E-Cell & Business", icon: "trending-up" }
];

const CLUBS_DATA = [
  {
    id: 1,
    name: "Google Developer Student Club",
    category: "Technical",
    description: "Official Google Developer Student Club campus chapter building cloud, mobile, and web solutions.",
    image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
    recruitment_open: true,
    member_count: 48,
    coordinator: { full_name: "Priya Sharma", email: "coord@tint.edu.in" }
  },
  {
    id: 2,
    name: "Turing AI & Data Science Society",
    category: "Technical",
    description: "Fostering artificial intelligence, computer vision, deep learning, and algorithmic research on campus.",
    image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
    recruitment_open: true,
    member_count: 35,
    coordinator: { full_name: "Priya Sharma", email: "coord@tint.edu.in" }
  },
  {
    id: 3,
    name: "Robotics & Embedded Systems Club",
    category: "Technical",
    description: "Building autonomous rovers, combat robots, and IoT micro-controller applications for national championships.",
    image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
    recruitment_open: true,
    member_count: 28,
    coordinator: { full_name: "Priya Sharma", email: "coord@tint.edu.in" }
  },
  {
    id: 4,
    name: "E-Cell & Startup Incubator",
    category: "Entrepreneurship",
    description: "Campus hub for early-stage founders, startup pitch decks, venture capital networking, and incubation.",
    image_url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80",
    recruitment_open: true,
    member_count: 32,
    coordinator: { full_name: "Priya Sharma", email: "coord@tint.edu.in" }
  },
  {
    id: 5,
    name: "CodeChef Campus Chapter",
    category: "Technical",
    description: "Organizing weekly algorithmic contests, ICPC prep sprints, and dynamic programming bootcamps.",
    image_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    recruitment_open: true,
    member_count: 54,
    coordinator: { full_name: "Priya Sharma", email: "coord@tint.edu.in" }
  },
  {
    id: 6,
    name: "TINT Cultural & Arts Collective",
    category: "Cultural",
    description: "Acoustic concerts, theatrical dramatics, photography exhibitions, and collegiate festival productions.",
    image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    recruitment_open: false,
    member_count: 62,
    coordinator: { full_name: "Priya Sharma", email: "coord@tint.edu.in" }
  }
];

const SEEDED_EVENTS = [
  {
    id: 1,
    club_id: 1,
    title: "HackTINT 2026: 36-Hour National Hackathon",
    category: "Hackathon",
    description: "Annual collegiate hackathon bringing 400+ developers together with ₹2.5L cash prizes and live corporate mentorship.",
    event_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    location: "Main University Auditorium",
    banner_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    club: { name: "Google Developer Student Club" }
  },
  {
    id: 2,
    club_id: 3,
    title: "Autonomous Robowars & Arena Combat",
    category: "Competition",
    description: "15kg & 30kg combat robotics championship with custom obstacle arenas and wire-speed telemetry.",
    event_date: new Date(Date.now() + 21 * 86400000).toISOString(),
    location: "Indoor Sports Complex Arena",
    banner_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    club: { name: "Robotics & Embedded Systems Club" }
  },
  {
    id: 3,
    club_id: 2,
    title: "Full-Stack Cloud & FastAPI Workshop",
    category: "Workshop",
    description: "Hands-on masterclass building enterprise microservices with Python FastAPI, Docker, and PostgreSQL.",
    event_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    location: "CS Advanced Computing Lab 3",
    banner_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    club: { name: "Turing AI & Data Science Society" }
  }
];

const SEEDED_NETWORK_POSTS = [
  {
    id: 1,
    title: "Looking for 2 React & Python teammates for Smart India Hackathon 2026",
    content: "Hey everyone! Our team is building an AI-powered smart agriculture IoT pipeline for SIH 2026. Looking for 2 collaborators with frontend or embedded experience.",
    tag: "#HackathonTeam",
    upvotes_count: 7,
    author: { full_name: "Rahul Verma", department: "ECE", year: 2 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    comments: []
  },
  {
    id: 2,
    title: "GDSC Cloud Study Jam starting this Saturday — All departments welcome",
    content: "Kickstarting our 4-week cloud computing journey with Google Cloud Skills Boost credits. Free certificate vouchers for all students who complete 3 labs.",
    tag: "#Workshops",
    upvotes_count: 14,
    author: { full_name: "Priya Sharma", department: "IT", year: 3 },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    comments: []
  }
];

const SEEDED_VERIFIED_BADGES = [];
const SEEDED_APPLICATIONS = [];
const SEEDED_EVENT_REGISTRATIONS = [];
const SEEDED_USERS = [];
