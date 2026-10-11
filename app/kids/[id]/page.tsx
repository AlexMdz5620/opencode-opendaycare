import { notFound } from "next/navigation";
import { toKid, type ChildRow } from "@/app/kids/derive";
import { AllergyBanner } from "@/components/kid-profile/AllergyBanner";
import { ProfileAside } from "@/components/kid-profile/ProfileAside";
import { ProfileBackLink } from "@/components/kid-profile/ProfileBackLink";
import { ProfileFacts } from "@/components/kid-profile/ProfileFacts";
import { ProfileHero } from "@/components/kid-profile/ProfileHero";
import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { createClient } from "@/utils/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChildWithRoom extends ChildRow {
  rooms: { name: string } | null;
}

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, allergy_tags, rooms(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    notFound();
  }

  const { data: orderRows } = await supabase
    .from("children")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const child = data as unknown as ChildWithRoom;
  const index = Math.max(
    0,
    (orderRows ?? []).findIndex((row) => row.id === id),
  );
  const kid = toKid(child, child.rooms?.name ?? "", index);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          <ProfileBackLink />
          <div className="flex flex-wrap items-start gap-[26px]">
            <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
              <ProfileHero kid={kid} />
              {kid.allergies && <AllergyBanner allergies={kid.allergies} />}
              <ProfileFacts kid={kid} />
            </div>
            <ProfileAside kid={kid} />
          </div>
        </div>
      </main>
    </div>
  );
}
