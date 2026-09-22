"use client";

import { useState } from "react";
import { MenuIcon } from "@/components/shared/icons";
import { SidebarContent } from "@/components/shared/Sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#ECE0D0] bg-[#FFFDF9] text-[#3F362E] shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)] md:hidden"
      >
        <MenuIcon size={20} />
      </button>

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[#ECE0D0] bg-[#FFFDF9] p-6 px-4 md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
