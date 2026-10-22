import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedPost, PostType } from "@/app/_data/mock";

interface PostRow {
  id: string;
  author_id: string;
  room_id: string | null;
  type: PostType;
  title: string | null;
  body: string;
  published_at: string;
  author: { full_name: string } | null;
  rooms: { name: string } | null;
  post_photos: { url: string; position: number }[];
  post_children: { children: { full_name: string } | null }[];
}

const AVATAR_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#A9D9E8", "#1F7A93"],
  ["#F4B8CC", "#C44A7A"],
  ["#B9DEC4", "#3E8B62"],
  ["#C9B6E8", "#7B5FC0"],
  ["#F4DC8E", "#9A7B1E"],
];

function avatarFor(authorId: string): readonly [string, string] {
  let hash = 0;
  for (const char of authorId) hash += char.charCodeAt(0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

function deriveAudience(row: PostRow): string {
  if (row.room_id) return `sala ${row.rooms?.name ?? ""}`.trim();
  const names = (row.post_children ?? [])
    .map((entry) => entry.children?.full_name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b))
    .map(firstName);
  return `familia de ${names.join(", ")}`;
}

function toFeedPost(row: PostRow, sessionUserId: string): FeedPost {
  const [avatarBg, avatarColor] = avatarFor(row.author_id);
  const photos = (row.post_photos ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((photo) => photo.url);
  const fullName = row.author?.full_name ?? "";

  return {
    id: row.id,
    authorName: fullName,
    authorInitial: fullName.charAt(0).toUpperCase(),
    avatarBg,
    avatarColor,
    time: formatTime(row.published_at),
    publishedByMe: row.author_id === sessionUserId,
    authorId: row.author_id,
    title: row.title ?? undefined,
    type: row.type,
    audience: deriveAudience(row),
    text: row.body,
    photos: photos.length > 0 ? photos : undefined,
    hearts: 0,
    comments: 0,
  };
}

export async function loadFeedPosts(
  supabase: SupabaseClient,
  sessionUserId: string,
): Promise<FeedPost[]> {
  const { data } = await supabase
    .from("posts")
    .select(
      `
      id,
      author_id,
      room_id,
      type,
      title,
      body,
      published_at,
      author:users!posts_author_id_fkey ( full_name ),
      rooms:rooms!posts_room_id_fkey ( name ),
      post_photos ( url, position ),
      post_children ( children ( full_name ) )
    `,
    )
    .order("published_at", { ascending: false });

  const rows = (data ?? []) as unknown as PostRow[];
  return rows.map((row) => toFeedPost(row, sessionUserId));
}
