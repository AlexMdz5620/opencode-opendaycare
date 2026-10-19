import { SunIcon } from "@/components/shared/icons";

export function BrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-7 py-12 text-[#2A241E] sm:px-[60px] sm:py-[56px]">
      <div
        aria-hidden="true"
        className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/[.12]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/[.10]"
      />
      <div className="relative flex items-center gap-[13px]">
        <div
          aria-hidden="true"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/[.22]"
        >
          <SunIcon size={26} stroke="#2A241E" />
        </div>
        <span className="font-display text-[21px] font-semibold tracking-[.5px]">
          OpenDayCare
        </span>
      </div>
      <div className="relative my-10 sm:my-0">
        <h1 className="m-0 mb-[18px] font-display text-[30px] font-semibold leading-[1.12] sm:text-[42px]">
          El día de cada niño,{" "}
          <br />
          compartido con su familia.
        </h1>
        <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-[#2A241E]">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>
      <div className="relative text-[14px] text-[#2A241E]">
        🌿 Guardería Sala Soles
      </div>
    </div>
  );
}
