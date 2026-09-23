import { ChevronLeftIcon } from "@/components/shared/icons";

export function ProfileBackLink() {
  return (
    <a
      href="#"
      className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]"
    >
      <ChevronLeftIcon size={18} />
      Volver a Niños
    </a>
  );
}
