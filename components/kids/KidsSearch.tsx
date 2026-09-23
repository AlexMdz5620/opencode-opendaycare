import { SearchIcon } from "@/components/shared/icons";

export function KidsSearch() {
  return (
    <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3">
      <SearchIcon size={18} className="flex-none text-[#B0A290]" />
      <input
        type="text"
        placeholder="Buscar niño…"
        className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#B6A99B]"
      />
    </div>
  );
}
