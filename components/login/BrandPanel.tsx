import { SunIcon } from "@/components/shared/icons";

export function BrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-7 py-12 text-white sm:px-[60px] sm:py-[56px]">
      <div className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/[.12]" />
      <div className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/[.10]" />
      <div className="relative flex items-center gap-[13px]">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/[.22]">
          <SunIcon size={26} />
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
        <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/[.92]">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>
      <div className="relative text-[14px] text-white/90">
        🌿 Guardería Sala Soles
      </div>
    </div>
  );
}
