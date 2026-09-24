"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/shared/icons";

export function PhotoConsent() {
  const [accepted, setAccepted] = useState(true);

  return (
    <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] p-4">
      <input
        type="checkbox"
        checked={accepted}
        onChange={(event) => setAccepted(event.target.checked)}
        className="sr-only"
      />
      <span
        className={`mt-[1px] flex h-6 w-6 flex-none items-center justify-center rounded-[8px] ${
          accepted
            ? "bg-[#5FB97E]"
            : "border-[1.5px] border-[#D9C48A] bg-white"
        }`}
      >
        {accepted && <CheckIcon size={15} className="text-white" />}
      </span>
      <span className="text-[14px] leading-[1.45] text-[#8A7234]">
        Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de
        la app.
      </span>
    </label>
  );
}
