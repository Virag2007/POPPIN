import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ChatWindow } from "@/components/messaging/chat-window";
import { AppError } from "@/lib/http/response";
import { verifyToken } from "@/lib/auth/jwt";

interface MessageConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function MessageConversationPage({
  params,
}: MessageConversationPageProps) {
  const { conversationId } = await params;

  try {
    const token = (await cookies()).get("poppin_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload?.userId) {
      notFound();
    }

    // Only conversation members may view the conversation (and its member list).
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: { some: { userId: payload.userId } },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      notFound();
    }

    const formattedConversation = {
      id: conversation.id,
      isGroup: conversation.isGroup,
      name: conversation.name,
      avatar: conversation.avatar,
      members: conversation.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        user: {
          id: m.user.id,
          username: m.user.profile?.username || `user_${m.user.id.slice(0, 8)}`,
          displayName: m.user.profile?.displayName || null,
          avatar: m.user.profile?.avatar || null,
        },
        role: m.role as "ADMIN" | "MEMBER",
        lastReadAt: m.lastReadAt,
      })),
      unreadCount: 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return (
      <main className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-3">
            <Link
              href="/messages"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              All Messages
            </Link>
          </div>

          <ChatWindow conversation={formattedConversation} currentUserId={payload.userId} />
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }
}

