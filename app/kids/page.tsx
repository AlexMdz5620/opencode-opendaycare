import { toKid, type ChildRow } from "@/app/kids/derive";
import { KidsScreen, type RoomOption } from "@/components/kids/KidsScreen";
import { createClient } from "@/utils/supabase/server";

export default async function KidsPage() {
  const supabase = await createClient();

  const { data: roomsData } = await supabase
    .from("rooms")
    .select("id, name")
    .order("created_at", { ascending: true });

  const { data: childrenData } = await supabase
    .from("children")
    .select("id, room_id, full_name, birth_date, enrolled_at, allergy_tags")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const rooms: RoomOption[] = (roomsData ?? []) as RoomOption[];
  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));
  const kids = ((childrenData ?? []) as ChildRow[]).map((child, index) =>
    toKid(child, roomNames.get(child.room_id ?? "") ?? "", index),
  );

  return <KidsScreen kids={kids} rooms={rooms} />;
}
