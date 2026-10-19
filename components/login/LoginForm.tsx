"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const hasError = Boolean(state.error);

  return (
    <form action={formAction} aria-busy={pending} className="w-full max-w-[392px]">
      <h2 className="m-0 mb-[6px] font-display text-[30px] font-semibold text-[#3F362E]">
        Iniciar sesión
      </h2>
      <p className="m-0 mb-[28px] text-[15px] text-[#6E6357]">
        Ingresá para ver el día de hoy.
      </p>

      <label
        htmlFor="login-email"
        className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#6E6357]"
      >
        EMAIL
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? "login-error" : undefined}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#9C8974] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#7A6E62] focus-visible:border-[#8F2F1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8F2F1C]"
      />

      <label
        htmlFor="login-password"
        className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#6E6357]"
      >
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? "login-error" : undefined}
        className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#9C8974] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#7A6E62] focus-visible:border-[#8F2F1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8F2F1C]"
      />
      <div className="mb-5 text-right">
        <span className="text-[13.5px] font-bold text-[#B54430]">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="mb-4 text-[14px] font-semibold text-[#B8432B]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#C5503A,#A83B28)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(168,59,40,.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F362E] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>

      <p className="mb-0 mt-6 text-center text-[14.5px] text-[#6E6357]">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="font-extrabold text-[#B54430] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B54430]"
        >
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
