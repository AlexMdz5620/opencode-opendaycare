import Link from "next/link";

export function LoginForm() {
  return (
    <div className="w-full max-w-[392px]">
      <h2 className="m-0 mb-[6px] font-display text-[30px] font-semibold text-[#3F362E]">
        Iniciar sesión
      </h2>
      <p className="m-0 mb-[28px] text-[15px] text-[#94887B]">
        Ingresá para ver el día de hoy.
      </p>

      <label
        htmlFor="login-email"
        className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#94887B]"
      >
        EMAIL
      </label>
      <input
        id="login-email"
        type="email"
        defaultValue="caro@opendaycare.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />

      <label
        htmlFor="login-password"
        className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#94887B]"
      >
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        type="password"
        placeholder="••••••••"
        className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />
      <div className="mb-5 text-right">
        <span className="cursor-pointer text-[13.5px] font-bold text-[#C5503A]">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <button
        type="button"
        className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
      >
        Iniciar sesión
      </button>

      <p className="mb-0 mt-6 text-center text-[14.5px] text-[#94887B]">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="font-extrabold text-[#C5503A]"
        >
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}
