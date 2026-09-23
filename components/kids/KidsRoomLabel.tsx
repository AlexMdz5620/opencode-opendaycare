import { KIDS } from "@/app/_data/kids";

export function KidsRoomLabel() {
  return (
    <div className="mb-[14px] flex items-center gap-3">
      <span className="text-[12.5px] font-extrabold tracking-[.8px] text-foreground">
        SALA SOLES
      </span>
      <span className="text-[13px] text-[#A89A8B]">{KIDS.length} niños</span>
      <span className="h-px flex-1 bg-[#E7DAC8]" />
    </div>
  );
}
