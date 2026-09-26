"use client";

import { useEffect, useState } from "react";
import { KIDS, type Kid } from "@/app/_data/kids";
import { loadLocalKids } from "@/app/_data/localKids";
import { useFeed } from "@/components/home/FeedContext";

const SECTION_LABEL_CLASS =
  "mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

export function CreatePostModal() {
  const { isCreateOpen, closeCreate } = useFeed();

  if (!isCreateOpen) return null;

  return <CreatePostDialog onClose={closeCreate} />;
}

function CreatePostDialog({ onClose }: { onClose: () => void }) {
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [allRoom, setAllRoom] = useState(false);
  const [localKids, setLocalKids] = useState<Kid[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalKids(loadLocalKids());
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const kids = [...KIDS, ...localKids];

  function toggleAllRoom() {
    if (allRoom) {
      setAllRoom(false);
      return;
    }
    setAllRoom(true);
    setSelectedKidIds([]);
  }

  function toggleKid(kidId: string) {
    if (allRoom) {
      setAllRoom(false);
      setSelectedKidIds([kidId]);
      return;
    }
    setSelectedKidIds((prev) =>
      prev.includes(kidId)
        ? prev.filter((id) => id !== kidId)
        : [...prev, kidId],
    );
  }

  function pillClass(selected: boolean): string {
    return [
      "flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] text-[14px] font-bold",
      selected
        ? "border-[#3F362E] bg-[#3F362E] text-white"
        : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]",
    ].join(" ");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nueva publicación"
        className="my-auto w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-foreground">
            Nueva publicación
          </span>
          <button
            type="button"
            className="cursor-pointer text-[15px] font-extrabold text-[#D9583C]"
          >
            Publicar
          </button>
        </div>

        <div className="p-[26px] pt-6">
          <div className={SECTION_LABEL_CLASS}>PARA</div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {kids.map((kid) => {
              const selected = !allRoom && selectedKidIds.includes(kid.id);
              const firstName = kid.name.split(" ")[0];
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => toggleKid(kid.id)}
                  className={`${pillClass(selected)} py-[6px] pl-[6px] pr-[14px]`}
                >
                  <span
                    className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                    style={{
                      backgroundColor: kid.avatarBg,
                      color: kid.avatarColor,
                    }}
                  >
                    {kid.initial}
                  </span>
                  {firstName}
                </button>
              );
            })}
            <button
              type="button"
              onClick={toggleAllRoom}
              className={`${pillClass(allRoom)} px-4 py-[6px]`}
            >
              Toda la sala
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
