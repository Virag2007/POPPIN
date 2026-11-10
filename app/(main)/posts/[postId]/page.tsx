import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostService } from "@/services/post.service";
import { PostDetail } from "@/components/posts/post-detail";
import { AppError } from "@/lib/http/response";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;

  try {
    const post = await PostService.getPost(postId);

    return (
      <main className="min-h-screen bg-gray-50 py-8">
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
          <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Post Unavailable</h2>
              <p className="text-xs text-gray-500 mb-6">
                {error.message || "This content is from a private profile or is restricted."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </main>
        );
      }
    }

    throw error;
  }
}

