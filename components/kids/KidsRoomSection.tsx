"use client";

import { useState } from "react";
import type { Kid } from "@/app/_data/kids";
import type { Room } from "@/app/_data/rooms";
import { KidCard } from "@/components/kids/KidCard";
import { KidsRoomLabel } from "@/components/kids/KidsRoomLabel";
import { ChevronDownIcon } from "@/components/shared/icons";

interface KidsRoomSectionProps {
  room: Room;
  kids: Kid[];
}

export function KidsRoomSection({ room, kids }: KidsRoomSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mb-[14px] flex w-full cursor-pointer items-center gap-3 text-left"
      >
        <KidsRoomLabel room={room} count={kids.length} />
        <ChevronDownIcon
          size={18}
          className={`flex-none text-[#A89A8B] transition-transform duration-200 ${
            expanded ? "" : "-rotate-90"
          }`}
        />
      </button>
      {expanded && (
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          {kids.map((kid) => (
            <KidCard key={kid.id} kid={kid} />
          ))}
        </div>
      )}
    </section>
  );
}
