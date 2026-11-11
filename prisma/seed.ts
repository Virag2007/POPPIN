import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding realistic demo profiles...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const demoUsers = [
    {
      email: "alex.rivera@poppin.social",
      username: "alex_design",
      displayName: "Alex Rivera",
      headline: "Design Director & Creative Technologist. Crafting interfaces that pop.",
      bio: "Obsessed with micro-interactions, typographic rhythm, and design systems. Former studio lead now building playful social experiences.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      skills: ["UI/UX Design", "Design Systems", "Figma", "Tailwind CSS", "GSAP"],
      interests: ["Typography", "Creative Direction", "Web Animations", "Generative Art"],
      links: [
        { title: "Portfolio", url: "https://alexrivera.design" },
        { title: "Twitter / X", url: "https://x.com/alex_design" },
      ],
      experience: [
        {
          id: "exp_1",
          company: "Studio Pop",
          title: "Principal Design Lead",
          location: "San Francisco",
          startDate: "2023",
          endDate: "Present",
          description: "Leading visual design, design token systems, and interaction design.",
        },
      ],
      education: [
        {
          id: "edu_1",
          school: "Rhode Island School of Design",
          degree: "B.F.A.",
          fieldOfStudy: "Graphic & Digital Design",
          startDate: "2018",
          endDate: "2022",
        },
      ],
    },
    {
      email: "sarah.chen@poppin.social",
      username: "sarah_code",
      displayName: "Sarah Chen",
      headline: "Staff Software Engineer. Distributed systems, Next.js & Node.js.",
      bio: "Building low-latency architectures and developer tools. Open source contributor and tech speaker.",
      location: "Seattle, WA",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
      skills: ["TypeScript", "Next.js", "Node.js", "Prisma", "PostgreSQL", "Docker"],
      interests: ["Open Source", "Distributed Systems", "Cloud Computing", "APIs"],
      links: [
        { title: "GitHub", url: "https://github.com/sarahchen" },
        { title: "Technical Blog", url: "https://sarahchen.dev" },
      ],
      experience: [
        {
          id: "exp_2",
          company: "CloudScale Systems",
          title: "Senior Backend Architect",
          location: "Seattle",
          startDate: "2021",
          endDate: "Present",
          description: "Engineered scalable identity pipelines handling millions of requests.",
        },
      ],
      education: [
        {
          id: "edu_2",
          school: "University of Washington",
          degree: "B.S.",
          fieldOfStudy: "Computer Science",
          startDate: "2017",
          endDate: "2021",
        },
      ],
    },
    {
      email: "marcus.vance@poppin.social",
      username: "marcus_ai",
      displayName: "Marcus Vance",
      headline: "AI Research Scientist & Creator exploring multimodal interactions.",
      bio: "Bridging generative models and human-computer interfaces. Writing about agentic workflows and creative coding.",
      location: "Austin, TX",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
      skills: ["Python", "PyTorch", "Generative AI", "React", "FastAPI"],
      interests: ["Multimodal AI", "Autonomous Agents", "Creative Coding", "Philosophy"],
      links: [
        { title: "Substack", url: "https://marcusvance.substack.com" },
        { title: "Papers", url: "https://arxiv.org" },
      ],
      experience: [
        {
          id: "exp_3",
          company: "Neural Horizons",
          title: "Research Scientist",
          location: "Austin",
          startDate: "2022",
          endDate: "Present",
          description: "Researching interactive multimodal agents and cognitive architectures.",
        },
      ],
      education: [
        {
          id: "edu_3",
          school: "UT Austin",
          degree: "M.S.",
          fieldOfStudy: "Artificial Intelligence",
          startDate: "2020",
          endDate: "2022",
        },
      ],
    },
  ];

  for (const item of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: item.email } });
    if (!existing) {
      const user = await prisma.user.create({
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
          links: JSON.stringify(item.links),
          experience: JSON.stringify(item.experience),
          education: JSON.stringify(item.education),
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

      console.log(`Created demo user @${item.username}`);
    }
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

