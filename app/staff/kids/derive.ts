import type { Kid } from "@/app/_data/kids";

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const AVATAR_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#A9D9E8", "#1F7A93"],
  ["#F4B8CC", "#C44A7A"],
  ["#B9DEC4", "#3E8B62"],
  ["#C9B6E8", "#7B5FC0"],
  ["#F4DC8E", "#9A7B1E"],
];

export interface ChildRow {
  id: string;
  room_id: string | null;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  allergy_tags: string[] | null;
}

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function ageOf(birth: Date | null, now: Date): number {
  if (!birth) return 0;
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return Math.max(age, 0);
}

function formatBirthDate(birth: Date | null): string {
  if (!birth) return "";
  return `${birth.getDate()} ${MONTHS[birth.getMonth()]} ${birth.getFullYear()}`;
}

function formatJoinDate(enrolledAt: string): string {
  const enrolled = parseDate(enrolledAt);
  if (!enrolled) return "";
  return `${MONTHS[enrolled.getMonth()]} ${enrolled.getFullYear()}`;
}

export function toKid(child: ChildRow, roomName: string, index: number): Kid {
  const birth = parseDate(child.birth_date);
  const [avatarBg, avatarColor] = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  const tags = child.allergy_tags ?? [];
  return {
    id: child.id,
    name: child.full_name,
    initial: child.full_name.trim().charAt(0).toUpperCase(),
    avatarBg,
    avatarColor,
    ageYears: ageOf(birth, new Date()),
    room: roomName,
    birthDate: formatBirthDate(birth),
    joinDate: formatJoinDate(child.enrolled_at),
    allergies:
      tags.length > 0
        ? { badge: tags[0].toUpperCase(), text: tags.join(", ") }
        : undefined,
    parents: [],
  };
}
