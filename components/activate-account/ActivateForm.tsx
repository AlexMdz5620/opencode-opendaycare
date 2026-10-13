"use client";

import Link from "next/link";
import { useActionState } from "react";
import { activateAccount, type ActivateState } from "@/app/activate-account/actions";
import { PhotoConsent } from "@/components/activate-account/PhotoConsent";

const initialState: ActivateState = {};

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

export function ActivateForm({
  initialCode,
  initialEmail,
}: {
  initialCode: string;
  initialEmail: string;
}) {
  const [state, formAction, pending] = useActionState(
    activateAccount,
    initialState,
  );

  return (
    <form action={formAction}>
      <FieldLabel htmlFor="invite-code">CÓDIGO DE INVITACIÓN</FieldLabel>
      <input
        id="invite-code"
        name="code"
        defaultValue={initialCode}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-[#3F362E] focus:outline-none"
      />

      <FieldLabel htmlFor="activate-email">EMAIL</FieldLabel>
      <input
        id="activate-email"
        name="email"
        type="email"
        defaultValue={initialEmail}
        placeholder="correo@ejemplo.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />

      <FieldLabel htmlFor="activate-password">CREAR CONTRASEÑA</FieldLabel>
      <input
        id="activate-password"
        name="password"
        type="password"
        placeholder="Mínimo 6 caracteres"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />

      {state.error && (
        <p className="mb-4 text-[14px] font-semibold text-[#D9583C]">
          {state.error}
        </p>
      )}

      <PhotoConsent />

      <button
        type="submit"
        disabled={pending}
        className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Activando…" : "Activar mi cuenta"}
      </button>

      <p className="mb-0 mt-[22px] text-center text-[14.5px] text-[#94887B]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-[#C5503A]">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
