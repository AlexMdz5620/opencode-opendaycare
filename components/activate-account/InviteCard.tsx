import { getKidById } from "@/app/_data/kids";

const INVITE_KID_ID = "1";

export function InviteCard() {
  const kid = getKidById(INVITE_KID_ID);
  if (!kid) return null;

  const firstName = kid.name.split(" ")[0];

  return (
    <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white p-4">
      <span
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: kid.avatarBg, color: kid.avatarColor }}
      >
        {kid.initial}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] text-[#94887B]">
          Te invitaron a seguir a
        </span>
        <span className="block font-display text-[17px] font-semibold text-[#3F362E]">
          {firstName} · Sala {kid.room}
        </span>
      </span>
    </div>
  );
}
