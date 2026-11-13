import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostService } from "@/services/post.service";
import { PostDetail } from "@/components/posts/post-detail";
import { AppError } from "@/lib/http/response";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;

  try {
    const post = await PostService.getPost(postId);

    return (
      <main className="min-h-screen bg-[#FCFBF9] text-[#18181B] py-8">
        <PostDetail initialPost={post} />
      </main>
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      if (error.statusCode === 404) {
        notFound();
      }

      if (error.statusCode === 403) {
        return (
          <main className="min-h-screen bg-[#FCFBF9] flex items-center justify-center p-4">
            <div className="bg-white border border-[#E4E4E7] rounded-3xl p-8 max-w-md w-full text-center shadow-xs">
              <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E4E4E7]">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-lg font-bold text-[#09090B] mb-2">
                Post Restricted
              </h2>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                {error.message || "This content is from a private profile or is restricted."}
              </p>
              <Link
                href="/feed"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#09090B] text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition"
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
