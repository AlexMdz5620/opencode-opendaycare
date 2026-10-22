"use client";

import { FeedDivider } from "@/components/home/FeedDivider";
import { FeedHeader } from "@/components/home/FeedHeader";
import { Composer } from "@/components/home/Composer";
import { PostCard } from "@/components/home/PostCard";
import type { FeedPost } from "@/app/_data/mock";

interface FeedScreenProps {
  posts: FeedPost[];
  currentUserId: string;
}

export function FeedScreen({ posts }: FeedScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
      <FeedHeader />
      <Composer />
      {posts.length > 0 && <FeedDivider />}
      {posts.length === 0 ? (
        <div className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] px-[22px] py-10 text-center text-[15.5px] text-[#A89A8B]">
          Todavía no hay publicaciones. Sé el primero en compartir un momento.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
