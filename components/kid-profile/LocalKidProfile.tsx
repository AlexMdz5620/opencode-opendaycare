"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Kid } from "@/app/_data/kids";
import { loadLocalKids } from "@/app/_data/localKids";
import { AllergyBanner } from "@/components/kid-profile/AllergyBanner";
import { ProfileAside } from "@/components/kid-profile/ProfileAside";
import { ProfileBackLink } from "@/components/kid-profile/ProfileBackLink";
import { ProfileFacts } from "@/components/kid-profile/ProfileFacts";
import { ProfileHero } from "@/components/kid-profile/ProfileHero";

interface LocalKidProfileProps {
  id: string;
}

export function LocalKidProfile({ id }: LocalKidProfileProps) {
  const [kid, setKid] = useState<Kid | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKid(loadLocalKids().find((entry) => entry.id === id) ?? null);
  }, [id]);

  if (kid === undefined) {
    return (
      <>
        <ProfileBackLink />
        <p className="text-[15px] text-[#94887B]">Cargando…</p>
      </>
    );
  }

  if (kid === null) {
    return (
      <div className="rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-6 text-center">
        <p className="m-0 font-display text-[18px] font-semibold text-foreground">
          Niño no encontrado
        </p>
        <Link
          href="/kids"
          className="mt-3 inline-flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]"
        >
          Volver a Niños
        </Link>
      </div>
    );
  }

  return (
    <>
      <ProfileBackLink />
      <div className="flex flex-wrap items-start gap-[26px]">
        <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
          <ProfileHero kid={kid} />
          {kid.allergies && <AllergyBanner allergies={kid.allergies} />}
          <ProfileFacts kid={kid} />
        </div>
        <ProfileAside kid={kid} />
      </div>
    </>
  );
}
