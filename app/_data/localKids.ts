import type { Kid } from "./kids";
import type { Room } from "./rooms";

export const LOCAL_KIDS_KEY = "openDaycare:kids:v1";

// Lo que se persiste: datos crudos, sin derivar
export interface StoredKid {
  id: string; // "local-mf3k2a1" — Date.now().toString(36)
  createdAt: string; // ISO "2026-09-24T10:00:00.000Z"
  name: string; // "Martina López"
  birthDate: string; // "2023-04-14" — value del input type="date"
  room: Room; // "Lunas"
  allergies?: string; // "Maní, Lactosa"
  notes?: string; // "Indicaciones, medicación…"
}

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

const memoryFallback: StoredKid[] = [];

function sanitize(value: unknown): StoredKid[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is StoredKid =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as StoredKid).name === "string",
  );
}

function parseBirthDate(value: string): Date | null {
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

function formatBirthDate(birth: Date | null, raw: string): string {
  if (!birth) return raw;
  return `${birth.getDate()} ${MONTHS[birth.getMonth()]} ${birth.getFullYear()}`;
}

function formatJoinDate(createdAt: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }
  return `${MONTHS[created.getMonth()]} ${created.getFullYear()}`;
}

function deriveAllergies(allergies?: string): Kid["allergies"] {
  if (!allergies || !allergies.trim()) return undefined;
  return {
    badge: allergies.split(",")[0].trim().toUpperCase(),
    text: allergies,
  };
}

function toKid(stored: StoredKid, index: number): Kid {
  const birth = parseBirthDate(stored.birthDate);
  const [avatarBg, avatarColor] = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  return {
    id: stored.id,
    name: stored.name,
    initial: stored.name.trim().charAt(0).toUpperCase(),
    avatarBg,
    avatarColor,
    ageYears: ageOf(birth, new Date()),
    room: stored.room,
    birthDate: formatBirthDate(birth, stored.birthDate),
    joinDate: formatJoinDate(stored.createdAt),
    allergies: deriveAllergies(stored.allergies),
    parents: [],
  };
}

function readStoredOrMemory(): StoredKid[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KIDS_KEY);
    if (!raw) return [];
    return sanitize(JSON.parse(raw));
  } catch {
    return memoryFallback;
  }
}

export function loadLocalKids(): Kid[] {
  return readStoredOrMemory().map(toKid);
}

export function saveLocalKid(
  input: Omit<StoredKid, "id" | "createdAt">,
): Kid {
  const stored: StoredKid = {
    id: `local-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  try {
    let list: StoredKid[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(LOCAL_KIDS_KEY);
        list = sanitize(raw ? JSON.parse(raw) : []);
      } catch {
        list = [];
      }
      list.push(stored);
      window.localStorage.setItem(LOCAL_KIDS_KEY, JSON.stringify(list));
      return toKid(stored, list.length - 1);
    }
    throw new Error("storage unavailable");
  } catch {
    memoryFallback.push(stored);
    return toKid(stored, memoryFallback.length - 1);
  }
}
