"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { sendInvitationEmail } from "@/utils/email";

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

export interface CreateInvitationState {
  error?: string;
  success?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RELATION_TO_DB: Record<string, "father" | "mother" | "guardian"> = {
  Mamá: "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let index = 0; index < 5; index += 1) {
    const position = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length);
    code += INVITE_CODE_ALPHABET[position];
  }
  return code;
}

export async function createInvitation(
  _prevState: CreateInvitationState,
  formData: FormData,
): Promise<CreateInvitationState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const relation = formData.get("relation");
  const kidId = formData.get("kid_id");
  const code = formData.get("code");

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof email !== "string" ||
    email.trim() === ""
  ) {
    return { error: "Este campo es obligatorio" };
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return { error: "Ingresá un email válido" };
  }
  if (
    typeof kidId !== "string" ||
    kidId === "" ||
    typeof relation !== "string" ||
    !(relation in RELATION_TO_DB)
  ) {
    return { error: "Este campo es obligatorio" };
  }
  const clientCode =
    typeof code === "string" && code.trim() !== "" ? code.trim() : null;
  if (!clientCode) {
    return { error: "Este campo es obligatorio" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "No se pudo enviar el correo" };
  }

  const { data: staff } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  if (!staff) {
    return { error: "No se pudo enviar el correo" };
  }

  const { data: child } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", kidId)
    .maybeSingle();
  const kidFirstName = child?.full_name?.split(" ")[0] ?? "";

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const relationship = RELATION_TO_DB[relation];

  let insertedCode = clientCode;
  let { error: insertError } = await supabase.from("invitations").insert({
    child_id: kidId,
    invited_by: staff.id,
    full_name: name.trim(),
    email: email.trim(),
    relationship,
    code: insertedCode,
    expires_at: expiresAt,
  });

  while (insertError?.code === "23505") {
    insertedCode = generateInviteCode();
    const retry = await supabase.from("invitations").insert({
      child_id: kidId,
      invited_by: staff.id,
      full_name: name.trim(),
      email: email.trim(),
      relationship,
      code: insertedCode,
      expires_at: expiresAt,
    });
    insertError = retry.error;
  }

  if (insertError) {
    return { error: "No se pudo enviar el correo" };
  }

  try {
    await sendInvitationEmail({
      to: email.trim(),
      fullName: name.trim(),
      kidFirstName,
      code: insertedCode,
    });
  } catch {
    return { error: "No se pudo enviar el correo" };
  }

  return { success: true };
}
