import "../tests/load-env";
import prisma from "../lib/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Starting PostgreSQL database seed...");

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Core Builder Creators
  const creators = [
    {
      email: "alex@poppin.local",
      username: "alex_design",
      displayName: "Alex Rivera",
      headline: "Principal Product Designer & Hub Founder",
      bio: "Obsessed with design engineering, fluid typography, and building tools that feel physical.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      location: "San Francisco, CA",
      links: JSON.stringify([
        { platform: "website", url: "https://alexrivera.design" },
        { platform: "github", url: "https://github.com/alexrivera" },
        { platform: "twitter", url: "https://x.com/alexdesign" },
      ]),
      skills: JSON.stringify(["Design Systems", "Figma", "UI/UX", "Tailwind CSS", "Motion Design"]),
      interests: JSON.stringify(["Design Craft", "Typography", "Interactive UI"]),
    },
    {
      email: "sarah@poppin.local",
      username: "sarah_code",
      displayName: "Sarah Chen",
      headline: "Distributed Systems & Next.js Architect",
      bio: "Building zero-lag distributed architectures and high-throughput real-time systems.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
      location: "Seattle, WA",
      links: JSON.stringify([
        { platform: "website", url: "https://sarahchen.dev" },
        { platform: "github", url: "https://github.com/sarahchen" },
      ]),
      skills: JSON.stringify(["TypeScript", "Distributed Systems", "PostgreSQL", "Next.js", "Rust"]),
      interests: JSON.stringify(["Cloud Architecture", "Database Internals", "Real-Time"]),
    },
    {
      email: "marcus@poppin.local",
      username: "marcus_ai",
      displayName: "Marcus Vance",
      headline: "ML Researcher & Agent Architect",
      bio: "Exploring autonomous agent architectures, local LLM quantization, and tool calling evals.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80",
      location: "New York, NY",
      links: JSON.stringify([
        { platform: "website", url: "https://marcusvance.ai" },
        { platform: "github", url: "https://github.com/marcusvance" },
      ]),
      skills: JSON.stringify(["Python", "Machine Learning", "PyTorch", "Agents", "TypeScript"]),
      interests: JSON.stringify(["Generative AI", "Agent Workflows", "Evals"]),
    },
    {
      email: "elena@poppin.local",
      username: "elena_ux",
      displayName: "Elena Rostova",
      headline: "Design Systems Lead & Design Engineer",
      bio: "Uniting code and design through strict token contracts, accessible components, and micro-interactions.",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
      location: "London, UK",
      links: JSON.stringify([
        { platform: "website", url: "https://elenarostova.design" },
      ]),
      skills: JSON.stringify(["Figma", "Design Tokens", "React", "Accessibility", "CSS"]),
      interests: JSON.stringify(["Design Systems", "Web Standards", "Open Source"]),
    },
    {
      email: "devon@poppin.local",
      username: "devon_sys",
      displayName: "Devon Miller",
      headline: "Cloud Infra & Database Engineer",
      bio: "Database reliability, Neon PostgreSQL connection pooling, and Kubernetes orchestration.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
      location: "Austin, TX",
      links: JSON.stringify([
        { platform: "github", url: "https://github.com/devonmiller" },
      ]),
      skills: JSON.stringify(["PostgreSQL", "Docker", "Kubernetes", "Linux", "Go"]),
      interests: JSON.stringify(["Infrastructure", "DevOps", "Database Performance"]),
    },
  ];

  const userMap = new Map<string, string>(); // username -> userId

  for (const c of creators) {
    let user = await prisma.user.findUnique({ where: { email: c.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: c.email,
          passwordHash: defaultPasswordHash,
          profile: {
            create: {
              username: c.username,
              displayName: c.displayName,
              headline: c.headline,
              bio: c.bio,
              avatar: c.avatar,
              coverImage: c.coverImage,
              location: c.location,
              links: c.links,
              skills: c.skills,
              interests: c.interests,
            },
          },
          onboarding: {
            create: {
              isCompleted: true,
              step: 3,
              role: c.headline,
              headline: c.headline,
              skills: c.skills,
              interests: c.interests,
            },
          },
          privacySettings: {
            create: {
              isPrivate: false,
              showActivityStatus: true,
              allowTagging: true,
            },
          },
        },
      });
      console.log(`  ✓ Created user @${c.username}`);
    } else {
      console.log(`  • User @${c.username} already exists`);
    }
    userMap.set(c.username, user.id);
  }

  // 2. Default Communities
  const communities = [
    {
      slug: "design-craft",
      name: "Design Craft & Systems",
      tagline: "Interface craft, typography, motion, and design engineering.",
      description: "A home for product designers, creative technologists, and design system architects obsessing over every pixel, frame, and micro-interaction.",
      category: "Design",
      avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      rules: JSON.stringify([
        "Critique work constructively with specific observations.",
        "No uncredited design theft.",
        "Share working code or design tokens where possible.",
      ]),
      lead: "alex_design",
    },
    {
      slug: "distributed-systems",
      name: "Distributed Systems & Cloud",
      tagline: "Consensus, high-throughput architectures, databases, and infra.",
      description: "Deep technical discussions on distributed consensus, database internals, low-latency queues, and cloud runtime design.",
      category: "Engineering",
      avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
      rules: JSON.stringify([
        "Include benchmark figures or architectural trade-offs.",
        "No vendor wars without technical reasoning.",
        "Benchmark before optimizing.",
      ]),
      lead: "sarah_code",
    },
    {
      slug: "generative-agents",
      name: "Generative Agents & AI",
      tagline: "Autonomous agent architectures, tool calling, and local models.",
      description: "Explorations into agent workflows, real-time multimodal intelligence, evals, and prompt choreography.",
      category: "AI & Research",
      avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80",
      rules: JSON.stringify([
        "Focus on production agent implementations.",
        "Share prompt evals and failure cases.",
        "Respect safety and privacy standards.",
      ]),
      lead: "marcus_ai",
    },
    {
      slug: "indie-founders",
      name: "Indie Founders & Builders",
      tagline: "Bootstrapping software, public metrics, and technical growth.",
      description: "A supportive hub for engineers and creators building profitable micro-SaaS, developer tools, and niche products.",
      category: "Founders",
      avatar: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
      rules: JSON.stringify([
        "Be honest about metrics and milestones.",
        "Constructive feedback on launches.",
        "No spam or crypto shilling.",
      ]),
      lead: "devon_sys",
    },
    {
      slug: "creative-code",
      name: "Creative Code & WebGL",
      tagline: "Shaders, Canvas, GSAP, Three.js, and interactive digital art.",
      description: "Where code meets art. Pushing the boundaries of web animation, GPU shaders, physics simulations, and generative soundscapes.",
      category: "Engineering",
      avatar: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80",
      rules: JSON.stringify([
        "Post working CodePen or live URLs where possible.",
        "Specify library and techniques used.",
        "Keep motion purposeful.",
      ]),
      lead: "alex_design",
    },
  ];

  const communityMap = new Map<string, string>(); // slug -> id

  for (const c of communities) {
    const creatorId = userMap.get(c.lead) || Array.from(userMap.values())[0];
    let comm = await prisma.community.findUnique({ where: { slug: c.slug } });
    if (!comm) {
      comm = await prisma.community.create({
        data: {
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          description: c.description,
          category: c.category,
          avatar: c.avatar,
          coverImage: c.coverImage,
          rules: c.rules,
        },
      });
      console.log(`  ✓ Created community #${c.slug}`);
    } else {
      console.log(`  • Community #${c.slug} already exists`);
    }
    communityMap.set(c.slug, comm.id);

    // Ensure all seed creators are members
    for (const [, uid] of userMap.entries()) {
      const existingMember = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: comm.id, userId: uid } },
      });
      if (!existingMember) {
        await prisma.communityMember.create({
          data: {
            communityId: comm.id,
            userId: uid,
            role: uid === creatorId ? "ADMIN" : "MEMBER",
          },
        });
      }
    }
  }

  // 3. Seed Posts & Discussions
  const existingPostCount = await prisma.post.count();
  if (existingPostCount === 0) {
    console.log("  Writing seed posts...");

    const posts = [
      {
        author: "alex_design",
        community: "design-craft",
        type: "PROJECT_SHOWCASE",
        content: `Just shipped the monochromatic design token contract for our new component architecture.

Key principles we locked in:
1. Pure monochromatic base (#09090B on #FCFBF9 warm off-white).
2. Equal left and right content margins across all viewports.
3. Zero decorative glows or fake gradients—all richness belongs in genuine user media and real code.

Would love thoughts from design engineers on token naming conventions!`,
        tags: JSON.stringify(["designsystems", "tokens", "monochrome", "uiux"]),
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
      },
      {
        author: "sarah_code",
        community: "distributed-systems",
        type: "UPDATE",
        content: `Benchmarked Neon PostgreSQL serverless pooling with connection limits under high-concurrency websocket events.

Results:
- Direct interactive transaction latency dropped from 140ms to 24ms with pooled query routers.
- Extended transaction timeout to 25s avoids P2028 closing errors during slow multi-step queries.
- Architecture scales to hundreds of concurrent socket peers effortlessly.`,
        tags: JSON.stringify(["postgresql", "database", "neon", "architecture"]),
      },
      {
        author: "marcus_ai",
        community: "generative-agents",
        type: "ACHIEVEMENT",
        content: `Released a reproducible test harness for evaluating multi-turn agent coordination. 

The biggest challenge isn't tool execution—it's deterministic state recovery when background tasks complete out-of-order. Excited to share the full writeup and benchmark traces this week.`,
        tags: JSON.stringify(["ai", "agents", "evaluation", "opensource"]),
      },
      {
        author: "elena_ux",
        community: "design-craft",
        type: "LOOKING_FOR",
        content: `Looking for feedback on accessible touch targets for collapsible sidebar rails on mobile web. 

Currently enforcing 44x44px minimum bounding boxes with 8px gutters. Are you handling swipe gestures with Framer/GSAP or native CSS scroll snap?`,
        tags: JSON.stringify(["accessibility", "mobile", "css", "interaction"]),
      },
      {
        author: "devon_sys",
        community: "indie-founders",
        type: "PROJECT_SHOWCASE",
        content: `Bootstrapping in public: Crossed our first 100 active community members on POPPIN!

Architecture notes:
- Next.js 15.5 App Router + React 19
- Dedicated Node.js Socket.IO server on Railway
- Cloudinary signed direct browser uploads
- Neon PostgreSQL with zero mock reliance

Pure craft and persistence wins every time.`,
        tags: JSON.stringify(["buildinpublic", "indiehackers", "milestone"]),
      },
    ];

    for (const p of posts) {
      const authorId = userMap.get(p.author);
      const commId = communityMap.get(p.community);
      if (!authorId) continue;

      const createdPost = await prisma.post.create({
        data: {
          authorId,
          communityId: commId,
          content: p.content,
          type: p.type,
          tags: p.tags,
          links: "[]",
          ...(p.mediaUrl
            ? {
                media: {
                  create: {
                    url: p.mediaUrl,
                    mimeType: "image/jpeg",
                    order: 0,
                  },
                },
              }
            : {}),
        },
      });

      // Add a couple sample comments
      if (p.author === "alex_design") {
        const sarahId = userMap.get("sarah_code");
        if (sarahId) {
          await prisma.comment.create({
            data: {
              postId: createdPost.id,
              authorId: sarahId,
              content: "The warm off-white canvas makes a massive difference compared to cold blue-tinted slop. Beautiful work!",
            },
          });
        }
      }

      // Add sample likes
      for (const [, uid] of userMap.entries()) {
        if (Math.random() > 0.4) {
          await prisma.like.create({
            data: {
              userId: uid,
              postId: createdPost.id,
            },
          }).catch(() => {});
        }
      }

      console.log(`  ✓ Created post by @${p.author}`);
    }
  } else {
    console.log(`  • Posts already exist (${existingPostCount} found)`);
  }

  // 4. Follow relationships
  const alexId = userMap.get("alex_design");
  const sarahId = userMap.get("sarah_code");
  const marcusId = userMap.get("marcus_ai");

  if (alexId && sarahId) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: alexId, followingId: sarahId } },
      create: { followerId: alexId, followingId: sarahId },
      update: {},
    });
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: sarahId, followingId: alexId } },
      create: { followerId: sarahId, followingId: alexId },
      update: {},
    });
  }

  if (alexId && marcusId) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: alexId, followingId: marcusId } },
      create: { followerId: alexId, followingId: marcusId },
      update: {},
    });
  }

  console.log("✅ Seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
