"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SIDEBAR_USER } from "@/app/_data/mock";
import type { NavIcon } from "@/app/_data/mock";
import {
  BellIcon,
  HomeIcon,
  KidsIcon,
  LogoutIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
} from "@/components/shared/icons";

const NAV_ICONS = {
  home: HomeIcon,
  kids: KidsIcon,
  bell: BellIcon,
  user: UserIcon,
} as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/"
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] [background:linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <SunIcon size={21} />
        </span>
        <span>
          <span className="block font-display text-[17px] font-semibold leading-none text-[#3F362E]">
            OpenDayCare
          </span>
          <span className="mt-0.5 block text-[11.5px] text-[#A89A8B]">
            Sala Soles
          </span>
        </span>
      </Link>

      <Link
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <PlusIcon size={17} />
        Nueva publicación
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon as NavIcon];
          const active = isActivePath(pathname, item.href);
          const className = active
            ? "flex items-center gap-3 rounded-[12px] bg-[#FBE3D8] px-3 py-[11px] text-[14.5px] font-extrabold text-accent"
            : "flex items-center gap-3 rounded-[12px] px-3 py-[11px] text-[14.5px] font-semibold text-[#6E6359]";

          return (
            <Link key={item.label} href={item.href} className={className}>
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-[10px] border-t border-[#ECE0D0] pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-accent-soft font-display text-[16px] font-semibold text-white">
            {SIDEBAR_USER.initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-extrabold text-[#3F362E]">
              {SIDEBAR_USER.name}
            </span>
            <span className="block text-[12px] text-[#A89A8B]">
              {SIDEBAR_USER.role}
            </span>
          </span>
          <Link
            href="#"
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-background text-[#94887B]"
          >
            <LogoutIcon size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-[#ECE0D0] bg-[#FFFDF9] p-6 px-4 md:flex">
      <SidebarContent />
    </aside>
  );
}
