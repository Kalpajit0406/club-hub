// js/data.js - Central Data Store for College Club Hub

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
    id: "gdsc",
    name: "Google Developer Student Club",
    acronym: "GDSC",
    category: "Technical",
    tagline: "Bridging the gap between theory and industry-grade developer skills.",
    description: "GDSC is a university-based community for students interested in Google developer technologies, open-source development, and solving real-world campus problems through tech. We host weekly hands-on codelabs, study jams, and annual hackathons.",
    logo: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN", // "OPEN" | "CLOSED"
    memberCount: 260,
    established: 2019,
    domains: ["Web Development", "Mobile Dev (Flutter/Android)", "Cloud & DevOps", "Machine Learning", "Design & UI/UX"],
    meetingInfo: "Every Wednesday at 5:00 PM | Tech Block Lab 302",
    achievements: [
      "Winner of National Smart City Hackathon 2025",
      "Published 12 open-source tools used across the university",
      "Mentored 400+ students in Google Cloud Study Jams"
    ],
    coordinators: [
      { name: "Aarav Sharma", role: "Club Lead", email: "aarav.gdsc@campus.edu", phone: "+91 98765 43210" },
      { name: "Pooja Patel", role: "Technical Head", email: "pooja.tech@campus.edu" },
      { name: "Kunal Ghosh", role: "Outreach & PR", email: "kunal.pr@campus.edu" }
    ],
    socials: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      instagram: "https://instagram.com"
    },
    tags: ["Coding", "Web Dev", "Google Cloud", "Hackathons", "Open Source"],
    featured: true
  },
  {
    id: "robotics-society",
    name: "Autonomous Robotics Society",
    acronym: "ARS",
    category: "Technical",
    tagline: "Designing intelligent autonomous machines and competitive combat bots.",
    description: "ARS brings together electrical, mechanical, and computer engineering enthusiasts. We participate in Robocon, build autonomous aerial drones, rover prototypes, and line-following robots from scratch.",
    logo: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 140,
    established: 2016,
    domains: ["Embedded Systems & Arduino", "Mechanical CAD & 3D Printing", "Computer Vision (ROS)", "Sponsorship & Logistics"],
    meetingInfo: "Tuesdays & Thursdays at 5:30 PM | Central Robotics Lab",
    achievements: [
      "1st Runner Up at Inter-University Robowars 2025",
      "Patent filed for automated campus delivery rover",
      "Conducted 10+ hands-on IoT workshops"
    ],
    coordinators: [
      { name: "Vikram Sengupta", role: "Chief Engineer", email: "vikram.ars@campus.edu" },
      { name: "Sneha Nair", role: "Operations Lead", email: "sneha.ars@campus.edu" }
    ],
    socials: {
      linkedin: "https://linkedin.com",
      instagram: "https://instagram.com"
    },
    tags: ["Robotics", "Hardware", "Arduino", "ROS", "3D Printing"],
    featured: true
  },
  {
    id: "dhwani-music",
    name: "Dhwani Music & Symphony Club",
    acronym: "Dhwani",
    category: "Cultural",
    tagline: "Creating harmonies, celebrating genres, and electrifying campus nights.",
    description: "Dhwani is the official music collective of the college. From Indian classical and folk to western acoustic, rock, and fusion, we perform at cultural fests, produce campus studio sessions, and represent the college in national collegiate music battles.",
    logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 110,
    established: 2012,
    domains: ["Vocals (Classical & Western)", "Instrumental (Strings & Percussion)", "Audio Production & Sound Mixing", "Stage Management"],
    meetingInfo: "Mondays & Fridays at 6:00 PM | Performing Arts Auditorium",
    achievements: [
      "Best Band Award at National Cultural Fest 2024",
      "Released official college anniversary anthem on Spotify",
      "Over 40,000 views on annual acoustic showcase"
    ],
    coordinators: [
      { name: "Tanvi Deshmukh", role: "Club President", email: "tanvi.dhwani@campus.edu" },
      { name: "Rahul Menon", role: "Sound & Stage Lead", email: "rahul.sound@campus.edu" }
    ],
    socials: {
      instagram: "https://instagram.com",
      youtube: "https://youtube.com"
    },
    tags: ["Music", "Vocals", "Instruments", "Concerts", "Band"],
    featured: true
  },
  {
    id: "debsoc",
    name: "The Literary & Debating Society",
    acronym: "DebSoc",
    category: "Literary",
    tagline: "Fostering articulate voices, critical reasoning, and spirited discourse.",
    description: "DebSoc is the intellectual hub of the campus. We host parliamentary debates, Model United Nations (MUN), creative writing workshops, and poetry slams. We train students to debate with poise, clarity, and factual rigor.",
    logo: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 95,
    established: 2014,
    domains: ["Parliamentary Debating", "Creative Writing & Editorial", "MUN & Geopolitics", "Logistics & Adjudication"],
    meetingInfo: "Thursdays at 5:00 PM | Seminar Hall 2",
    achievements: [
      "Champions of Inter-Collegiate Parliamentary Debate 2025",
      "Annual Campus MUN with 350+ delegates from across India",
      "Quarterly publication of the student literary magazine 'The Quill'"
    ],
    coordinators: [
      { name: "Rohan Varma", role: "President", email: "rohan.debsoc@campus.edu" },
      { name: "Meera Krishnan", role: "Editor-in-Chief", email: "meera.debsoc@campus.edu" }
    ],
    socials: {
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com"
    },
    tags: ["Debating", "MUN", "Writing", "Public Speaking", "Literature"],
    featured: false
  },
  {
    id: "ecell",
    name: "Entrepreneurship & Innovation Cell",
    acronym: "E-Cell",
    category: "Entrepreneurship",
    tagline: "Cultivating disruptive ideas and turning student founders into leaders.",
    description: "E-Cell is dedicated to promoting the startup spirit on campus. We facilitate venture incubation, host angel investor pitch nights, conduct case study challenges, and organise the flagship annual E-Summit.",
    logo: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    status: "CLOSED",
    memberCount: 175,
    established: 2017,
    domains: ["Startup Incubation & Venture Scouting", "Corporate Relations & Sponsorship", "Marketing & PR", "Event Strategy"],
    meetingInfo: "Saturdays at 11:00 AM | Incubation Centre Boardroom",
    achievements: [
      "Secured INR 25 Lakhs in student startup seed funding in 2024",
      "Flagship E-Summit hosted 20+ prominent founders & venture capitalists",
      "Incubated 8 active student-led campus enterprises"
    ],
    coordinators: [
      { name: "Ananya Roy", role: "Convenor", email: "ananya.ecell@campus.edu" },
      { name: "Devansh Mittal", role: "Head of Corporate Relations", email: "devansh.ecell@campus.edu" }
    ],
    socials: {
      linkedin: "https://linkedin.com",
      instagram: "https://instagram.com"
    },
    tags: ["Startups", "Business", "Funding", "Pitching", "Leadership"],
    featured: false
  },
  {
    id: "sports-council",
    name: "Campus Athletics & Sports League",
    acronym: "CASL",
    category: "Sports",
    tagline: "Building discipline, grit, and athletic championship spirit.",
    description: "CASL oversees the official campus sports teams in Football, Basketball, Cricket, Badminton, Volleyball, and Athletics. We run inter-department leagues and organize the annual inter-college sports festival 'Spardha'.",
    logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 320,
    established: 2010,
    domains: ["Football Wing", "Basketball Wing", "Athletics & Fitness", "Sports Management & Refereeing"],
    meetingInfo: "Daily training sessions 6:00 AM & 5:30 PM | College Sports Complex",
    achievements: [
      "State University Football Champions 2024 & 2025",
      "Gold medals in 100m, 400m relay, and long jump at Inter-College Meet",
      "Organized 16-team campus night tournament with 2,000+ attendees"
    ],
    coordinators: [
      { name: "Karthik Reddy", role: "Sports Secretary", email: "karthik.sports@campus.edu" },
      { name: "Simran Kaur", role: "Athletics Captain", email: "simran.sports@campus.edu" }
    ],
    socials: {
      instagram: "https://instagram.com"
    },
    tags: ["Athletics", "Football", "Basketball", "Fitness", "Tournaments"],
    featured: true
  },
  {
    id: "nss-rotaract",
    name: "Rotaract & Social Action Forum",
    acronym: "R-Club",
    category: "Social",
    tagline: "Service above self — creating tangible impact for local communities.",
    description: "We are committed to grassroots community development, environmental sustainability, blood donation drives, educational outreach for underprivileged children, and disaster relief aid.",
    logo: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 210,
    established: 2013,
    domains: ["Community Education Outreach", "Healthcare & Blood Donation Drives", "Green Campus & Tree Plantation", "Media & Documentation"],
    meetingInfo: "Sundays at 10:00 AM | Student Activity Centre Room 101",
    achievements: [
      "Collected 450+ units of blood in Annual Red Cross Blood Drive",
      "Planted 1,200 saplings in campus clean-and-green campaign",
      "Weekly weekend tutoring classes reaching 80+ school students"
    ],
    coordinators: [
      { name: "Priya Sundaram", role: "President", email: "priya.social@campus.edu" },
      { name: "Arjun Saxena", role: "Secretary", email: "arjun.rotaract@campus.edu" }
    ],
    socials: {
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com"
    },
    tags: ["Volunteering", "Social Impact", "Education", "Sustainability", "Community"],
    featured: false
  },
  {
    id: "pixel-finearts",
    name: "Pixel & Palette Fine Arts Club",
    acronym: "Pixel",
    category: "Cultural",
    tagline: "Exploring visual aesthetics, digital art, illustration, and photography.",
    description: "The creative canvas of our university. From digital concept art, graphic design, and UI illustration to oil painting, sculpting, and street murals, Pixel empowers campus visual artists to experiment and exhibit their craft.",
    logo: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80",
    status: "CLOSED",
    memberCount: 88,
    established: 2018,
    domains: ["Digital Illustration & 2D Animation", "Canvas Painting & Sketching", "Campus Murals & Stage Decor", "Photography & Videography"],
    meetingInfo: "Fridays at 4:30 PM | Visual Arts Studio, Block D",
    achievements: [
      "Painted 6 landmark campus murals celebrating science & humanities",
      "Held annual public art gallery with 150+ displayed student artworks",
      "Designed visual branding for all major university festivals"
    ],
    coordinators: [
      { name: "Nisha Gupta", role: "Creative Lead", email: "nisha.pixel@campus.edu" },
      { name: "Zaid Khan", role: "Photography Head", email: "zaid.arts@campus.edu" }
    ],
    socials: {
      instagram: "https://instagram.com"
    },
    tags: ["Design", "Art", "Painting", "Photography", "Illustration"],
    featured: false
  }
];

// Initial seeded applications for demonstration on first load
const SEEDED_APPLICATIONS = [
  {
    id: "app-101",
    clubId: "gdsc",
    clubName: "Google Developer Student Club",
    clubAcronym: "GDSC",
    category: "Technical",
    studentName: "Aditya Verma",
    studentRoll: "2023CSB1042",
    branch: "Computer Science & Engineering",
    year: "2nd Year",
    email: "aditya.cs23@campus.edu",
    domain: "Web Development",
    statement: "I am passionate about full-stack web development with JavaScript and React. I have built three projects and want to contribute to the campus open-source initiatives and guide first-year students.",
    portfolioUrl: "https://github.com",
    status: "SHORTLISTED", // PENDING | SHORTLISTED | ACCEPTED | REJECTED
    interviewNotes: "Round 1 interview scheduled on Thursday at 4:30 PM, Lab 302.",
    appliedDate: "2026-11-10T14:30:00.000Z"
  },
  {
    id: "app-102",
    clubId: "sports-council",
    clubName: "Campus Athletics & Sports League",
    clubAcronym: "CASL",
    category: "Sports",
    studentName: "Aditya Verma",
    studentRoll: "2023CSB1042",
    branch: "Computer Science & Engineering",
    year: "2nd Year",
    email: "aditya.cs23@campus.edu",
    domain: "Football Wing",
    statement: "Played as center midfielder in district tournaments during high school. Looking to represent the college varsity football squad.",
    portfolioUrl: "",
    status: "PENDING",
    interviewNotes: "Application is under screening by the sports council.",
    appliedDate: "2026-11-12T09:15:00.000Z"
  },
  {
    id: "app-103",
    clubId: "robotics-society",
    clubName: "Autonomous Robotics Society",
    clubAcronym: "ARS",
    category: "Technical",
    studentName: "Riya Sen",
    studentRoll: "2024ECB1015",
    branch: "Electronics & Communication",
    year: "1st Year",
    email: "riya.ec24@campus.edu",
    domain: "Embedded Systems & Arduino",
    statement: "Built a line-follower robot in school and want to contribute to the collegiate Robocon combat robot hardware design team.",
    portfolioUrl: "https://linkedin.com",
    status: "ACCEPTED",
    interviewNotes: "Passed technical interview. Onboarded to Hardware Wing.",
    appliedDate: "2026-11-08T11:00:00.000Z"
  },
  {
    id: "app-104",
    clubId: "debsoc",
    clubName: "The Literary & Debating Society",
    clubAcronym: "DebSoc",
    category: "Literary",
    studentName: "Manav Joshi",
    studentRoll: "2023MEB1088",
    branch: "Mechanical Engineering",
    year: "2nd Year",
    email: "manav.me23@campus.edu",
    domain: "Parliamentary Debating",
    statement: "Active debater with 3 best-speaker awards at national inter-school tournaments. Eager to represent the college at national circuits.",
    portfolioUrl: "",
    status: "PENDING",
    interviewNotes: "Screening round pending adjudicator availability.",
    appliedDate: "2026-11-13T16:20:00.000Z"
  }
];

const CAMPUS_EVENTS = [
  {
    id: "evt-01",
    clubId: "gdsc",
    clubName: "Google Developer Student Club",
    title: "Google Cloud & Generative AI Bootcamp 2026",
    date: "2026-11-20T17:00:00",
    venue: "Main Auditorium & Online",
    type: "Workshop",
    status: "UPCOMING",
    attendees: 185,
    banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "evt-02",
    clubId: "robotics-society",
    clubName: "Autonomous Robotics Society",
    title: "Campus Robowars 2026: Combat Bot Championship",
    date: "2026-11-25T14:30:00",
    venue: "Outdoor Sports Arena",
    type: "Competition",
    status: "UPCOMING",
    attendees: 420,
    banner: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "evt-03",
    clubId: "dhwani-music",
    clubName: "Dhwani Music & Symphony Club",
    title: "Acoustic Unplugged Night: Autumn Melodies",
    date: "2026-11-28T18:30:00",
    venue: "Open Air Amphitheatre",
    type: "Cultural Showcase",
    status: "UPCOMING",
    attendees: 310,
    banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "evt-04",
    clubId: "ecell",
    clubName: "Entrepreneurship & Innovation Cell",
    title: "Campus Shark Tank: Student Pitch Round 1",
    date: "2026-12-05T10:00:00",
    venue: "Incubation Centre, 4th Floor",
    type: "Venture Pitch",
    status: "SCHEDULED",
    attendees: 140,
    banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&auto=format&fit=crop&q=80"
  }
];

const CAMPUS_MEMBERS = [
  { id: "mem-01", name: "Aarav Sharma", roll: "2022CSB1001", clubId: "gdsc", clubName: "Google Developer Student Club", role: "Club Lead", domain: "Cloud & DevOps", joined: "Aug 2023", email: "aarav.gdsc@campus.edu", status: "Active" },
  { id: "mem-02", name: "Pooja Patel", roll: "2023CSB1034", clubId: "gdsc", clubName: "Google Developer Student Club", role: "Technical Head", domain: "Web Development", joined: "Jan 2024", email: "pooja.tech@campus.edu", status: "Active" },
  { id: "mem-03", name: "Vikram Sengupta", roll: "2022MEB1020", clubId: "robotics-society", clubName: "Autonomous Robotics Society", role: "Chief Engineer", domain: "CAD & Dynamics", joined: "Sep 2023", email: "vikram.ars@campus.edu", status: "Active" },
  { id: "mem-04", name: "Tanvi Deshmukh", roll: "2023ECB1045", clubId: "dhwani-music", clubName: "Dhwani Music & Symphony Club", role: "Club President", domain: "Vocals", joined: "Oct 2023", email: "tanvi.dhwani@campus.edu", status: "Active" },
  { id: "mem-05", name: "Rohan Varma", roll: "2022CSB1072", clubId: "debsoc", clubName: "The Literary & Debating Society", role: "President", domain: "Parliamentary Debate", joined: "Aug 2022", email: "rohan.debsoc@campus.edu", status: "Active" },
  { id: "mem-06", name: "Riya Sen", roll: "2024ECB1015", clubId: "robotics-society", clubName: "Autonomous Robotics Society", role: "Core Member", domain: "Embedded Systems", joined: "Nov 2026", email: "riya.ec24@campus.edu", status: "Active" }
];
