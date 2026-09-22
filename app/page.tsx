import { POSTS } from "@/app/_data/mock";
import { FeedDivider } from "@/components/home/FeedDivider";
import { FeedHeader } from "@/components/home/FeedHeader";
import { Composer } from "@/components/home/Composer";
import { PostCard } from "@/components/home/PostCard";
import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <FeedHeader />
          <Composer />
          <FeedDivider />
          <div className="flex flex-col gap-4">
            {POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
