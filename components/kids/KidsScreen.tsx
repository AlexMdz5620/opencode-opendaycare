"use client";

import { useEffect, useState } from "react";
import type { Kid } from "@/app/_data/kids";
import { loadLocalKids } from "@/app/_data/localKids";
import { ROOMS } from "@/app/_data/rooms";
import { AddKidModal } from "@/components/kids/AddKidModal";
import { KidsHeader } from "@/components/kids/KidsHeader";
import { KidsRoomSection } from "@/components/kids/KidsRoomSection";
import { KidsSearch } from "@/components/kids/KidsSearch";
import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";

export function KidsScreen({ kids }: { kids: Kid[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localKids, setLocalKids] = useState<Kid[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalKids(loadLocalKids());
  }, []);

  const allKids = [...kids, ...localKids];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <KidsHeader onAdd={() => setIsModalOpen(true)} />
          <KidsSearch />
          <div className="flex flex-col gap-[22px]">
            {ROOMS.map((room) => {
              const roomKids = allKids.filter((kid) => kid.room === room);
              if (roomKids.length === 0) return null;
              return (
                <KidsRoomSection key={room} room={room} kids={roomKids} />
              );
            })}
          </div>
        </div>
      </main>
      {isModalOpen && (
        <AddKidModal
          onClose={() => setIsModalOpen(false)}
          onSaved={(kid) => {
            setLocalKids((previous) => [...previous, kid]);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
