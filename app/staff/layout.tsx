import { redirect } from "next/navigation";
import { CreatePostModal } from "@/components/home/CreatePostModal";
import { FeedProvider } from "@/components/home/FeedContext";
import { MobileNav } from "@/components/shared/MobileNav";
import {
  STAFF_SIDEBAR_CONFIG,
  StaffSidebar,
} from "@/components/shared/Sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function StaffLayout({
  children,
}: LayoutProps<"/staff">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (userRow?.role === "parent") redirect("/family");

  return (
    <FeedProvider>
      <div className="flex min-h-screen bg-background">
        <StaffSidebar />
        <MobileNav config={STAFF_SIDEBAR_CONFIG} />
        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <CreatePostModal />
    </FeedProvider>
  );
}
