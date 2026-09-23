import type { Kid } from "@/app/_data/kids";

export function ProfileHero({ kid }: { kid: Kid }) {
  return (
    <div className="flex items-center gap-[18px]">
      <span
        className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
        style={{ backgroundColor: kid.avatarBg, color: kid.avatarColor }}
      >
        {kid.initial}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="m-0 font-display text-[28px] font-semibold text-foreground">
          {kid.name}
        </h1>
        <p className="mt-[3px] mb-0 text-[15px] text-[#94887B]">
          {kid.ageYears} años · Sala {kid.room}
        </p>
      </div>
      <a
        href="#"
        className="flex-none rounded-[12px] border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
      >
        Editar
      </a>
    </div>
  );
}
