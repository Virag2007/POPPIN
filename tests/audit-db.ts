import "./load-env";
import prisma from "../lib/db";

async function main() {
  console.log("=== DATABASE AUDIT ===");
  const rawUrl = process.env.DATABASE_URL || process.env.SQLITE_DATABASE_URL || "";
  const isPostgres = rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://");
  console.log("DB Provider Detected:", isPostgres ? "PostgreSQL" : "SQLite");
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
  console.log("DIRECT_URL set:", !!process.env.DIRECT_URL);
  console.log("SQLITE_DATABASE_URL set:", !!process.env.SQLITE_DATABASE_URL);

  try {
    if (isPostgres) {
      const tables: any = await prisma.$queryRawUnsafe(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
      );
      console.log("PostgreSQL Tables found:", tables.map((t: any) => t.table_name));

      const migrations: any = await prisma.$queryRawUnsafe(
        "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY finished_at ASC;"
      ).catch(() => "No _prisma_migrations table");
      console.log("Applied Migrations:", migrations);

      // Check counts on key models
      const counts: Record<string, number> = {};
      try { counts.User = await prisma.user.count(); } catch (e: any) { counts.UserError = e.message; }
      try { counts.Profile = await prisma.profile.count(); } catch (e: any) { counts.ProfileError = e.message; }
      try { counts.Post = await prisma.post.count(); } catch (e: any) { counts.PostError = e.message; }
      try { counts.Community = await prisma.community.count(); } catch (e: any) { counts.CommunityError = e.message; }
      try { counts.Conversation = await prisma.conversation.count(); } catch (e: any) { counts.ConversationError = e.message; }
      try { counts.Message = await prisma.message.count(); } catch (e: any) { counts.MessageError = e.message; }
      try { counts.Notification = await (prisma as any).notification?.count?.() ?? -1; } catch (e: any) { counts.NotificationError = e.message; }
      console.log("Table row counts:", counts);
    } else {
      const tables: any = await prisma.$queryRawUnsafe(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
      );
      console.log("SQLite Tables found:", tables.map((t: any) => t.name));
    }
  } catch (err: any) {
    console.error("Database connection/query error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

