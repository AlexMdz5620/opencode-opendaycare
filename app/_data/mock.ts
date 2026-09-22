export type PostType = "achievement" | "activity" | "announcement";
export type NavIcon = "home" | "kids" | "bell" | "user";

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
  icon: NavIcon;
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

export const ROOM_SUBTITLE = "12 niños · martes 17 jun";

export const NAV_ITEMS: NavItem[] = [
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
    publishedByMe: true,
    type: "achievement",
    audience: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    hearts: 3,
    comments: 1,
  },
  {
    id: "2",
    authorName: "Mateo",
    authorInitial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    time: "09:40",
    publishedByMe: true,
    type: "activity",
    audience: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoPlaceholder: { label: "Foto · pintando con témperas" },
    hearts: 5,
    comments: 2,
  },
  {
    id: "3",
    authorName: "Anuncio general",
    avatarBg: "#CCD8F4",
    avatarColor: "#4E72C8",
    avatarIcon: "megaphone",
    time: "07:50",
    publishedByMe: true,
    type: "announcement",
    audience: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    hearts: 8,
    comments: 0,
  },
];