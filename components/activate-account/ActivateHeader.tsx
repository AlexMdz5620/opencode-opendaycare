import { SunIcon } from "@/components/shared/icons";

export function ActivateHeader() {
  return (
    <>
      <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
        <SunIcon size={30} />
      </div>
      <h1 className="m-0 mb-2 font-display text-[32px] font-semibold leading-[1.15] text-[#3F362E]">
        Bienvenida a OpenDayCare
      </h1>
      <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-[#94887B]">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
        activar la cuenta.
      </p>
    </>
  );
}
