import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PostService } from "@/services/post.service";
import { PostDetail } from "@/components/posts/post-detail";
import { AppError } from "@/lib/http/response";
import { verifyToken } from "@/lib/auth/jwt";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;

  try {
    const token = (await cookies()).get("poppin_token")?.value;
    const viewerId = token ? verifyToken(token)?.userId : undefined;
    const post = await PostService.getPost(postId, viewerId);

    return (
      <main className="min-h-screen bg-[#313338] text-[#F2F3F5] py-8">
        <PostDetail initialPost={post} currentUserId={viewerId} token={token} />
      </main>
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      if (error.statusCode === 404) {
        notFound();
      }

      if (error.statusCode === 403) {
        return (
          <main className="min-h-screen bg-[#313338] flex items-center justify-center p-4">
            <div className="bg-[#2B2D31] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <div className="w-12 h-12 bg-[#383A40] text-[#8A9BFF] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-lg font-bold text-white mb-2">
                Post Restricted
              </h2>
              <p className="text-xs text-[#B5BAC1] mb-6 leading-relaxed">
                {error.message || "This content is from a private profile or is restricted."}
              </p>
              <Link
                href="/feed"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#5865F2]/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Feed
              </Link>
            </div>
          </main>
        );
      }
    }

    throw error;
  }
}
