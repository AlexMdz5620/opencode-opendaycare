import { redirect } from "next/navigation";
import { MobileNav } from "@/components/shared/MobileNav";
import {
  FAMILY_SIDEBAR_CONFIG,
  FamilySidebar,
} from "@/components/shared/Sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function FamilyLayout({
  children,
}: LayoutProps<"/family">) {
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

  if (userRow?.role === "staff" || userRow?.role === "admin") {
    redirect("/staff");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <FamilySidebar />
      <MobileNav config={FAMILY_SIDEBAR_CONFIG} />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
