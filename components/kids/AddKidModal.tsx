"use client";

import { useEffect, useState } from "react";
import type { Kid } from "@/app/_data/kids";
import { saveLocalKid } from "@/app/_data/localKids";
import { ROOMS, type Room } from "@/app/_data/rooms";
import { ChevronDownIcon } from "@/components/shared/icons";

interface AddKidModalProps {
  onClose: () => void;
  onSaved: (kid: Kid) => void;
}

interface FormErrors {
  name: boolean;
  birthDate: boolean;
  room: boolean;
}

const EMPTY_ERRORS: FormErrors = { name: false, birthDate: false, room: false };

const LABEL_CLASS =
  "mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-foreground outline-none placeholder:text-[#B6A99B]",
    hasError ? "border-[#D9583C]" : "border-[#EADFD0]",
  ].join(" ");
}

function ErrorMessage() {
  return (
    <p className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">
      Este campo es obligatorio
    </p>
  );
}

export function AddKidModal({ onClose, onSaved }: AddKidModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [room, setRoom] = useState<Room>(ROOMS[0]);
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FormErrors = {
      name: !name.trim(),
      birthDate: !birthDate,
      room: !room,
    };
    setErrors(next);
    if (next.name || next.birthDate || next.room) return;
    const kid = saveLocalKid({
      name: name.trim(),
      birthDate,
      room,
      allergies: allergies.trim() ? allergies.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    });
    onSaved(kid);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Agregar niño"
        onSubmit={handleSubmit}
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-foreground">
            Agregar niño
          </span>
          <button
            type="submit"
            className="cursor-pointer text-[15px] font-extrabold text-[#D9583C]"
          >
            Guardar
          </button>
        </div>

        <div className="p-[26px] pt-6">
          <div className="mb-[18px]">
            <div className={LABEL_CLASS}>NOMBRE COMPLETO</div>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Martina López"
              className={inputClass(errors.name)}
            />
            {errors.name && <ErrorMessage />}
          </div>

          <div className="mb-[18px] flex gap-[14px]">
            <div className="min-w-0 flex-1">
              <div className={LABEL_CLASS}>FECHA DE NACIMIENTO</div>
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className={inputClass(errors.birthDate)}
              />
              {errors.birthDate && <ErrorMessage />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={LABEL_CLASS}>SALA</div>
              <div className="relative">
                <select
                  value={room}
                  onChange={(event) =>
                    setRoom(event.target.value as Room)
                  }
                  className={`${inputClass(errors.room)} appearance-none pr-10 font-bold`}
                >
                  {ROOMS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#B0A290]"
                />
              </div>
              {errors.room && <ErrorMessage />}
            </div>
          </div>

          <div className="mb-[18px]">
            <div className={LABEL_CLASS}>ALERGIAS (ETIQUETAS)</div>
            <input
              type="text"
              value={allergies}
              onChange={(event) => setAllergies(event.target.value)}
              placeholder="Ej. Maní, Lactosa"
              className={inputClass(false)}
            />
          </div>

          <div>
            <div className={LABEL_CLASS}>NOTAS MÉDICAS</div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Indicaciones, medicación, contactos…"
              className={`${inputClass(false)} min-h-[90px] resize-y leading-normal`}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
