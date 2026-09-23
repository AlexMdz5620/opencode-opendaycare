import { PlusIcon } from "@/components/shared/icons";

export function KidsHeader() {
  return (
    <header className="mb-[22px] flex items-end justify-between gap-4">
      <div>
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-accent">
          GESTIÓN
        </div>
        <h1 className="m-0 font-display text-[30px] font-semibold text-foreground">
          Niños
        </h1>
      </div>
      <a
        href="#"
        className="flex flex-none items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
      >
        <PlusIcon size={17} />
        Agregar niño
      </a>
    </header>
  );
}
