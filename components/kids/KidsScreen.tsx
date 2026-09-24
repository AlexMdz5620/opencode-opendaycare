"use client";

import { useEffect, useState } from "react";
import type { Kid } from "@/app/_data/kids";
import { loadLocalKids } from "@/app/_data/localKids";
import { AddKidModal } from "@/components/kids/AddKidModal";
import { KidCard } from "@/components/kids/KidCard";
import { KidsHeader } from "@/components/kids/KidsHeader";
import { KidsRoomLabel } from "@/components/kids/KidsRoomLabel";
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <KidsHeader onAdd={() => setIsModalOpen(true)} />
          <KidsSearch />
          <KidsRoomLabel />
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {[...kids, ...localKids].map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
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
