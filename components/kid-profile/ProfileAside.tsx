import Link from "next/link";
import type { Kid } from "@/app/_data/kids";
import { SunIcon } from "@/components/shared/icons";
import { ParentsCard } from "@/components/kid-profile/ParentsCard";

export function ProfileAside({ kid }: { kid: Kid }) {
  return (
    <div className="flex w-full flex-none flex-col gap-[14px] md:w-[300px]">
      <Link
        href="#"
        className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-foreground px-[13px] py-[13px] text-[15px] font-extrabold text-white"
      >
        <SunIcon size={18} />
        Resumen del día
      </Link>
      <ParentsCard parents={kid.parents} />
    </div>
  );
}
