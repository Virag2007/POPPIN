import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 35+ realistic demo profiles and real-time conversation hubs...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 35 Diverse Realistic Creators across Engineering, Design, AI, and Product
  const demoUsers = [
    {
      username: "alex_design",
      displayName: "Alex Rivera",
      headline: "Principal Product Designer & Systems Lead",
      bio: "Crafting tactile micro-interactions and typographic rhythm. Building modern community software.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      skills: ["UI/UX Design", "Design Systems", "Figma", "Tailwind CSS", "GSAP"],
      interests: ["Typography", "Creative Direction", "Web Animations"],
    },
    {
      username: "sarah_code",
      displayName: "Sarah Chen",
      headline: "Staff Systems Engineer | Low Latency & WebSockets",
      bio: "Specializing in distributed streaming pipelines, real-time sync, and Next.js server actions.",
      location: "Seattle, WA",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
      skills: ["TypeScript", "Next.js", "Node.js", "WebSockets", "Prisma", "PostgreSQL"],
      interests: ["Distributed Systems", "Cloud Architecture", "Open Source"],
    },
    {
      username: "marcus_ai",
      displayName: "Marcus Vance",
      headline: "AI Research Scientist & Multimodal Agent Architect",
      bio: "Exploring reasoning kernels, synthetic data pipelines, and agentic UI interfaces.",
      location: "Austin, TX",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      skills: ["Python", "PyTorch", "Generative AI", "FastAPI", "React"],
      interests: ["Autonomous Agents", "Multimodal Interfaces", "Creative Coding"],
    },
    {
      username: "elena_ux",
      displayName: "Elena Rostova",
      headline: "Head of UX Research @ VibeStudio",
      bio: "Human-centered design advocate. Transforming qualitative user interviews into intuitive product flows.",
      location: "New York, NY",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      skills: ["User Research", "Usability Testing", "Design Thinking", "Figma"],
      interests: ["Accessibility", "Cognitive Psychology", "Behavioral Economics"],
    },
    {
      username: "david_k",
      displayName: "David Kim",
      headline: "Founding Engineer @ VectorBase",
      bio: "High performance databases, raft consensus algorithms, and Rust backend services.",
      location: "San Jose, CA",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      skills: ["Rust", "Go", "Distributed Storage", "Docker", "Kubernetes"],
      interests: ["Database Internals", "Kernel Programming", "Compilers"],
    },
    {
      username: "priya_dev",
      displayName: "Priya Sharma",
      headline: "Full-Stack Developer & Community Builder",
      bio: "Building accessible web apps with Next.js & Tailwind. Organizer of React Meetup Bengaluru.",
      location: "Bengaluru, India",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GraphQL"],
      interests: ["Developer Experience", "Tech Communities", "Mentorship"],
    },
    {
      username: "lucas_art",
      displayName: "Lucas Silva",
      headline: "Creative Technologist & 3D Web Artist",
      bio: "Pushing the boundaries of WebGL, Three.js, and interactive digital experiences.",
      location: "Berlin, Germany",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80",
      skills: ["Three.js", "WebGL", "Shader Art", "Blender", "GSAP"],
      interests: ["Creative Coding", "Generative Art", "Interactive Installations"],
    },
    {
      username: "maya_product",
      displayName: "Maya Lin",
      headline: "VP of Product @ Loomio",
      bio: "Obsessed with product-led growth, network effects, and high-velocity shipping culture.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
      skills: ["Product Strategy", "Growth Analytics", "User Interviews", "Roadmapping"],
      interests: ["Network Effects", "SaaS Metrics", "Team Dynamics"],
    },
    {
      username: "omar_sec",
      displayName: "Omar Farooq",
      headline: "Security Engineer & Ethical Hacker",
      bio: "Zero trust architectures, OAuth/JWT security audits, and defensive cloud infrastructure.",
      location: "London, UK",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
      skills: ["Application Security", "Penetration Testing", "OAuth2", "Cryptography"],
      interests: ["Infosec", "Privacy Rights", "Capture The Flag"],
    },
    {
      username: "chloe_font",
      displayName: "Chloe Bennett",
      headline: "Type Designer & Editorial Director",
      bio: "Drawing variable letterforms and designing publication layouts with strict micro-typography.",
      location: "Paris, France",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      skills: ["Typography", "Editorial Design", "Glyphs", "InDesign", "CSS"],
      interests: ["Print Culture", "Letterpress", "Monochrome Aesthetics"],
    },
    {
      username: "kenji_t",
      displayName: "Kenji Takahashi",
      headline: "Mobile Architect | React Native & Swift",
      bio: "Crafting native feel, 120fps gesture systems, and offline-first mobile synchronization.",
      location: "Tokyo, Japan",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
      skills: ["React Native", "Swift", "Kotlin", "Gesture Handler", "Reanimated"],
      interests: ["Mobile Performance", "Hardware APIs", "Minimalist Hardware"],
    },
    {
      username: "rachel_brand",
      displayName: "Rachel Green",
      headline: "Brand Strategist & Creative Copywriter",
      bio: "Finding the authentic voice behind ambitious tech startups. Anti-slop prose enthusiast.",
      location: "Toronto, Canada",
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80",
      skills: ["Brand Identity", "Copywriting", "Storytelling", "Content Strategy"],
      interests: ["Philosophy of Language", "Modern Literature", "Podcasting"],
    },
    {
      username: "viktor_s",
      displayName: "Viktor Soren",
      headline: "DevOps & Cloud Infrastructure Lead",
      bio: "Terraform wizard, multi-region failover, Kubernetes autoscaling, and telemetry observability.",
      location: "Stockholm, Sweden",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
      skills: ["Kubernetes", "AWS", "Terraform", "Prometheus", "CI/CD"],
      interests: ["Site Reliability", "Chaos Engineering", "Homelabs"],
    },
    {
      username: "aisha_khan",
      displayName: "Aisha Khan",
      headline: "AI Prompt Engineer & Agent Evaluator",
      bio: "Benchmarking LLM alignment, tool-use fidelity, and deterministic structured outputs.",
      location: "Dubai, UAE",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80",
      skills: ["Prompt Engineering", "LLM Evaluation", "Python", "LangChain"],
      interests: ["Artificial General Intelligence", "Philosophy of Mind", "AI Ethics"],
    },
    {
      username: "mateo_sound",
      displayName: "Mateo Rodriguez",
      headline: "Audio UI & Sound Interaction Designer",
      bio: "Designing earcons, spatial audio cues, and sensory feedback loops for interfaces.",
      location: "Barcelona, Spain",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
      skills: ["Sound Design", "Web Audio API", "Logic Pro", "Acoustics"],
      interests: ["Modular Synthesizers", "Spatial Audio", "Haptics"],
    },
    {
      username: "hannah_frontend",
      displayName: "Hannah Schmidt",
      headline: "Frontend Craftsperson | Clean Architecture",
      bio: "Obsessed with web standards, sub-100ms INP scores, and predictable component lifecycles.",
      location: "Zurich, Switzerland",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
      skills: ["React", "Tailwind CSS", "CSS Architecture", "Web Performance"],
      interests: ["Browser Internals", "Design Tokens", "Open Web Standards"],
    },
    {
      username: "tariq_data",
      displayName: "Tariq Mansoor",
      headline: "Data Engineering Lead | Real-Time Analytics",
      bio: "Streaming ingestion pipelines, Apache Kafka, ClickHouse, and sub-second dashboards.",
      location: "Chicago, IL",
      avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80",
      skills: ["Kafka", "ClickHouse", "SQL", "Python", "Data Modeling"],
      interests: ["Streaming Databases", "Real-time Telemetry", "Graph Analytics"],
    },
    {
      username: "sophia_w",
      displayName: "Sophia Wang",
      headline: "Design Engineer | Bridging Design & Production Code",
      bio: "Equal parts designer and software engineer. Crafting pixel-perfect, accessible components.",
      location: "Vancouver, Canada",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      skills: ["TypeScript", "Figma", "Tailwind CSS", "Storybook", "React"],
      interests: ["Design Engineering", "Component Libraries", "Micro-Interactions"],
    },
    {
      username: "andre_dev",
      displayName: "Andre Moreau",
      headline: "PostgreSQL & Database Optimization Specialist",
      bio: "Query plans, indexing strategies, write amplification tuning, and high-concurrency locks.",
      location: "Montreal, Canada",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
      skills: ["PostgreSQL", "Database Tuning", "Prisma", "Distributed Transactions"],
      interests: ["Query Optimization", "ACID Compliance", "Database Replicas"],
    },
    {
      username: "camila_growth",
      displayName: "Camila Duarte",
      headline: "Growth Lead & Community Evangelist",
      bio: "Scaling developer platforms, community flywheel loops, and hackathon programs.",
      location: "São Paulo, Brazil",
      avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&auto=format&fit=crop&q=80",
      skills: ["Growth Marketing", "Community Building", "Developer Relations", "Metrics"],
      interests: ["Open Source Communities", "Viral Loops", "Public Speaking"],
    },
    {
      username: "felix_sys",
      displayName: "Felix Weber",
      headline: "Real-Time Systems & WebSocket Engineer",
      bio: "Engineered scalable socket clusters handling 500k concurrent active chat connections.",
      location: "Frankfurt, Germany",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
      skills: ["WebSockets", "Node.js", "Redis", "TypeScript", "Socket.io"],
      interests: ["Event-Driven Architectures", "Low-Latency Networks", "Multiplexing"],
    },
    {
      username: "zoe_ai",
      displayName: "Zoe Patel",
      headline: "ML Systems & Embeddings Specialist",
      bio: "Building hybrid search architectures combining BM25 keyword matching with vector indexing.",
      location: "London, UK",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop&q=80",
      skills: ["Vector DBs", "Python", "Embeddings", "Information Retrieval"],
      interests: ["Neural Search", "RAG Architectures", "Semantic Clustering"],
    },
    {
      username: "liam_craft",
      displayName: "Liam O'Connor",
      headline: "UI Craftsman & Accessibility Specialist",
      bio: "Building WCAG 2.2 AA compliant experiences that delight every user without compromise.",
      location: "Dublin, Ireland",
      avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&auto=format&fit=crop&q=80",
      skills: ["Accessibility", "Semantic HTML", "Screen Readers", "Tailwind CSS"],
      interests: ["Inclusive Design", "Keyboard Navigation", "Color Contrast"],
    },
    {
      username: "jasmine_lead",
      displayName: "Jasmine Taylor",
      headline: "Engineering Director | Scaling Teams & Tech",
      bio: "Building high-trust engineering cultures, pragmatic roadmaps, and resilient cloud architectures.",
      location: "Denver, CO",
      avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&auto=format&fit=crop&q=80",
      skills: ["Engineering Management", "System Architecture", "Hiring", "Mentorship"],
      interests: ["Team Topology", "Distributed Work", "Tech Leadership"],
    },
    {
      username: "noah_game",
      displayName: "Noah Becker",
      headline: "Interactive Game UI & Shader Developer",
      bio: "Bringing tactile game-feel, particle effects, and screen shaders to standard web products.",
      location: "Munich, Germany",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      skills: ["Shaders", "GLSL", "Canvas API", "TypeScript", "Game Feel"],
      interests: ["Game Design", "Procedural Generation", "Juice & Feel"],
    },
    {
      username: "ananya_product",
      displayName: "Ananya Roy",
      headline: "Product Lead for Collaborative Tools",
      bio: "Building multiplayer canvas editors and live presence indicators for creators.",
      location: "Singapore",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80",
      skills: ["Product Management", "Multiplayer UX", "CRDTs", "User Research"],
      interests: ["Collaborative Software", "Local-First Movement", "Presence Systems"],
    },
    {
      username: "artur_crypto",
      displayName: "Artur Nowak",
      headline: "Decentralized Systems & Cryptography Dev",
      bio: "Zero-knowledge proofs, end-to-end encryption protocols, and sovereign identity solutions.",
      location: "Warsaw, Poland",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      skills: ["Cryptography", "E2EE", "Rust", "Zero Knowledge", "TypeScript"],
      interests: ["Privacy Tech", "Decentralized Networks", "Sovereign Identity"],
    },
    {
      username: "fatima_design",
      displayName: "Fatima Al-Hassan",
      headline: "Visual Identity & Graphic Systems Director",
      bio: "Creating cohesive design tokens, harmonious color palettes, and memorable brand universes.",
      location: "Riyadh, Saudi Arabia",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      skills: ["Graphic Systems", "Art Direction", "Color Theory", "Figma"],
      interests: ["Arabic Typography", "Editorial Art", "Visual Semiotics"],
    },
    {
      username: "ethan_sre",
      displayName: "Ethan Cole",
      headline: "Staff Reliability Engineer | High Scale",
      bio: "Designing self-healing microservices, SLO budgets, and zero-downtime database migrations.",
      location: "Portland, OR",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      skills: ["SRE", "Observability", "PostgreSQL", "Go", "Distributed Tracing"],
      interests: ["Post-Mortem Culture", "Resilience Engineering", "Incident Response"],
    },
    {
      username: "nadia_creative",
      displayName: "Nadia Popova",
      headline: "Creative Lead @ Poppin Collective",
      bio: "Empowering creators to showcase their craft. Curator of daily standout prototypes.",
      location: "Milan, Italy",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
      skills: ["Curation", "Community Building", "Visual Storytelling", "Copywriting"],
      interests: ["Design History", "Creator Economy", "Experimental UI"],
    },
    {
      username: "gabriel_fullstack",
      displayName: "Gabriel Santos",
      headline: "Senior Full Stack Dev | Next.js & S3 Cloud",
      bio: "Building robust cloud upload pipelines, responsive web apps, and developer documentation.",
      location: "Lisbon, Portugal",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
      skills: ["Next.js", "TypeScript", "AWS S3", "Prisma", "Tailwind CSS"],
      interests: ["Developer Tooling", "Cloud Architecture", "Clean Code"],
    },
    {
      username: "kevin_ai",
      displayName: "Kevin Zhang",
      headline: "Autonomous Agents Engineer @ Nexus",
      bio: "Implementing MCP tools, multi-agent swarms, and human-in-the-loop workflows.",
      location: "Boston, MA",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
      skills: ["MCP", "Python", "TypeScript", "LangChain", "Autonomous Systems"],
      interests: ["Agent Evaluation", "Multi-Agent Coordination", "Context Windows"],
    },
    {
      username: "leila_mobile",
      displayName: "Leila Mansour",
      headline: "Native iOS & SwiftUI Craftsperson",
      bio: "Crafting fluid animations, haptic cues, and beautiful Apple Design Award-tier mobile apps.",
      location: "Paris, France",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      skills: ["SwiftUI", "iOS", "CoreAnimation", "Human Interface Guidelines"],
      interests: ["Mobile Design", "Haptics", "Spatial Computing"],
    },
    {
      username: "josh_devrel",
      displayName: "Josh Miller",
      headline: "Developer Relations & Technical Educator",
      bio: "Explaining complex system architectures with clear diagrams, live code, and empathy.",
      location: "Austin, TX",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
      skills: ["Technical Writing", "Developer Advocacy", "Public Speaking", "React"],
      interests: ["Interactive Tutorials", "Developer Communities", "Open Source"],
    },
    {
      username: "clara_founder",
      displayName: "Clara Johansson",
      headline: "Founder & CEO @ Studio Craft",
      bio: "Bootstrapping profitable developer tools. Writing about product market fit and company building.",
      location: "Copenhagen, Denmark",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      skills: ["Product Strategy", "Bootstrapping", "Team Building", "Go-To-Market"],
      interests: ["Venture Scale vs Bootstrapping", "Creator Economy", "Company Culture"],
    },
  ];

  const createdUserRecords: { id: string; username: string }[] = [];

  for (const u of demoUsers) {
    const email = `${u.username}@poppin.social`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
      },
      create: {
        email,
        passwordHash,
        tokenVersion: 1,
      },
    });

    // Ensure Profile exists and is up to date
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        username: u.username,
        displayName: u.displayName,
        headline: u.headline,
        bio: u.bio,
        location: u.location,
        avatar: u.avatar,
        coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
        skills: JSON.stringify(u.skills),
        interests: JSON.stringify(u.interests),
      },
      create: {
        userId: user.id,
        username: u.username,
        displayName: u.displayName,
        headline: u.headline,
        bio: u.bio,
        location: u.location,
        avatar: u.avatar,
        coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
        skills: JSON.stringify(u.skills),
        interests: JSON.stringify(u.interests),
        links: JSON.stringify([
          { title: "Portfolio", url: `https://${u.username}.dev` },
          { title: "GitHub", url: `https://github.com/${u.username}` },
        ]),
      },
    });

    // Ensure Onboarding completed
    await prisma.onboarding.upsert({
      where: { userId: user.id },
      update: { isCompleted: true, step: 3 },
      create: {
        userId: user.id,
        role: u.headline,
        headline: u.headline,
        skills: JSON.stringify(u.skills),
        interests: JSON.stringify(u.interests),
        step: 3,
        isCompleted: true,
      },
    });

    // Ensure PrivacySettings
    await prisma.privacySettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        isPrivate: false,
        allowTagging: true,
        showActivityStatus: true,
      },
    });

    createdUserRecords.push({ id: user.id, username: u.username });
  }

  console.log(`Created/Verified ${createdUserRecords.length} realistic profiles!`);

  // Establish reciprocal Follow relationships for vibrant feeds
  const alex = createdUserRecords.find((u) => u.username === "alex_design")!;
  const sarah = createdUserRecords.find((u) => u.username === "sarah_code")!;
  const marcus = createdUserRecords.find((u) => u.username === "marcus_ai")!;

  for (let i = 0; i < createdUserRecords.length; i++) {
    const currentUser = createdUserRecords[i];
    // Follow Alex, Sarah, and Marcus
    if (currentUser.id !== alex.id) {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: { followerId: currentUser.id, followingId: alex.id },
        },
        update: {},
        create: { followerId: currentUser.id, followingId: alex.id },
      });
    }
    if (currentUser.id !== sarah.id) {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: { followerId: currentUser.id, followingId: sarah.id },
        },
        update: {},
        create: { followerId: currentUser.id, followingId: sarah.id },
      });
    }
  }

  // Pre-seed Real-time Conversations & Groups
  console.log("Setting up real-time group conversations...");

  // Group 1: Design Systems Guild
  const designGroup = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: "🎨 Design Systems Core Guild",
      avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200",
      members: {
        create: [
          { userId: alex.id, role: "ADMIN" },
          { userId: sarah.id, role: "MEMBER" },
          { userId: marcus.id, role: "MEMBER" },
          { userId: createdUserRecords[3].id, role: "MEMBER" },
          { userId: createdUserRecords[6].id, role: "MEMBER" },
          { userId: createdUserRecords[9].id, role: "MEMBER" },
        ],
      },
      messages: {
        create: [
          {
            senderId: alex.id,
            content: "Welcome everyone to the Design Systems Core Guild! 🚀 Here we discuss design tokens, fluid typography, and micro-interactions.",
          },
          {
            senderId: sarah.id,
            content: "Excited to be here! Just set up WebSockets for real-time live typing indicators in our chat window. Give it a test!",
          },
          {
            senderId: marcus.id,
            content: "Testing real-time sync! The typing indicator bubble looks crisp.",
          },
        ],
      },
    },
  });

  // Group 2: Distributed Systems & Backend Engineers
  const systemsGroup = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: "⚡ Distributed Systems & Next.js",
      avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200",
      members: {
        create: [
          { userId: sarah.id, role: "ADMIN" },
          { userId: alex.id, role: "MEMBER" },
          { userId: createdUserRecords[4].id, role: "MEMBER" }, // david_k
          { userId: createdUserRecords[12].id, role: "MEMBER" }, // viktor_s
          { userId: createdUserRecords[20].id, role: "MEMBER" }, // felix_sys
        ],
      },
      messages: {
        create: [
          {
            senderId: sarah.id,
            content: "Welcome systems engineers! We're talking WebSockets, PostgreSQL indexing, and sub-100ms response targets.",
          },
          {
            senderId: createdUserRecords[20].id, // felix_sys
            content: "Our WebSocket server is now running on port 3001 with real-time broadcast and room channels.",
          },
        ],
      },
    },
  });

  // Direct conversation between Alex & Sarah
  await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: alex.id, role: "MEMBER" },
          { userId: sarah.id, role: "MEMBER" },
        ],
      },
      messages: {
        create: [
          {
            senderId: alex.id,
            content: "Hey Sarah! Have you checked out the new Reddit-style community layout?",
          },
          {
            senderId: sarah.id,
            content: "Yes! Upvoting, nested comment trees, and the right-hand sidebar look fantastic.",
          },
        ],
      },
    },
  });

  // Seed Vibrant Feed Posts with Rich Media & Engagement
  console.log("Seeding rich showcase posts, media, and comments...");
  const showcasePostsData = [
    {
      author: alex,
      type: "PROJECT_SHOWCASE",
      content: "Just shipped our design token architecture with fluid typography scaling and instant theme switching! We eliminated layout jitter and kept our CSS payload under 12kb. Check out the live component playground.",
      tags: ["design", "typescript", "tailwind", "craft"],
      links: [{ title: "Figma Tokens", url: "https://figma.com/@alex_design" }, { title: "Documentation", url: "https://alex_design.dev/tokens" }],
      mediaUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
    },
    {
      author: sarah,
      type: "ACHIEVEMENT",
      content: "Sub-50ms message fanout achieved! Our standalone WebSocket server on port 3001 now broadcasts typing indicators, real-time message drops, and unread badges across hundreds of connected client rooms.",
      tags: ["websockets", "nodejs", "scalability", "realtime"],
      links: [{ title: "GitHub Repo", url: "https://github.com/sarah_code/fast-ws" }],
      mediaUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
    },
    {
      author: marcus,
      type: "PROJECT_SHOWCASE",
      content: "Introducing our multimodal agent playground: zero-shot code synthesis with live browser verification. The agent generates responsive layouts and tests them directly using Chrome DevTools protocol.",
      tags: ["ai", "agents", "research", "nextjs"],
      links: [{ title: "Research Paper", url: "https://arxiv.org/abs/2403.0001" }],
      mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    },
    {
      author: createdUserRecords[3], // elena_ux
      type: "UPDATE",
      content: "Completed 24 usability interviews on community onboarding flows. The biggest takeaway: users want to search and explore content BEFORE being forced to authenticate. Instant handle reservation also boosted activation by 43%.",
      tags: ["ux", "product", "growth", "research"],
      links: [],
      mediaUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80",
    },
    {
      author: createdUserRecords[4], // david_k
      type: "LOOKING_FOR",
      content: "Looking for 2 systems engineers to collaborate on an open-source Rust storage engine adapter compatible with S3 and Cloudflare R2 multipart streaming. Drop a comment or DM if you want to hack together!",
      tags: ["rust", "storage", "s3", "opensource"],
      links: [{ title: "GitHub RFC", url: "https://github.com/david_k/s3-stream-engine" }],
      mediaUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    },
  ];

  for (const postData of showcasePostsData) {
    const post = await prisma.post.create({
      data: {
        authorId: postData.author.id,
        content: postData.content,
        type: postData.type,
        tags: JSON.stringify(postData.tags),
        links: JSON.stringify(postData.links),
        media: {
          create: [
            {
              url: postData.mediaUrl,
              mimeType: "image/jpeg",
              size: 204800,
              order: 0,
            },
          ],
        },
      },
    });

    // Add Likes from 3 other users
    const likers = createdUserRecords.filter((u) => u.id !== postData.author.id).slice(0, 4);
    for (const liker of likers) {
      await prisma.like.create({
        data: {
          postId: post.id,
          userId: liker.id,
        },
      });
    }

    // Add Discussion Comments
    const commentAuthor = createdUserRecords.find((u) => u.id !== postData.author.id)!;
    const parent = await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: commentAuthor.id,
        content: "Outstanding craft here! How are you handling cache invalidation on mutations?",
      },
    });

    // Reply from post author
    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: postData.author.id,
        content: "Great question! We use targeted revalidatePath tags combined with optimistic UI updates.",
        replyToCommentId: parent.id,
      },
    });
  }

  console.log(`Seeding completed successfully! 35 users created with 2 real-time groups (${designGroup.id}, ${systemsGroup.id}) and ${showcasePostsData.length} showcase posts.`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
