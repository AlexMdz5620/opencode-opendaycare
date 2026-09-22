import { ImageIcon } from "@/components/shared/icons";

export function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
    >
      <ImageIcon size={30} />
      <span className="text-[13.5px]">{label}</span>
    </a>
  );
}
