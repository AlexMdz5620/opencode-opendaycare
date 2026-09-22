export type PostType = "achievement" | "activity" | "announcement";

// Etiquetas visuales (español) por tipo — el dato va en inglés, la UI en español.
export const POST_TYPE_LABEL: Record<PostType, string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};

export interface FeedPost {
  id: string;
  authorName: string; // "Mateo" | "Anuncio general"
  authorInitial?: string; // "M" (omitto si el avatar usa ícono)
  avatarBg: string; // "#A9D9E8" | "#CCD8F4"
  avatarColor: string; // "#1F7A93" | "#4E72C8"
  avatarIcon?: "megaphone"; // presente en el post anuncio
  time: string; // "14:20"
  publishedByMe: boolean; // → "publicado por vos"
  type: PostType;
  audience: string; // "familia de Mateo" | "toda la sala"
  text: string;
  photoPlaceholder?: { label: string }; // "Foto · pintando con témperas"
  hearts: number;
  comments: number;
}

export interface NavItem {
  label: string; // "Feed" | "Niños" | "Avisos" | "Mi cuenta"
  icon: "home" | "kids" | "bell" | "user";
  active: boolean;
}

export interface SidebarUser {
  name: string; // "Caro Giménez"
  role: string; // "Maestra · Soles"
  initial: string; // "C"
}

export const SIDEBAR_USER: SidebarUser = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
};

export const NAV_ITEMS = [
  { label: "Feed", icon: "home", active: true },
  { label: "Niños", icon: "kids", active: false },
  { label: "Avisos", icon: "bell", active: false },
  { label: "Mi cuenta", icon: "user", active: false },
];

export const POSTS: FeedPost[] = [
  {
    id: "1",
    authorName: "Mateo",
    authorInitial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    time: "14:20",
    publishedByMe: false,
    type: "achievement",
    audience: "familia de Mateo",
    text: "Mateo logró dar sus primeros pasos independientemente",
    hearts: 12,
    comments: 3,
  },
  {
    id: "2",
    authorName: "Mateo",
    authorInitial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    time: "11:45",
    publishedByMe: false,
    type: "activity",
    audience: "toda la sala",
    text: "Mateo practicó actividades de arte con témperas",
    photoPlaceholder: { label: "Foto · pintando con témperas" },
    hearts: 8,
    comments: 5,
  },
  {
    id: "3",
    authorName: "Anuncio general",
    authorInitial: undefined,
    avatarBg: "#CCD8F4",
    avatarColor: "#4E72C8",
    avatarIcon: "megaphone",
    time: "09:30",
    publishedByMe: false,
    type: "announcement",
    audience: "toda la sala",
    text: "Próximo evento: visita al zoológico el próximo viernes",
    hearts: 25,
    comments: 10,
  },
];