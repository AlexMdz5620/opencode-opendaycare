import { WarningIcon } from "@/components/shared/icons";

export function AllergyBanner({
  allergies,
}: {
  allergies: { badge: string; text: string };
}) {
  return (
    <div className="flex gap-[14px] rounded-[16px] bg-[#FBDAD6] px-[18px] py-4">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0] text-white">
        <WarningIcon size={22} />
      </span>
      <div>
        <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
          Alergias y notas
        </div>
        <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
          {allergies.text}
        </div>
      </div>
    </div>
  );
}
