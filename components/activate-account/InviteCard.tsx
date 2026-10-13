const AVATAR_BG = "#B9DEC4";
const AVATAR_COLOR = "#3E8B62";

export function InviteCard({
  childFirstName,
  roomName,
}: {
  childFirstName: string | null;
  roomName: string | null;
}) {
  const hasInvitation = Boolean(childFirstName && roomName);

  return (
    <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white p-4">
      <span
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: AVATAR_BG, color: AVATAR_COLOR }}
      >
        {hasInvitation ? childFirstName!.charAt(0).toUpperCase() : "?"}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] text-[#94887B]">
          Te invitaron a seguir a
        </span>
        <span className="block font-display text-[17px] font-semibold text-[#3F362E]">
          {hasInvitation
            ? `${childFirstName} · Sala ${roomName}`
            : "Crea tu cuenta para ver el feed"}
        </span>
      </span>
    </div>
  );
}
