import { redirect } from "next/navigation";
import { loadFeedPosts } from "@/app/_data/feed-query";
import { FeedScreen } from "@/components/home/FeedScreen";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const posts = await loadFeedPosts(supabase, user.id);

  return <FeedScreen posts={posts} currentUserId={user.id} />;
}
