import { SIDEBAR_USER } from "@/app/_data/mock";
import { CameraIcon } from "@/components/shared/icons";

export function Composer() {
  return (
    <a
      href="#"
      className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-soft font-display text-[16px] font-semibold text-white">
        {SIDEBAR_USER.initial}
      </span>
      <span className="flex-1 text-[15px] text-[#A89A8B]">
        Compartí un momento…
      </span>
      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[#FBE3D8] text-[#E0654A]">
        <CameraIcon size={19} />
      </span>
    </a>
  );
}
