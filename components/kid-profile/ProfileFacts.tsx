import type { Kid } from "@/app/_data/kids";

export function ProfileFacts({ kid }: { kid: Kid }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9]">
      <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
        <span className="text-[14.5px] text-[#94887B]">
          Fecha de nacimiento
        </span>
        <span className="text-[14.5px] font-extrabold text-foreground">
          {kid.birthDate}
        </span>
      </div>
      <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
        <span className="text-[14.5px] text-[#94887B]">Sala</span>
        <span className="text-[14.5px] font-extrabold text-foreground">
          {kid.room}
        </span>
      </div>
      <div className="flex justify-between px-[18px] py-[15px]">
        <span className="text-[14.5px] text-[#94887B]">Ingreso</span>
        <span className="text-[14.5px] font-extrabold text-foreground">
          {kid.joinDate}
        </span>
      </div>
    </div>
  );
}
