import { Community } from "@/types";

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: "comm_design",
    slug: "design-craft",
    name: "Design Craft & Systems",
    tagline: "Exploring out-of-distribution visual craft, typography, and micro-interactions.",
    description: "A hub for designers, creative technologists, and design system engineers crafting polished, distinctive interfaces that push the frontier beyond generic templates.",
    category: "Design",
    avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    membersCount: 428,
    isMember: true,
    rules: [
      "Critique the work constructively, not the person.",
      "Show real rendered interfaces and code over conceptual mocks.",
      "No generic AI-slop or copy-paste templates without opinionated craft.",
    ],
    moderators: [
      { id: "alex", username: "alex_design", displayName: "Alex Rivera" },
    ],
  },
  {
    id: "comm_eng",
    slug: "distributed-systems",
    name: "Distributed Systems & Next.js",
    tagline: "High-concurrency backends, edge caching, and scalable web architectures.",
    description: "Deep technical breakdowns of low-latency systems, database concurrency, token versioning, and state-of-the-art full-stack TypeScript engineering.",
    category: "Engineering",
    avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    membersCount: 615,
    isMember: false,
    rules: [
      "Include reproducible benchmarks or metrics when making performance claims.",
      "Respect security disclosure boundaries and OWASP standards.",
    ],
    moderators: [
      { id: "sarah", username: "sarah_code", displayName: "Sarah Chen" },
    ],
  },
  {
    id: "comm_ai",
    slug: "autonomous-agents",
    name: "Autonomous Agents & GenAI",
    tagline: "Building interactive multimodal agents and pairing workflows.",
    description: "Researching and hacking on tool-calling agents, streaming generative UI, and real-time human-in-the-loop pair programming systems.",
    category: "AI & Research",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
    membersCount: 389,
    isMember: false,
    rules: [
      "Open-source weights and reproducibility are strongly encouraged.",
      "Keep discussion focused on architectures, evaluations, and agent tooling.",
    ],
    moderators: [
      { id: "marcus", username: "marcus_ai", displayName: "Marcus Vance" },
    ],
  },
  {
    id: "comm_founders",
    slug: "indie-founders",
    name: "Indie Founders & Builders",
    tagline: "From zero to sustainable software platforms with small teams.",
    description: "Sharing revenue milestones, growth experiments, product launches, and operational wisdom for independent creators building enduring businesses.",
    category: "Founders",
    avatar: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    membersCount: 294,
    isMember: false,
    rules: [
      "Transparent numbers and actionable insights.",
      "No spammy link drops or unsolicited marketing DMs.",
    ],
    moderators: [
      { id: "founder", username: "alex_design", displayName: "Alex Rivera" },
    ],
  },
];

