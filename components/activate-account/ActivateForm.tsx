import Link from "next/link";
import { PhotoConsent } from "@/components/activate-account/PhotoConsent";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#94887B]"
    >
      {children}
    </label>
  );
}

export function ActivateForm() {
  return (
    <div>
      <FieldLabel htmlFor="invite-code">CÓDIGO DE INVITACIÓN</FieldLabel>
      <input
        id="invite-code"
        defaultValue="7K4P9"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-[#3F362E] focus:outline-none"
      />

      <FieldLabel htmlFor="activate-email">EMAIL</FieldLabel>
      <input
        id="activate-email"
        type="email"
        defaultValue="lucia.fernandez@gmail.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />

      <FieldLabel htmlFor="activate-password">CREAR CONTRASEÑA</FieldLabel>
      <input
        id="activate-password"
        type="password"
        defaultValue="contraseña"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] focus:outline-none"
      />

      <PhotoConsent />

      <button
        type="button"
        className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
      >
        Activar mi cuenta
      </button>

      <p className="mb-0 mt-[22px] text-center text-[14.5px] text-[#94887B]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-[#C5503A]">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
