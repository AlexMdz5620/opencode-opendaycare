import type { Room } from "@/app/_data/rooms";

interface KidsRoomLabelProps {
  room: Room;
  count: number;
}

export function KidsRoomLabel({ room, count }: KidsRoomLabelProps) {
  return (
    <>
      <span className="text-[12.5px] font-extrabold tracking-[.8px] text-foreground">
        SALA {room.toUpperCase()}
      </span>
      <span className="text-[13px] text-[#A89A8B]">
        {count === 1 ? "1 niño" : `${count} niños`}
      </span>
      <span className="h-px flex-1 bg-[#E7DAC8]" />
    </>
  );
}
