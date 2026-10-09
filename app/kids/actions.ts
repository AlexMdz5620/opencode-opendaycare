"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface AddKidState {
  error?: string;
  success?: boolean;
}

export async function addChild(
  _prevState: AddKidState,
  formData: FormData,
): Promise<AddKidState> {
  const name = formData.get("name");
  const birthDate = formData.get("birth_date");
  const roomId = formData.get("room_id");

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof birthDate !== "string" ||
    birthDate === "" ||
    typeof roomId !== "string" ||
    roomId === ""
  ) {
    return { error: "Este campo es obligatorio" };
  }

  const allergies = formData.get("allergies");
  const notes = formData.get("notes");

  const allergyTags =
    typeof allergies === "string" && allergies.trim() !== ""
      ? allergies
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== "")
      : [];

  const supabase = await createClient();

  const { error } = await supabase.from("children").insert({
    full_name: name.trim(),
    birth_date: birthDate,
    room_id: roomId,
    medical_notes:
      typeof notes === "string" && notes.trim() !== "" ? notes.trim() : null,
    allergy_tags: allergyTags.length > 0 ? allergyTags : null,
  });

  if (error) {
    return { error: "No se pudo guardar el niño. Intentá de nuevo." };
  }

  revalidatePath("/kids");
  return { success: true };
}
