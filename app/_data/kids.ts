export interface KidParent {
  name: string; // "Lucía Fernández"
  relation: "Mamá" | "Papá";
  status: "active" | "pending"; // → badge ACTIVA / PENDIENTE
  note: string; // "activa" | "invitación enviada"
  initial: string; // "L"
  avatarBg: string; // "#C9B6E8"
}

export interface Kid {
  id: string; // "1".."8" — coherente con FeedPost.id
  name: string; // "Mateo Fernández"
  initial: string; // "M"
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
  ageYears: number; // 3
  room: string; // "Soles"
  birthDate: string; // "12 mar 2022"
  joinDate: string; // "feb 2025"
  allergies?: { badge: string; text: string }; // "MANÍ" + banner
  parents: KidParent[]; // [] → estado vacío
}

export const KIDS: Kid[] = [
  {
    id: "1",
    name: "Mateo Fernández",
    initial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    ageYears: 3,
    room: "Soles",
    birthDate: "12 mar 2022",
    joinDate: "feb 2025",
    allergies: {
      badge: "MANÍ",
      text: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    },
    parents: [
      {
        name: "Lucía Fernández",
        relation: "Mamá",
        status: "active",
        note: "activa",
        initial: "L",
        avatarBg: "#C9B6E8",
      },
      {
        name: "Diego Fernández",
        relation: "Papá",
        status: "pending",
        note: "invitación enviada",
        initial: "D",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    id: "2",
    name: "Sofía Méndez",
    initial: "S",
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    ageYears: 2,
    room: "Soles",
    birthDate: "14 abr 2023",
    joinDate: "mar 2025",
    parents: [
      {
        name: "Andrés Méndez",
        relation: "Papá",
        status: "active",
        note: "activo",
        initial: "A",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    id: "3",
    name: "Benjamín Ruiz",
    initial: "B",
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    ageYears: 3,
    room: "Soles",
    birthDate: "28 ene 2022",
    joinDate: "sep 2024",
    parents: [
      {
        name: "Paula Ruiz",
        relation: "Mamá",
        status: "active",
        note: "activa",
        initial: "P",
        avatarBg: "#C9B6E8",
      },
      {
        name: "Jorge Ruiz",
        relation: "Papá",
        status: "pending",
        note: "invitación enviada",
        initial: "J",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    id: "4",
    name: "Valentina Soto",
    initial: "V",
    avatarBg: "#F4DC8E",
    avatarColor: "#9A7B1E",
    ageYears: 2,
    room: "Soles",
    birthDate: "19 mar 2023",
    joinDate: "ene 2025",
    parents: [],
  },
  {
    id: "5",
    name: "Tomás Díaz",
    initial: "T",
    avatarBg: "#C9B6E8",
    avatarColor: "#7B5FC0",
    ageYears: 3,
    room: "Soles",
    birthDate: "3 nov 2021",
    joinDate: "abr 2024",
    allergies: {
      badge: "LACTOSA",
      text: "Alergia a la lactosa. Evitar lácteos en las meriendas. Lleva bebida vegetal en la mochila.",
    },
    parents: [
      {
        name: "Marcela Díaz",
        relation: "Mamá",
        status: "active",
        note: "activa",
        initial: "M",
        avatarBg: "#C9B6E8",
      },
    ],
  },
  {
    id: "6",
    name: "Emma Castro",
    initial: "E",
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    ageYears: 2,
    room: "Soles",
    birthDate: "9 may 2023",
    joinDate: "may 2025",
    parents: [
      {
        name: "Rosa Castro",
        relation: "Mamá",
        status: "active",
        note: "activa",
        initial: "R",
        avatarBg: "#F4B8CC",
      },
    ],
  },
  {
    id: "7",
    name: "Lucas Romero",
    initial: "L",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    ageYears: 3,
    room: "Soles",
    birthDate: "7 sep 2021",
    joinDate: "may 2025",
    parents: [
      {
        name: "Héctor Romero",
        relation: "Papá",
        status: "active",
        note: "activo",
        initial: "H",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    id: "8",
    name: "Olivia Vega",
    initial: "O",
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    ageYears: 2,
    room: "Soles",
    birthDate: "21 dic 2022",
    joinDate: "feb 2025",
    parents: [
      {
        name: "Natalia Vega",
        relation: "Mamá",
        status: "active",
        note: "activa",
        initial: "N",
        avatarBg: "#F4B8CC",
      },
    ],
  },
];

export function getKidById(id: string): Kid | undefined {
  return KIDS.find((kid) => kid.id === id);
}
