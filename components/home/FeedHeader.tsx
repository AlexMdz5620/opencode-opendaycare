import { ROOM_SUBTITLE } from "@/app/_data/mock";

export function FeedHeader() {
  return (
    <header className="mb-6">
      <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-accent">
        GUARDERÍA · SALA SOLES
      </div>
      <h1 className="m-0 font-display text-[30px] font-semibold text-foreground">
        Buenas, Caro
      </h1>
      <p className="mt-[5px] text-[14.5px] text-[#94887B]">{ROOM_SUBTITLE}</p>
    </header>
  );
}
