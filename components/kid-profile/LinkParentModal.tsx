"use client";

import { useEffect, useState } from "react";
import { CloseIcon, InfoIcon } from "@/components/shared/icons";

interface LinkParentModalProps {
  kidName: string;
  onClose: () => void;
}

type Relation = "Mamá" | "Papá" | "Tutor/a";

const RELATIONS: Relation[] = ["Mamá", "Papá", "Tutor/a"];

const LABEL_CLASS =
  "mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let index = 0; index < 5; index += 1) {
    const position = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length);
    code += INVITE_CODE_ALPHABET[position];
  }
  return code;
}

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-foreground outline-none placeholder:text-[#B6A99B]",
    hasError ? "border-[#D9583C]" : "border-[#EADFD0]",
  ].join(" ");
}

export function LinkParentModal({ kidName, onClose }: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<Relation>("Mamá");
  const [code] = useState(() => generateInviteCode());

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const firstName = kidName.split(" ")[0];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vincular padre"
        className="max-h-[calc(100dvh_-_32px)] w-full max-w-[480px] overflow-y-auto overflow-x-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] sm:max-h-[calc(100dvh_-_48px)]"
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <div>
            <div className="font-display text-[18px] font-semibold text-foreground">
              Vincular padre
            </div>
            <div className="text-[13px] text-[#A89A8B]">a {kidName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="p-[26px] pt-6">
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
            <InfoIcon size={20} className="mt-[1px] flex-none text-[#4E72C8]" />
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {firstName}.
            </span>
          </div>

          <div className="mb-[18px]">
            <div className={LABEL_CLASS}>NOMBRE DEL PADRE/MADRE</div>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Diego Fernández"
              className={inputClass(false)}
            />
          </div>

          <div className="mb-[18px]">
            <div className={LABEL_CLASS}>EMAIL</div>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              className={inputClass(false)}
            />
          </div>

          <div className="mb-5">
            <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
              PARENTESCO
            </div>
            <div className="flex gap-[9px]">
              {RELATIONS.map((option) => {
                const isActive = relation === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRelation(option)}
                    className={[
                      "flex-1 cursor-pointer rounded-full border-[1.5px] px-[11px] py-[11px] text-[14px] font-extrabold",
                      isActive
                        ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                        : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] px-[18px] py-[18px] text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
              {code}
            </div>
            <div className="mt-[6px] text-[13px] text-[#A88526]">
              Vence en 7 días
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
