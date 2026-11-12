import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SAMPLE_USERS = [
  {
    username: "alex_design",
    displayName: "Alex Rivera",
    email: "alex.rivera@poppin.social",
    headline: "Design Director & Creative Technologist. Crafting interfaces that pop.",
    bio: "Obsessed with micro-interactions, typographic rhythm, and design systems. Former studio lead now building playful social experiences.",
    location: "San Francisco, CA",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    skills: ["UI/UX Design", "Design Systems", "Figma", "Tailwind CSS", "GSAP"],
    interests: ["Typography", "Creative Direction", "Web Animations", "Generative Art"],
  },
  {
    username: "sarah_code",
    displayName: "Sarah Chen",
    email: "sarah.chen@poppin.social",
    headline: "Staff Software Engineer. Distributed systems, Next.js & Node.js.",
    bio: "Building low-latency architectures and developer tools. Open source contributor and tech speaker.",
    location: "Seattle, WA",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    skills: ["TypeScript", "Next.js", "Node.js", "Prisma", "PostgreSQL", "Docker"],
    interests: ["Open Source", "Distributed Systems", "Cloud Computing", "APIs"],
  },
  {
    username: "marcus_ai",
    displayName: "Marcus Vance",
    email: "marcus.vance@poppin.social",
    headline: "AI Research Scientist exploring multimodal models and agentic workflows.",
    bio: "Bridging generative models and human-computer interfaces. Writing about agentic workflows and creative coding.",
    location: "Austin, TX",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    skills: ["Python", "PyTorch", "Generative AI", "React", "FastAPI"],
    interests: ["Multimodal AI", "Autonomous Agents", "Creative Coding", "Philosophy"],
  },
  {
    username: "elena_ux",
    displayName: "Elena Rostova",
    email: "elena.rostova@poppin.social",
    headline: "Product Designer & Accessibility Advocate",
    bio: "Designing WCAG 2.2 compliant experiences. Believer in high contrast, intentional motion, and inclusive design.",
    location: "Berlin, Germany",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80",
    skills: ["Accessibility", "Design Systems", "Prototyping", "User Research"],
    interests: ["Inclusion", "Typography", "Architecture", "Coffee"],
  },
  {
    username: "dev_dave",
    displayName: "David Miller",
    email: "david.miller@poppin.social",
    headline: "Backend & Cloud Engineer @ FinTech",
    bio: "PostgreSQL tuning, Kafka pipelines, and container orchestration at enterprise scale.",
    location: "Chicago, IL",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    skills: ["Go", "PostgreSQL", "Kafka", "Kubernetes", "Redis"],
    interests: ["Database Internals", "Distributed Consensus", "Cycling"],
  },
  {
    username: "priya_frontend",
    displayName: "Priya Patel",
    email: "priya.patel@poppin.social",
    headline: "Lead Frontend Engineer | React & Performance Specialist",
    bio: "Web Vitals fanatic, bundle size optimizer, and CSS architect. Making web apps run at 60fps.",
    location: "London, UK",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
    skills: ["React", "Next.js", "Web Performance", "Tailwind CSS", "TypeScript"],
    interests: ["Frontend Architecture", "Core Web Vitals", "Tea", "Bouldering"],
  },
  {
    username: "kenji_data",
    displayName: "Kenji Sato",
    email: "kenji.sato@poppin.social",
    headline: "Data Platform Architect & Analytics Engineer",
    bio: "Transforming raw data streams into real-time dashboards and predictive models. DuckDB and Polars enthusiast.",
    location: "Tokyo, Japan",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
    skills: ["Python", "DuckDB", "SQL", "Polars", "Data Pipelines"],
    interests: ["Data Visualization", "Open Data", "Photography", "Matcha"],
  },
  {
    username: "claire_product",
    displayName: "Claire Dupont",
    email: "claire.dupont@poppin.social",
    headline: "VP of Product. Turning customer friction into fluid flows.",
    bio: "Leading product teams across North America and Europe. Focus on user retention, PLG loops, and craft.",
    location: "Paris, France",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    skills: ["Product Strategy", "PLG", "Metrics", "User Interviews", "Roadmapping"],
    interests: ["SaaS Growth", "Behavioral Economics", "Art History"],
  },
  {
    username: "mateo_sec",
    displayName: "Mateo Silva",
    email: "mateo.silva@poppin.social",
    headline: "Application Security & Threat Modeling Consultant",
    bio: "Finding vulnerabilities before adversaries do. OWASP top 10 trainer and cryptography enthusiast.",
    location: "Madrid, Spain",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    skills: ["AppSec", "OAuth 2.0", "Penetration Testing", "Security Auditing"],
    interests: ["Cryptography", "Zero Knowledge Proofs", "Hiking"],
  },
  {
    username: "aisha_mobile",
    displayName: "Aisha Kamara",
    email: "aisha.kamara@poppin.social",
    headline: "iOS & React Native Craftsman. Fluid gestures and offline-first apps.",
    bio: "Building mobile apps that feel like physical objects. Deep into SQLite, Reanimated 3, and Swift.",
    location: "Nairobi, Kenya",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    skills: ["React Native", "Swift", "Offline First", "Animations", "TypeScript"],
    interests: ["Mobile Design", "Fintech Inclusion", "Afrobeats"],
  },
  {
    username: "lucas_devops",
    displayName: "Lucas Meyer",
    email: "lucas.meyer@poppin.social",
    headline: "Site Reliability Engineer | Zero-Downtime Deployments",
    bio: "Automating cloud infrastructure with Terraform and ArgoCD. Keeping latency under 50ms worldwide.",
    location: "Zurich, Switzerland",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    skills: ["Kubernetes", "Terraform", "Prometheus", "CI/CD", "AWS"],
    interests: ["Chaos Engineering", "Observability", "Skiing"],
  },
  {
    username: "maya_writer",
    displayName: "Maya Lin",
    email: "maya.lin@poppin.social",
    headline: "Technical Writer & Documentation Architect",
    bio: "Translating complex developer systems into crystal-clear specifications and delightful API guides.",
    location: "Toronto, Canada",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    skills: ["Technical Writing", "API Documentation", "Information Architecture", "Markdown"],
    interests: ["Plain Language", "Developer Experience", "Typography"],
  },
  {
    username: "tariq_founder",
    displayName: "Tariq Al-Mansoor",
    email: "tariq.almansoor@poppin.social",
    headline: "Bootstrapped Founder building B2B Micro-SaaS tools",
    bio: "Sharing lessons on organic acquisition, churn reduction, and shipping products in weeks rather than months.",
    location: "Dubai, UAE",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    skills: ["Bootstrapping", "Growth Marketing", "Full-Stack Web", "Product Strategy"],
    interests: ["Indie Hacking", "SaaS Metrics", "Specialty Coffee"],
  },
  {
    username: "zoe_graphics",
    displayName: "Zoe Kravitz-Lee",
    email: "zoe.kravitz@poppin.social",
    headline: "3D Motion Designer & WebGL Experimenter",
    bio: "Creating interactive 3D web experiences with Three.js, shaders, and WebGPU.",
    location: "New York, NY",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80",
    skills: ["Three.js", "WebGL", "Blender", "GLSL Shaders", "GSAP"],
    interests: ["Interactive Art", "Generative Graphics", "Electronic Music"],
  },
  {
    username: "josh_fullstack",
    displayName: "Josh Reynolds",
    email: "josh.reynolds@poppin.social",
    headline: "Full-Stack Engineer building real-time collaboration platforms",
    bio: "Socket.IO, WebRTC, and CRDTs for shared editing. Passionate about real-time sync systems.",
    location: "Denver, CO",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    skills: ["WebSockets", "Socket.IO", "TypeScript", "Node.js", "Redis"],
    interests: ["Realtime Sync", "CRDTs", "Snowboarding"],
  },
  {
    username: "hanna_growth",
    displayName: "Hanna Lindqvist",
    email: "hanna.lindqvist@poppin.social",
    headline: "Growth Product Manager & Retention Strategist",
    bio: "Experimentation frameworks, activation funnels, and customer feedback loops.",
    location: "Stockholm, Sweden",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    skills: ["Growth Loops", "A/B Testing", "Funnel Analytics", "Product Strategy"],
    interests: ["Behavioral Design", "Fika", "Nordic Design"],
  },
  {
    username: "carlos_db",
    displayName: "Carlos Mendez",
    email: "carlos.mendez@poppin.social",
    headline: "Database Administrator & Query Optimization Specialist",
    bio: "Indexing strategies, query execution plans, and multi-tenant database partitioning.",
    location: "Mexico City, Mexico",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    skills: ["PostgreSQL", "Query Optimization", "Prisma", "Database Architecture"],
    interests: ["Data Integrity", "Relational Algebra", "Street Food"],
  },
  {
    username: "nina_brand",
    displayName: "Nina Kowalski",
    email: "nina.kowalski@poppin.social",
    headline: "Brand Identity Designer & Design Systems Lead",
    bio: "Crafting iconic brand systems from concept to digital execution. Color theory and typography nerd.",
    location: "Warsaw, Poland",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    skills: ["Brand Systems", "Typography", "Visual Identity", "Figma"],
    interests: ["Print Design", "Mid-Century Poster Art", "Ceramics"],
  },
  {
    username: "vikram_cloud",
    displayName: "Vikram Singhania",
    email: "vikram.singhania@poppin.social",
    headline: "Cloud Architect specializing in Serverless & Edge Compute",
    bio: "Building distributed edge applications with Cloudflare Workers, DynamoDB, and Next.js ISR.",
    location: "Bengaluru, India",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
    skills: ["AWS", "Cloudflare Workers", "Serverless", "TypeScript", "Microservices"],
    interests: ["Edge Computing", "Open Source", "Badminton"],
  },
  {
    username: "olivia_qa",
    displayName: "Olivia Bennett",
    email: "olivia.bennett@poppin.social",
    headline: "Lead Quality Engineer & Automated Test Architect",
    bio: "Ensuring 100% test coverage through Playwright, Jest, contract testing, and performance profiling.",
    location: "Melbourne, Australia",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80",
    skills: ["Playwright", "E2E Testing", "CI/CD Automation", "TypeScript"],
    interests: ["Test Automation", "Reliability", "Surfing"],
  },
  {
    username: "gabriel_ml",
    displayName: "Gabriel Santos",
    email: "gabriel.santos@poppin.social",
    headline: "Machine Learning Engineer focused on Search & Embeddings",
    bio: "Vector databases, semantic retrieval, and ranking algorithms for high-throughput recommendation feeds.",
    location: "São Paulo, Brazil",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    skills: ["Embeddings", "Vector DBs", "Python", "PyTorch", "Information Retrieval"],
    interests: ["Feed Algorithms", "Natural Language Processing", "Bossa Nova"],
  },
  {
    username: "rachel_community",
    displayName: "Rachel Goldberg",
    email: "rachel.goldberg@poppin.social",
    headline: "Head of Developer Community & Ecosystem",
    bio: "Empowering developers to share their work, build public profiles, and organize regional hackathons.",
    location: "Boston, MA",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    skills: ["Community Building", "DevRel", "Event Organization", "Content Strategy"],
    interests: ["Open Source Communities", "Mentorship", "Podcasts"],
  },
  {
    username: "simon_rust",
    displayName: "Simon Vogel",
    email: "simon.vogel@poppin.social",
    headline: "Systems Engineer writing high-concurrency Rust services",
    bio: "Low-latency network programming, WebAssembly compilation, and memory-safe systems software.",
    location: "Munich, Germany",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    skills: ["Rust", "WebAssembly", "C++", "High Concurrency", "Linux Internals"],
    interests: ["Compiler Design", "Type Systems", "Mountaineering"],
  },
  {
    username: "ananya_crypto",
    displayName: "Ananya Iyer",
    email: "ananya.iyer@poppin.social",
    headline: "Zero-Knowledge Cryptography & Distributed Systems Researcher",
    bio: "Exploring verifiable compute, cryptographic accumulators, and privacy-preserving authentication.",
    location: "Singapore",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    skills: ["Cryptography", "Zero Knowledge", "ZK-SNARKs", "Rust", "Math"],
    interests: ["Decentralized Identity", "Number Theory", "Classical Music"],
  },
  {
    username: "leo_dev",
    displayName: "Leo Takahashi",
    email: "leo.takahashi@poppin.social",
    headline: "Full-Stack TypeScript Developer & Community Creator",
    bio: "Shipping products with Next.js App Router, Tailwind CSS, and Prisma. Documenting daily builds.",
    location: "Osaka, Japan",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
    skills: ["TypeScript", "Next.js", "Prisma", "Tailwind CSS", "React"],
    interests: ["Indie Hacking", "Clean Code", "Ramen"],
  },
  {
    username: "charlotte_infra",
    displayName: "Charlotte Dubois",
    email: "charlotte.dubois@poppin.social",
    headline: "Platform Engineer building internal developer platforms",
    bio: "K8s operators, developer portals, and telemetry pipelines for 500+ microservices.",
    location: "Lyon, France",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80",
    skills: ["Kubernetes", "Golang", "GitOps", "OpenTelemetry", "Helm"],
    interests: ["Developer Experience", "Infrastructure as Code", "Wine Making"],
  },
  {
    username: "dmitri_security",
    displayName: "Dmitri Orlov",
    email: "dmitri.orlov@poppin.social",
    headline: "Identity & Cryptographic Protocol Architect",
    bio: "FIDO2, WebAuthn, JWT security, and enterprise single sign-on implementations.",
    location: "Prague, Czechia",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    skills: ["WebAuthn", "OAuth 2.0", "OIDC", "Security Auditing", "Node.js"],
    interests: ["Zero Trust", "Chess", "Cyberpunk Literature"],
  },
  {
    username: "fatima_designer",
    displayName: "Fatima Zahra",
    email: "fatima.zahra@poppin.social",
    headline: "Visual & Motion Designer | Creating joyful micro-moments",
    bio: "Bridging branding, tactile UI illustrations, and kinetic typography for modern digital products.",
    location: "Casablanca, Morocco",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    skills: ["Motion Graphics", "Figma", "After Effects", "UI Animation"],
    interests: ["Kinetic Typography", "Architecture", "Arabic Calligraphy"],
  },
  {
    username: "oscar_backend",
    displayName: "Oscar Nygård",
    email: "oscar.nygard@poppin.social",
    headline: "High-Throughput API Engineer | Node.js & Go",
    bio: "Designing clean REST and WebSocket interfaces with strict validation and sub-millisecond response caches.",
    location: "Oslo, Norway",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    skills: ["Node.js", "Go", "Redis", "WebSockets", "Zod"],
    interests: ["API Design", "Distributed Systems", "Cross-Country Skiing"],
  },
  {
    username: "leila_ai",
    displayName: "Leila Haddad",
    email: "leila.haddad@poppin.social",
    headline: "LLM Systems Engineer & Agent Evaluator",
    bio: "Benchmarking reasoning models, implementing function calling routers, and optimizing context windows.",
    location: "Montreal, Canada",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    skills: ["LLMs", "Prompt Engineering", "Python", "LangChain", "Evaluation"],
    interests: ["Agentic Tooling", "AI Safety", "Ice Hockey"],
  },
  {
    username: "sam_react",
    displayName: "Sam Cooper",
    email: "sam.cooper@poppin.social",
    headline: "Senior React Engineer & Open-Source Maintainer",
    bio: "Building headless component libraries, accessible comboboxes, and smooth layout transitions.",
    location: "Portland, OR",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
    skills: ["React 19", "Next.js", "Tailwind CSS", "Design Tokens", "TypeScript"],
    interests: ["Component Systems", "Web Standards", "Craft Beer"],
  },
  {
    username: "tanya_ops",
    displayName: "Tanya Petrova",
    email: "tanya.petrova@poppin.social",
    headline: "Database Performance & Reliability Engineer",
    bio: "Optimizing PostgreSQL connection pools, replication delays, and automated failover mechanics.",
    location: "Amsterdam, Netherlands",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    skills: ["PostgreSQL", "PgBouncer", "Database Tuning", "Linux", "Grafana"],
    interests: ["Observability", "Database Internals", "Cycling"],
  },
];

async function main() {
  console.log(`Seeding ${SAMPLE_USERS.length} realistic profiles across platform...`);

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const createdUsers: any[] = [];

  for (const item of SAMPLE_USERS) {
    let user = await prisma.user.findUnique({ where: { email: item.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: item.email,
          passwordHash,
          tokenVersion: 1,
        },
      });

      await prisma.profile.create({
        data: {
          userId: user.id,
          username: item.username,
          displayName: item.displayName,
          headline: item.headline,
          bio: item.bio,
          location: item.location,
          avatar: item.avatar,
          coverImage: item.coverImage,
          skills: JSON.stringify(item.skills),
          interests: JSON.stringify(item.interests),
          links: JSON.stringify([
            { title: "Website", url: `https://${item.username}.social` },
            { title: "GitHub", url: `https://github.com/${item.username}` },
          ]),
          experience: JSON.stringify([]),
          education: JSON.stringify([]),
        },
      });

      await prisma.onboarding.create({
        data: {
          userId: user.id,
          role: item.headline.split(".")[0],
          headline: item.headline,
          skills: JSON.stringify(item.skills),
          interests: JSON.stringify(item.interests),
          isCompleted: true,
          step: 3,
        },
      });

      await prisma.privacySettings.create({
        data: {
          userId: user.id,
          isPrivate: false,
          showActivityStatus: true,
          allowTagging: true,
        },
      });
      console.log(`Created user @${item.username}`);
    }
    createdUsers.push(user);
  }

  // Create sample discussion posts across topics
  const samplePostsData = [
    {
      authorIdx: 0, // alex_design
      content: "Design systems are not component warehouses: they are shared vocabularies. When design tokens govern typography rhythm and spacing instead of arbitrary pixel values, velocity jumps 3x.",
      type: "PROJECT_SHOWCASE",
      tags: ["design", "ui_ux", "tokens"],
    },
    {
      authorIdx: 1, // sarah_code
      content: "We just migrated our session store to token versioning with indexed database queries. Result: instant password revocation across all active sessions with zero Redis dependency.",
      type: "ACHIEVEMENT",
      tags: ["typescript", "security", "nextjs"],
    },
    {
      authorIdx: 2, // marcus_ai
      content: "Multimodal agents with streaming tool calls change the pairing loop completely. Rather than waiting for a complete code generation, interactive diffs and generative UI render live in-flight.",
      type: "UPDATE",
      tags: ["ai", "agents", "react"],
    },
    {
      authorIdx: 4, // dev_dave
      content: "PSA on PostgreSQL index maintenance: REINDEX CONCURRENTLY during low-traffic windows saved our query execution times by 40% on tables with heavy update volume.",
      type: "UPDATE",
      tags: ["postgresql", "databases", "performance"],
    },
    {
      authorIdx: 5, // priya_frontend
      content: "Eliminated 120KB of unused JS bundles by swapping generic icon packages with direct SVG trees. Lighthouse score jumped from 82 to 99 on mobile.",
      type: "ACHIEVEMENT",
      tags: ["performance", "frontend", "nextjs"],
    },
  ];

  for (const postData of samplePostsData) {
    const author = createdUsers[postData.authorIdx];
    if (author) {
      const existing = await prisma.post.findFirst({
        where: { authorId: author.id, content: postData.content },
      });
      if (!existing) {
        await prisma.post.create({
          data: {
            authorId: author.id,
            content: postData.content,
            type: postData.type,
            tags: JSON.stringify(postData.tags),
            links: JSON.stringify([]),
          },
        });
      }
    }
  }

  // Seed initial community group conversation with members for testing
  const firstUsers = createdUsers.slice(0, 5);
  if (firstUsers.length >= 2) {
    const groupName = "Platform Architects & Builders";
    const existingConv = await prisma.conversation.findFirst({
      where: { name: groupName },
    });

    if (!existingConv) {
      const groupConv = await prisma.conversation.create({
        data: {
          isGroup: true,
          name: groupName,
          members: {
            create: firstUsers.map((u, idx) => ({
              userId: u.id,
              role: idx === 0 ? "ADMIN" : "MEMBER",
            })),
          },
        },
      });

      await prisma.message.create({
        data: {
          conversationId: groupConv.id,
          senderId: firstUsers[0].id,
          content: "Welcome everyone to the architects channel! Real-time messaging and group channels are now fully active.",
        },
      });

      await prisma.message.create({
        data: {
          conversationId: groupConv.id,
          senderId: firstUsers[1].id,
          content: "Glad to be here. WebSockets and typing indicators verified.",
        },
      });
      console.log(`Created sample group conversation: "${groupName}"`);
    }
  }

  // Seed default communities and memberships
  const SEED_COMMUNITIES = [
    {
      name: "Design Craft & Systems",
      slug: "design-craft",
      tagline: "Exploring out-of-distribution visual craft, typography, and micro-interactions.",
      description: "A hub for designers, creative technologists, and design system engineers crafting polished, distinctive interfaces that push the frontier beyond generic templates.",
      category: "Design",
      avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      rules: [
        "Critique the work constructively, not the person.",
        "Show real rendered interfaces and code over conceptual mocks.",
        "No generic AI-slop or copy-paste templates without opinionated craft.",
      ],
    },
    {
      name: "Distributed Systems & Next.js",
      slug: "distributed-systems",
      tagline: "High-concurrency backends, edge caching, and scalable web architectures.",
      description: "Deep technical breakdowns of low-latency systems, database concurrency, token versioning, and state-of-the-art full-stack TypeScript engineering.",
      category: "Engineering",
      avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
      rules: [
        "Include reproducible benchmarks or metrics when making performance claims.",
        "Respect security disclosure boundaries and OWASP standards.",
      ],
    },
    {
      name: "Autonomous Agents & GenAI",
      slug: "autonomous-agents",
      tagline: "Building interactive multimodal agents and pairing workflows.",
      description: "Researching and hacking on tool-calling agents, streaming generative UI, and real-time human-in-the-loop pair programming systems.",
      category: "AI & Research",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
      rules: [
        "Open-source weights and reproducibility are strongly encouraged.",
        "Keep discussion focused on architectures, evaluations, and agent tooling.",
      ],
    },
    {
      name: "Indie Founders & Builders",
      slug: "indie-founders",
      tagline: "From zero to sustainable software platforms with small teams.",
      description: "Sharing revenue milestones, growth experiments, product launches, and operational wisdom for independent creators building enduring businesses.",
      category: "Founders",
      avatar: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
      rules: [
        "Transparent numbers and actionable insights.",
        "No spammy link drops or unsolicited marketing DMs.",
      ],
    },
  ];

  for (const cData of SEED_COMMUNITIES) {
    const existing = await prisma.community.findUnique({
      where: { slug: cData.slug },
    });

    if (!existing) {
      const comm = await prisma.community.create({
        data: {
          name: cData.name,
          slug: cData.slug,
          tagline: cData.tagline,
          description: cData.description,
          category: cData.category,
          avatar: cData.avatar,
          coverImage: cData.coverImage,
          rules: JSON.stringify(cData.rules),
        },
      });

      // Add a couple of initial members
      if (createdUsers.length > 0) {
        await prisma.communityMember.create({
          data: {
            communityId: comm.id,
            userId: createdUsers[0].id,
            role: "ADMIN",
          },
        });
      }

      if (createdUsers.length > 1) {
        await prisma.communityMember.create({
          data: {
            communityId: comm.id,
            userId: createdUsers[1].id,
            role: "MEMBER",
          },
        });
      }

      // Link any existing posts matching tags
      const postsToLink = await prisma.post.findMany({
        where: { communityId: null },
        take: 3,
      });

      for (const p of postsToLink) {
        await prisma.post.update({
          where: { id: p.id },
          data: { communityId: comm.id },
        });
      }

      console.log(`Created sample community: "${comm.name}" (${comm.slug})`);
    }
  }

  console.log("Seeding finished successfully with complete users, communities, and conversations.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
