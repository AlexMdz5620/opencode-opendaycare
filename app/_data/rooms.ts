export const ROOMS = ["Soles", "Lunas", "Estrellas"] as const;
export type Room = (typeof ROOMS)[number];
