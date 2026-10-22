"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { PostType } from "@/app/_data/mock";

export interface CreatePostState {
  error?: string;
  success?: boolean;
}

const POST_TYPES: PostType[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const GENERIC_ERROR = "No se pudo publicar. Intentá de nuevo.";
const PHOTO_CONSENT_ERROR =
  "Hay niños sin consentimiento de fotos en la audiencia. Quitá las fotos o publicalas sin ellas.";

const STORAGE_BUCKET = "post-photos";

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const type = formData.get("type");
  const body = formData.get("body");
  const title = formData.get("title");
  const audienceMode = formData.get("audienceMode");
  const roomId = formData.get("roomId");
  const kidIds = formData
    .getAll("kidIds")
    .filter((value): value is string => typeof value === "string" && value !== "");
  const photos = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: GENERIC_ERROR };

  const { data: userRow } = await supabase
    .from("users")
    .select("id, daycare_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !userRow ||
    (userRow.role !== "staff" && userRow.role !== "admin") ||
    !userRow.daycare_id
  ) {
    return { error: GENERIC_ERROR };
  }

  if (
    typeof type !== "string" ||
    !POST_TYPES.includes(type as PostType) ||
    typeof body !== "string" ||
    body.trim() === ""
  ) {
    return { error: GENERIC_ERROR };
  }

  if (audienceMode !== "room" && audienceMode !== "kids") {
    return { error: GENERIC_ERROR };
  }

  if (photos.length > MAX_PHOTOS) {
    return { error: GENERIC_ERROR };
  }
  for (const photo of photos) {
    if (!photo.type.startsWith("image/") || photo.size > MAX_PHOTO_BYTES) {
      return { error: GENERIC_ERROR };
    }
  }

  let audienceKidIds: string[] = [];
  let roomToInsert: string | null = null;

  if (audienceMode === "room") {
    if (typeof roomId !== "string" || roomId === "") {
      return { error: GENERIC_ERROR };
    }
    const { data: room } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", roomId)
      .eq("daycare_id", userRow.daycare_id)
      .maybeSingle();
    if (!room) return { error: GENERIC_ERROR };
    roomToInsert = room.id;
    const { data: roomKids } = await supabase
      .from("children")
      .select("id")
      .eq("room_id", room.id)
      .eq("status", "active");
    audienceKidIds = (roomKids ?? []).map((kid) => kid.id);
  } else {
    if (kidIds.length === 0) return { error: GENERIC_ERROR };
    const uniqueKidIds = [...new Set(kidIds)];
    const { data: kids } = await supabase
      .from("children")
      .select("id, photo_consent, rooms!inner(daycare_id)")
      .in("id", uniqueKidIds)
      .eq("status", "active")
      .eq("rooms.daycare_id", userRow.daycare_id);
    const validKids = kids ?? [];
    if (validKids.length !== uniqueKidIds.length) {
      return { error: GENERIC_ERROR };
    }
    audienceKidIds = validKids.map((kid) => kid.id);
    if (
      photos.length > 0 &&
      validKids.some((kid) => !kid.photo_consent)
    ) {
      return { error: PHOTO_CONSENT_ERROR };
    }
  }

  if (audienceMode === "room" && photos.length > 0 && roomToInsert) {
    const { data: roomKidsWithConsent } = await supabase
      .from("children")
      .select("id, photo_consent")
      .eq("room_id", roomToInsert)
      .eq("status", "active");
    if ((roomKidsWithConsent ?? []).some((kid) => !kid.photo_consent)) {
      return { error: PHOTO_CONSENT_ERROR };
    }
  }

  const postId = randomUUID();
  const daycareId = userRow.daycare_id;
  const uploadedPaths: string[] = [];
  const photoUrls: { url: string; position: number }[] = [];

  for (const [position, photo] of photos.entries()) {
    const extension = photo.name.includes(".")
      ? (photo.name.split(".").pop() ?? "bin").toLowerCase()
      : "bin";
    const path = `${daycareId}/${postId}/${position}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, photo, { contentType: photo.type });

    if (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths);
      }
      return { error: GENERIC_ERROR };
    }

    uploadedPaths.push(path);
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    photoUrls.push({ url: publicUrlData.publicUrl, position });
  }

  const { error: postError } = await supabase.from("posts").insert({
    id: postId,
    author_id: user.id,
    daycare_id: daycareId,
    room_id: roomToInsert,
    type,
    title:
      typeof title === "string" && title.trim() !== "" ? title.trim() : null,
    body: body.trim(),
  });

  if (postError) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths);
    }
    return { error: GENERIC_ERROR };
  }

  if (audienceKidIds.length > 0) {
    const { error: childrenError } = await supabase
      .from("post_children")
      .insert(
        audienceKidIds.map((kidId) => ({ post_id: postId, child_id: kidId })),
      );
    if (childrenError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths);
      }
      return { error: GENERIC_ERROR };
    }
  }

  if (photoUrls.length > 0) {
    const { error: photosError } = await supabase
      .from("post_photos")
      .insert(
        photoUrls.map((photo) => ({
          post_id: postId,
          url: photo.url,
          position: photo.position,
        })),
      );
    if (photosError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(uploadedPaths);
      }
      return { error: GENERIC_ERROR };
    }
  }

  revalidatePath("/");
  return { success: true };
}
