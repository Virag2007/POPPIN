"use client";

import React, { useState } from "react";
import { FeedTabs, FeedType, FeedList } from "@/components/feed";
import { PostComposer } from "@/components/posts/post-composer";
import { PostResponse } from "@/types";

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedType>("for-you");
  const [latestCreatedPost, setLatestCreatedPost] = useState<PostResponse | null>(null);

  const handlePostCreated = (post: PostResponse) => {
    setLatestCreatedPost(post);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Title */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Feed</h1>
          <p className="text-xs text-gray-500">
            Discover community updates, showcase projects, and connect.
          </p>
        </div>

        {/* Post Composer */}
        <PostComposer onPostCreated={handlePostCreated} />

        {/* Feed Navigation Tabs */}
        <FeedTabs activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

        {/* Post Stream */}
        <FeedList
          feedType={activeTab}
          newPost={latestCreatedPost}
        />
      </div>
    </main>
  );
}

