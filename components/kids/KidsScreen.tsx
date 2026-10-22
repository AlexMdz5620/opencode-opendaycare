"use client";

import { useState } from "react";
import type { Kid } from "@/app/_data/kids";
import { AddKidModal } from "@/components/kids/AddKidModal";
import { KidsHeader } from "@/components/kids/KidsHeader";
import { KidsRoomSection } from "@/components/kids/KidsRoomSection";
import { KidsSearch } from "@/components/kids/KidsSearch";

export interface RoomOption {
  id: string;
  name: string;
}

export function KidsScreen({
  kids,
  rooms,
}: {
  kids: Kid[];
  rooms: RoomOption[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
      <KidsHeader onAdd={() => setIsModalOpen(true)} />
      <KidsSearch />
      {kids.length === 0 ? (
        <p className="py-12 text-center text-[15px] font-semibold text-[#94887B]">
          Aún no hay niños registrados
        </p>
      ) : (
        <div className="flex flex-col gap-[22px]">
          {rooms.map((room) => {
            const roomKids = kids.filter(
              (kid) => kid.room === room.name,
            );
            if (roomKids.length === 0) return null;
            return (
              <KidsRoomSection
                key={room.id}
                room={room.name}
                kids={roomKids}
              />
            );
          })}
        </div>
      )}
      {isModalOpen && (
        <AddKidModal
          rooms={rooms}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
