import { prisma } from "../lib/db";

async function clean() {
  console.log("Cleaning database...");
  await prisma.messageReaction.deleteMany({});
  await prisma.messageAttachment.deleteMany({});
  await prisma.messageReceipt.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationMember.deleteMany({});
  await prisma.channel.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.savedPost.deleteMany({});
  await prisma.postMedia.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.communityInvitation.deleteMany({});
  await prisma.communityJoinRequest.deleteMany({});
  await prisma.communityMember.deleteMany({});
  await prisma.community.deleteMany({});
  await prisma.block.deleteMany({});
  await prisma.followRequest.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.userReport.deleteMany({});
  await prisma.emailVerificationToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.onboarding.deleteMany({});
  await prisma.privacySettings.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✔ Database successfully cleaned! All users, communities, and demo records removed.");
}

clean()
  .catch((err) => {
    console.error("Clean failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

