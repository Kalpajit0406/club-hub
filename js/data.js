// js/data.js - Central Data Store for ClubHub Smart Campus Operating System

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
    tagline: "Bridging theory with industry-grade developer technologies.",
    description: "GDSC is the flagship tech community at TINT for students interested in Google developer technologies, open-source software, cloud computing, and real-world campus problem solving. We host hands-on codelabs, cloud study jams, and annual hackathons.",
    logo: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 260,
    established: 2019,
    domains: ["Web Development", "Mobile Dev (Flutter/Android)", "Cloud & DevOps", "Machine Learning", "Design & UI/UX"],
    meetingInfo: "Wednesdays at 5:00 PM | Tech Block Lab 302",
    achievements: [
      "Winner of National Smart City Hackathon 2025",
      "Published 12 open-source tools used across the college",
      "Mentored 400+ students in Google Cloud Study Jams"
    ],
    coordinators: [
      { name: "Aarav Sharma", role: "Club Lead", email: "gdsc.lead@tint.edu.in", phone: "+91 98765 43210" },
      { name: "Pooja Patel", role: "Technical Head", email: "pooja.tech@tint.edu.in" },
      { name: "Kunal Ghosh", role: "Outreach & PR", email: "kunal.pr@tint.edu.in" }
    ],
    socials: { github: "https://github.com", linkedin: "https://linkedin.com", instagram: "https://instagram.com" },
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
      { name: "Vikram Sengupta", role: "Chief Engineer", email: "vikram.ars@tint.edu.in" },
      { name: "Sneha Nair", role: "Operations Lead", email: "sneha.ars@tint.edu.in" }
    ],
    socials: { linkedin: "https://linkedin.com", instagram: "https://instagram.com" },
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
      { name: "Tanvi Deshmukh", role: "Club President", email: "tanvi.dhwani@tint.edu.in" },
      { name: "Rahul Menon", role: "Sound & Stage Lead", email: "rahul.sound@tint.edu.in" }
    ],
    socials: { instagram: "https://instagram.com", youtube: "https://youtube.com" },
    tags: ["Music", "Band", "Vocals", "Acoustic", "Live Shows"],
    featured: true
  },
  {
    id: "ecell",
    name: "Entrepreneurship & Innovation Cell",
    acronym: "E-Cell",
    category: "Entrepreneurship",
    tagline: "Fostering entrepreneurial mindset, angel investment pitches, and startup incubation.",
    description: "E-Cell nurtures student entrepreneurs from ideation to venture backing. We organize the annual E-Summit, student pitch competitions, founder talk sessions, and connect student builders with angel networks and startup incubators.",
    logo: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 95,
    established: 2018,
    domains: ["Startup Incubation", "Corporate Sponsorship & PR", "Event Management", "Content & Graphic Design"],
    meetingInfo: "Saturdays at 11:00 AM | Incubation Centre, 4th Floor",
    achievements: [
      "Helped 6 student startups raise pre-seed capital",
      "Hosted founders from Unicorn startups at E-Summit 2025",
      "Partnership with Bengal Chamber of Commerce & Industry"
    ],
    coordinators: [
      { name: "Arjun Banerjee", role: "Convener", email: "arjun.ecell@tint.edu.in" },
      { name: "Meera Sen", role: "Corporate Relations Lead", email: "meera.ecell@tint.edu.in" }
    ],
    socials: { linkedin: "https://linkedin.com", instagram: "https://instagram.com" },
    tags: ["Startups", "Business", "E-Summit", "Incubation", "Pitching"],
    featured: false
  },
  {
    id: "debsoc",
    name: "The Literary & Debating Society",
    acronym: "DebSoc",
    category: "Literary",
    tagline: "Sharp wit, articulate minds, and the courage to question.",
    description: "DebSoc represents the institution at Parliamentary Debates, Model United Nations (MUNs), slam poetry sessions, and youth parliaments. We groom articulate public speakers and critical thinkers.",
    logo: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
    status: "CLOSED",
    memberCount: 75,
    established: 2014,
    domains: ["Parliamentary Debating", "Model United Nations", "Creative Writing & Journalism", "Editorial Board"],
    meetingInfo: "Wednesdays at 4:30 PM | Seminar Hall 2",
    achievements: [
      "Champions of National Parliamentary Debate 2024",
      "Best Delegation Trophy at Eastern India MUN 2025",
      "Publishes the quarterly campus literary journal 'The Quill'"
    ],
    coordinators: [
      { name: "Rohan Varma", role: "President", email: "rohan.debsoc@tint.edu.in" }
    ],
    socials: { instagram: "https://instagram.com" },
    tags: ["Debate", "MUN", "Public Speaking", "Writing", "Literature"],
    featured: false
  },
  {
    id: "shutterbugs",
    name: "Shutterbugs Photography & Media",
    acronym: "Shutterbugs",
    category: "Cultural",
    tagline: "Capturing candid campus moments, cinematic frames, and visual stories.",
    description: "The official media and photojournalism wing of the campus. From covering fests, sports meets, and convocation to organizing photowalks and filmmaking workshops, Shutterbugs preserves college memories.",
    logo: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80",
    status: "OPEN",
    memberCount: 88,
    established: 2017,
    domains: ["Photography (DSLR/Mirrorless)", "Cinematography & Video Editing", "Drone Piloting", "Photojournalism"],
    meetingInfo: "Fridays at 4:30 PM | Media Room 108",
    achievements: [
      "Official media partners for 20+ university events",
      "Exhibited at Kolkata International Student Photo Biennale",
      "100K+ impressions on fest aftermovies"
    ],
    coordinators: [
      { name: "Devika Roy", role: "Media Head", email: "devika.photo@tint.edu.in" }
    ],
    socials: { instagram: "https://instagram.com", youtube: "https://youtube.com" },
    tags: ["Photography", "Filmmaking", "Editing", "Media", "Video"],
    featured: false
  }
];

// Pre-seeded Applications
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
    email: "aditya@tint.edu.in",
    domain: "Web Development",
    statement: "Experienced in HTML5, CSS3, JavaScript, and Tailwind. Built a college notes repository and looking to mentor junior developers and lead open-source projects.",
    portfolioUrl: "https://github.com/aditya-tint",
    status: "APPROVED",
    interviewNotes: "Selected for Core Frontend Wing. Orientation scheduled for Wednesday.",
    appliedDate: "2026-11-04T10:30:00.000Z"
  },
  {
    id: "app-102",
    clubId: "robotics-society",
    clubName: "Autonomous Robotics Society",
    clubAcronym: "ARS",
    category: "Technical",
    studentName: "Aditya Verma",
    studentRoll: "2023CSB1042",
    branch: "Computer Science & Engineering",
    year: "2nd Year",
    email: "aditya@tint.edu.in",
    domain: "Computer Vision (ROS)",
    statement: "Passionate about ROS2 navigation and drone autonomous obstacle avoidance. Eager to program rover prototypes for upcoming Robocon 2027.",
    portfolioUrl: "https://github.com/aditya-tint",
    status: "SHORTLISTED",
    interviewNotes: "Technical interview scheduled for Friday 4:30 PM in Robotics Lab.",
    appliedDate: "2026-11-06T14:15:00.000Z"
  },
  {
    id: "app-103",
    clubId: "ecell",
    clubName: "Entrepreneurship & Innovation Cell",
    clubAcronym: "E-Cell",
    category: "Entrepreneurship",
    studentName: "Aditya Verma",
    studentRoll: "2023CSB1042",
    branch: "Computer Science & Engineering",
    year: "2nd Year",
    email: "aditya@tint.edu.in",
    domain: "Startup Incubation",
    statement: "Interested in the tech startup ecosystem and building SaaS tools for college campus life.",
    portfolioUrl: "https://linkedin.com",
    status: "PENDING",
    interviewNotes: "Application received and under review by E-Cell coordinators.",
    appliedDate: "2026-11-12T09:00:00.000Z"
  }
];

// Campus Events & Hackathons Hub
const SEEDED_EVENTS = [
  {
    id: "evt-01",
    clubId: "gdsc",
    clubName: "Google Developer Student Club",
    title: "HackTINT 2026: 36-Hour National College Hackathon",
    date: "2026-11-28T09:00:00",
    endDate: "2026-11-29T21:00:00",
    venue: "Main Campus Auditorium & Tech Labs",
    category: "Hackathon",
    status: "UPCOMING",
    fee: "Free",
    prizes: "₹1,50,000 Cash Pool + Cloud Credits",
    capacity: 250,
    registeredCount: 184,
    description: "The biggest annual hackathon at TINT! Build solutions in AI/ML, Web3, Smart Healthcare, and Sustainable Tech. Free meals, mentor sessions, and official certificates.",
    banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    tags: ["Hackathon", "Coding", "Prizes", "AI/ML", "Web3"]
  },
  {
    id: "evt-02",
    clubId: "robotics-society",
    clubName: "Autonomous Robotics Society",
    title: "Campus Robowars 2026: 15kg & 30kg Bot Battle",
    date: "2026-12-02T13:30:00",
    endDate: "2026-12-02T19:00:00",
    venue: "Outdoor Tech Arena (Armored Cage)",
    category: "Competition",
    status: "UPCOMING",
    fee: "₹200 per team",
    prizes: "₹40,000 Cash + Hardware Trophies",
    capacity: 150,
    registeredCount: 98,
    description: "High-voltage combat robotics face-off. Wedge bots, drum spinners, and lifters battling in an arena built to international standards.",
    banner: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
    tags: ["Robotics", "Hardware", "Combat", "Competition"]
  },
  {
    id: "evt-03",
    clubId: "gdsc",
    clubName: "Google Developer Student Club",
    title: "Full-Stack Web Development Hands-on Bootcamp",
    date: "2026-12-08T16:00:00",
    endDate: "2026-12-08T19:00:00",
    venue: "Central Computer Center Lab 4",
    category: "Workshop",
    status: "UPCOMING",
    fee: "Free",
    prizes: "Certificate of Completion",
    capacity: 100,
    registeredCount: 78,
    description: "Master modern web architectures: Node.js, Express, REST APIs, and responsive design systems. Perfect for 1st and 2nd year engineering students.",
    banner: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    tags: ["Web Dev", "Workshop", "Coding", "Beginner Friendly"]
  },
  {
    id: "evt-04",
    clubId: "dhwani-music",
    clubName: "Dhwani Music & Symphony Club",
    title: "Tarang 2026: Winter Acoustic & Rock Night",
    date: "2026-12-14T17:30:00",
    endDate: "2026-12-14T22:00:00",
    venue: "Open Air Amphitheatre",
    category: "Cultural",
    status: "UPCOMING",
    fee: "Free (Student ID Mandatory)",
    prizes: "Live performances & merchandise",
    capacity: 600,
    registeredCount: 420,
    description: "An unforgettable evening with 8 campus bands, acoustic guitarists, Bollywood melodies, and a guest rock band finale under the stars.",
    banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    tags: ["Music", "Concert", "Cultural", "Live Band"]
  },
  {
    id: "evt-05",
    clubId: "ecell",
    clubName: "Entrepreneurship & Innovation Cell",
    title: "Campus Shark Tank: Student Pitch Round 1",
    date: "2026-12-18T10:00:00",
    endDate: "2026-12-18T16:00:00",
    venue: "Incubation Centre, 4th Floor",
    category: "Entrepreneurship",
    status: "UPCOMING",
    fee: "Free",
    prizes: "₹50,000 Seed Grant + Incubation Space",
    capacity: 80,
    registeredCount: 45,
    description: "Pitch your product, app, or hardware prototype to angel investors and industry alumni. Get funded and receive university incubator mentorship.",
    banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80",
    tags: ["Startups", "Pitch", "Funding", "E-Summit"]
  }
];

// Pre-seeded Event Registrations for Demo Student
const SEEDED_EVENT_REGISTRATIONS = [
  {
    id: "reg-evt-01",
    eventId: "evt-01",
    eventTitle: "HackTINT 2026: 36-Hour National College Hackathon",
    eventDate: "2026-11-28T09:00:00",
    venue: "Main Campus Auditorium & Tech Labs",
    studentName: "Aditya Verma",
    studentRoll: "2023CSB1042",
    studentEmail: "aditya@tint.edu.in",
    passCode: "TINT-HACK-8492-PASS",
    registeredAt: "2026-11-10T14:20:00.000Z",
    status: "CONFIRMED"
  }
];

// Campus Marketplace (Student-to-Student Buy/Sell/Exchange)
const SEEDED_MARKETPLACE = [
  {
    id: "mkt-01",
    title: "Casio FX-991CW ClassWiz Scientific Calculator",
    category: "Electronics",
    condition: "Like New",
    price: 850,
    originalPrice: 1450,
    description: "Approved for all MAKAUT semester examinations. 540+ functions, solar + battery, used for only one semester in 1st year. Perfect working condition with original box.",
    sellerName: "Rohan Varma",
    sellerRoll: "2022CSB1072",
    sellerBranch: "CSE 3rd Year",
    sellerPhone: "+91 98301 23456",
    sellerEmail: "rohan.debsoc@tint.edu.in",
    location: "Hostel Block A / Canteen",
    status: "AVAILABLE",
    postedDate: "2026-11-11T12:00:00.000Z",
    image: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "mkt-02",
    title: "Higher Engineering Mathematics by B.S. Grewal (44th Edition)",
    category: "Books",
    condition: "Good",
    price: 350,
    originalPrice: 799,
    description: "Comprehensive book for M1, M2, and M3. Clean pages with minimal pencil highlights. Essential for all engineering branches.",
    sellerName: "Pooja Patel",
    sellerRoll: "2023CSB1034",
    sellerBranch: "CSE 2nd Year",
    sellerPhone: "+91 98312 34567",
    sellerEmail: "pooja.tech@tint.edu.in",
    location: "Library Reading Room",
    status: "AVAILABLE",
    postedDate: "2026-11-12T15:30:00.000Z",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "mkt-03",
    title: "Engineering Mini Drafter + Sheet Holder Container",
    category: "Equipment",
    condition: "Like New",
    price: 399,
    originalPrice: 750,
    description: "Omega precision steel mini drafter with clamp, scale, and waterproof sheet carrier cylinder. Used for 1st Year Engineering Graphics.",
    sellerName: "Vikram Sengupta",
    sellerRoll: "2022MEB1020",
    sellerBranch: "Mechanical 3rd Year",
    sellerPhone: "+91 98323 45678",
    sellerEmail: "vikram.ars@tint.edu.in",
    location: "Mechanical Workshop Block",
    status: "AVAILABLE",
    postedDate: "2026-11-09T18:00:00.000Z",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "mkt-04",
    title: "Arduino UNO R3 Starter Kit with 30+ Sensors & Breadboard",
    category: "Electronics",
    condition: "Like New",
    price: 650,
    originalPrice: 1300,
    description: "Complete starter box for robotics/IoT projects: Arduino Uno board, USB cable, jumper wires, ultrasonic sensor, servo motor, and LEDs.",
    sellerName: "Aditya Verma",
    sellerRoll: "2023CSB1042",
    sellerBranch: "CSE 2nd Year",
    sellerPhone: "+91 98765 00001",
    sellerEmail: "aditya@tint.edu.in",
    location: "Tech Block Lab 302",
    status: "AVAILABLE",
    postedDate: "2026-11-13T10:15:00.000Z",
    image: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "mkt-05",
    title: "Operating System Concepts (10th Edition) - Silberschatz & Galvin",
    category: "Books",
    condition: "Good",
    price: 320,
    originalPrice: 850,
    description: "Classic 'Dinosaur' textbook for MAKAUT 5th semester OS syllabus. Very helpful for semester exams, GATE CS preparation, and tech interview rounds.",
    sellerName: "Aarav Sharma",
    sellerRoll: "2022CSB1001",
    sellerBranch: "CSE 3rd Year",
    sellerPhone: "+91 98765 43210",
    sellerEmail: "gdsc.lead@tint.edu.in",
    location: "Central Library Ground Floor",
    status: "AVAILABLE",
    postedDate: "2026-11-08T11:45:00.000Z",
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "mkt-06",
    title: "Pure Cotton Chemistry Lab Apron (Size 38, Knee Length)",
    category: "Equipment",
    condition: "Good",
    price: 150,
    originalPrice: 350,
    description: "Mandatory white apron for Chemistry lab and Workshop practice. Freshly washed, no tears or chemical stains.",
    sellerName: "Sneha Nair",
    sellerRoll: "2023ECB1080",
    sellerBranch: "ECE 2nd Year",
    sellerPhone: "+91 98345 67890",
    sellerEmail: "sneha.ars@tint.edu.in",
    location: "Girls Hostel Front Gate",
    status: "AVAILABLE",
    postedDate: "2026-11-10T16:20:00.000Z",
    image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500&auto=format&fit=crop&q=80"
  }
];

// Student Peer Network & Collab Feed
const SEEDED_NETWORK_POSTS = [
  {
    id: "post-01",
    authorName: "Aditya Verma",
    authorRoll: "2023CSB1042",
    authorBranch: "CSE 2nd Year",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    tag: "#HackathonTeam",
    content: "🚀 Building a team for Smart India Hackathon (SIH 2026)! We are tackling the Ministry of Education problem statement on automated campus accreditation tracking. Looking for 1 UI/UX designer (Figma) and 1 Backend developer (FastAPI / Node). DM or reply if interested!",
    upvotes: 18,
    userUpvoted: true,
    comments: [
      { id: "c-1", author: "Pooja Patel", text: "I can help with the frontend and Figma mockups! Let's connect after class.", time: "2 hours ago" },
      { id: "c-2", author: "Rohan Varma", text: "Great idea! Make sure to sync with GDSC mentors on Saturday.", time: "1 hour ago" }
    ],
    timestamp: "2026-11-14T11:30:00.000Z"
  },
  {
    id: "post-02",
    authorName: "Pooja Patel",
    authorRoll: "2023CSB1034",
    authorBranch: "CSE 2nd Year",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    tag: "#StudyGroup",
    content: "📚 Anyone interested in a joint study group for MAKAUT 5th Sem Computer Networks? We are holding peer revision sessions in the Central Library Discussion Room covering Subnetting, Bellman-Ford, and TCP flow control this Friday at 4 PM.",
    upvotes: 24,
    userUpvoted: false,
    comments: [
      { id: "c-3", author: "Aarav Sharma", text: "Count me in. I have past 5 years solved question papers printed.", time: "3 hours ago" }
    ],
    timestamp: "2026-11-13T16:00:00.000Z"
  },
  {
    id: "post-03",
    authorName: "Vikram Sengupta",
    authorRoll: "2022MEB1020",
    authorBranch: "Mechanical 3rd Year",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    tag: "#ProjectCollab",
    content: "🤖 Autonomous Robotics Society (ARS) is designing a 4-wheel rover with LiDAR mapping for indoor campus navigation. Need someone with Raspberry Pi / ROS2 experience. Hardware parts are fully sponsored by the lab!",
    upvotes: 31,
    userUpvoted: false,
    comments: [
      { id: "c-4", author: "Aditya Verma", text: "I have worked with ROS2 navigation nodes in simulation! Would love to contribute.", time: "4 hours ago" }
    ],
    timestamp: "2026-11-12T19:20:00.000Z"
  },
  {
    id: "post-04",
    authorName: "Arjun Banerjee",
    authorRoll: "2022ITB1012",
    authorBranch: "IT 3rd Year",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    tag: "#CampusLife",
    content: "🎉 Registrations for TechFest Invento 2026 volunteering are now officially open! Get hands-on experience organizing national events, meeting industry delegates, and receive official core coordinator certificates.",
    upvotes: 45,
    userUpvoted: true,
    comments: [],
    timestamp: "2026-11-11T14:00:00.000Z"
  }
];

// Recruiter & Placement Portal (Campus Drives & Internships)
const SEEDED_JOBS = [
  {
    id: "job-01",
    company: "Microsoft India",
    logo: "https://images.unsplash.com/photo-1642132652075-2b22ec78b022?w=120&auto=format&fit=crop&q=80",
    role: "Software Engineering Intern (Summer 2026)",
    type: "Internship",
    stipend: "₹1,25,000 / month",
    duration: "2 Months (May - July)",
    location: "Bengaluru / Hyderabad (Hybrid)",
    department: "Azure Cloud & AI Platform",
    eligibility: "B.Tech CSE / IT / ECE (3rd Year), Min CGPA: 8.0",
    deadline: "2026-12-15",
    skills: ["Data Structures & Algorithms", "C++ / Java", "Cloud Fundamentals", "System Design"],
    description: "Join Microsoft's Core Azure engineering team. You will write production software, collaborate with global engineers, and work on distributed cloud infrastructure solving high-throughput customer challenges.",
    applicantsCount: 38
  },
  {
    id: "job-02",
    company: "Google India",
    logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&auto=format&fit=crop&q=80",
    role: "STEP Intern (Student Training in Engineering)",
    type: "Internship",
    stipend: "₹1,10,000 / month",
    duration: "2-3 Months",
    location: "Bengaluru / Hyderabad",
    department: "Search & Android Platforms",
    eligibility: "B.Tech 2nd Year (All Engineering Branches), Min CGPA: 7.8",
    deadline: "2026-12-20",
    skills: ["Python / Java", "Problem Solving", "Object-Oriented Programming"],
    description: "Google STEP is a developmental internship for 2nd-year undergraduate students, offering hands-on project experience, mentorship, and professional coaching.",
    applicantsCount: 52
  },
  {
    id: "job-03",
    company: "Tata Consultancy Services (TCS)",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80",
    role: "TCS Digital R&D Intern",
    type: "Internship",
    stipend: "₹35,000 / month",
    duration: "6 Months",
    location: "Kolkata (New Town Campus)",
    department: "TCS Research & Digital Innovation",
    eligibility: "B.Tech CSE / IT / ECE / ME, Min CGPA: 7.0 (No Active Backlogs)",
    deadline: "2026-12-25",
    skills: ["JavaScript / React", "Python", "SQL", "Git"],
    description: "Work with TCS Digital Labs in Kolkata on enterprise web architectures, IoT telemetry dashboards, and cloud migration tooling.",
    applicantsCount: 67
  },
  {
    id: "job-04",
    company: "Swiggy Engineering",
    logo: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=120&auto=format&fit=crop&q=80",
    role: "Frontend Developer Intern",
    type: "Internship",
    stipend: "₹45,000 / month",
    duration: "3-6 Months",
    location: "Remote / Bengaluru",
    department: "Consumer Web & Quick Commerce",
    eligibility: "B.Tech 3rd or 4th Year, Demonstrated Web Projects",
    deadline: "2026-12-10",
    skills: ["React.js", "TypeScript", "Tailwind CSS", "Web Performance"],
    description: "Build fast, accessible, consumer-facing experiences used by millions of hungry Indians daily. Work directly with senior UI architects.",
    applicantsCount: 29
  }
];

// Pre-seeded Job Applications for Demo Student
const SEEDED_JOB_APPLICATIONS = [
  {
    id: "job-app-01",
    jobId: "job-01",
    company: "Microsoft India",
    role: "Software Engineering Intern (Summer 2026)",
    studentName: "Aditya Verma",
    studentRoll: "2023CSB1042",
    studentEmail: "aditya@tint.edu.in",
    studentCgpa: "8.74",
    githubUrl: "https://github.com/aditya-tint",
    resumeUrl: "https://aditya-portfolio.dev/resume.pdf",
    badgesIncluded: ["TINT Smart India Hackathon Winner", "GDSC Core Web Lead"],
    appliedDate: "2026-11-12T10:00:00.000Z",
    status: "UNDER_REVIEW",
    recruiterNotes: "Strong GitHub profile with verified college hackathon credential."
  }
];

// Verified Student Digital Achievement Badges
const SEEDED_VERIFIED_BADGES = [
  {
    id: "badge-01",
    studentEmail: "aditya@tint.edu.in",
    title: "TINT Smart India Hackathon Winner 2025",
    issuer: "Ministry of Education & TINT Innovation Cell",
    issueDate: "October 2025",
    verificationHash: "VER-SIH-9824X-TINT",
    category: "Hackathon",
    icon: "award",
    color: "#2563EB",
    description: "Awarded 1st place in Smart Automation track for developing real-time campus IoT power metering dashboard."
  },
  {
    id: "badge-02",
    studentEmail: "aditya@tint.edu.in",
    title: "Google Developer Student Club Core Contributor",
    issuer: "Google Developers India",
    issueDate: "September 2025",
    verificationHash: "VER-GDSC-4011B-IND",
    category: "Leadership",
    icon: "shield",
    color: "#16A34A",
    description: "Recognized for organizing 6 hands-on codelabs and mentoring 120+ first-year engineering students."
  },
  {
    id: "badge-03",
    studentEmail: "aditya@tint.edu.in",
    title: "Dean's Academic Excellence Honor Roll",
    issuer: "Academic Council, Techno International",
    issueDate: "July 2025",
    verificationHash: "VER-ACAD-2025-A71",
    category: "Academic",
    icon: "star",
    color: "#D97706",
    description: "Secured top 5 percentile in Department of Computer Science & Engineering (Semester SGPA 9.12)."
  }
];

// Pre-seeded Users with distinct roles
const SEEDED_USERS = [
  {
    id: "usr-01",
    name: "Aditya Verma",
    email: "aditya@tint.edu.in",
    roll: "2023CSB1042",
    branch: "Computer Science & Engineering",
    year: "2nd Year",
    role: "student",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-02",
    name: "Aarav Sharma",
    email: "gdsc.lead@tint.edu.in",
    roll: "2022CSB1001",
    branch: "Computer Science & Engineering",
    year: "3rd Year",
    role: "admin",
    clubId: "gdsc",
    clubName: "Google Developer Student Club",
    password: "adminpassword",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-03",
    name: "Priya Raman",
    email: "campus.hiring@microsoft.com",
    company: "Microsoft India",
    designation: "University Talent Acquisition Lead",
    role: "recruiter",
    password: "recruiterpassword",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
  }
];
