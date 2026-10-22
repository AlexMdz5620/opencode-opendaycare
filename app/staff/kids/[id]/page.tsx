import { notFound } from "next/navigation";
import type { KidParent } from "@/app/_data/kids";
import { toKid, type ChildRow } from "@/app/staff/kids/derive";
import { AllergyBanner } from "@/components/kid-profile/AllergyBanner";
import { ProfileAside } from "@/components/kid-profile/ProfileAside";
import { ProfileBackLink } from "@/components/kid-profile/ProfileBackLink";
import { ProfileFacts } from "@/components/kid-profile/ProfileFacts";
import { ProfileHero } from "@/components/kid-profile/ProfileHero";
import { createClient } from "@/utils/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChildWithRoom extends ChildRow {
  rooms: { name: string } | null;
}

const RELATION_TO_LABEL: Record<string, KidParent["relation"]> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

const PARENT_AVATAR_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#C9B6E8", "#7B5FC0"],
  ["#A9C7E8", "#3F5694"],
  ["#F4B8CC", "#C44A7A"],
  ["#B9DEC4", "#3E8B62"],
  ["#F4DC8E", "#9A7B1E"],
];

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

  const { data: linkRows } = await supabase
    .from("parent_children")
    .select("relationship, users(full_name)")
    .eq("child_id", id);

  const parents: KidParent[] = (linkRows ?? []).map((row, parentIndex) => {
    const fullName =
      (row.users as unknown as { full_name: string } | null)?.full_name ?? "";
    const [avatarBg] =
      PARENT_AVATAR_PALETTE[parentIndex % PARENT_AVATAR_PALETTE.length];
    return {
      name: fullName,
      relation: RELATION_TO_LABEL[row.relationship] ?? "Tutor/a",
      status: "active",
      note: "activa",
      initial: fullName.trim().charAt(0).toUpperCase(),
      avatarBg,
    };
  });
  kid.parents = parents;

  return (
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
  );
}
