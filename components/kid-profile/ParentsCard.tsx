"use client";

import { useState } from "react";
import type { KidParent } from "@/app/_data/kids";
import { PlusIcon } from "@/components/shared/icons";
import { LinkParentModal } from "@/components/kid-profile/LinkParentModal";

const PARENT_BADGES: Record<
  KidParent["status"],
  { label: string; pill: string; text: string }
> = {
  active: { label: "ACTIVA", pill: "bg-[#CFEBD8]", text: "text-[#3E9B6C]" },
  pending: { label: "PENDIENTE", pill: "bg-[#F7E7A6]", text: "text-[#9A7B1E]" },
};

function LinkParentButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 pt-2"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
        <PlusIcon size={18} />
      </span>
      <span className="text-[14.5px] font-extrabold text-[#C5503A]">
        Vincular otro padre
      </span>
    </button>
  );
}

export function ParentsCard({
  parents,
  kidName,
}: {
  parents: KidParent[];
  kidName: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-4">
      <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-[14px]">
        {parents.length === 0 ? (
          <>
            <p className="m-0 text-[14.5px] text-[#A89A8B]">
              Sin padres vinculados todavía
            </p>
            <LinkParentButton onClick={() => setIsModalOpen(true)} />
          </>
        ) : (
          <>
            {parents.map((parent) => {
              const badge = PARENT_BADGES[parent.status];
              return (
                <div key={parent.name} className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white"
                    style={{ backgroundColor: parent.avatarBg }}
                  >
                    {parent.initial}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-extrabold text-foreground">
                      {parent.name}
                    </span>
                    <span className="block text-[12.5px] text-[#A89A8B]">
                      {parent.relation} · {parent.note}
                    </span>
                  </span>
                  <span
                    className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${badge.pill} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
            <LinkParentButton onClick={() => setIsModalOpen(true)} />
          </>
        )}
      </div>
      {isModalOpen && (
        <LinkParentModal
          kidName={kidName}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
