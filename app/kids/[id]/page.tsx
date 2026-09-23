import { notFound } from "next/navigation";
import { getKidById } from "@/app/_data/kids";
import { AllergyBanner } from "@/components/kid-profile/AllergyBanner";
import { ProfileAside } from "@/components/kid-profile/ProfileAside";
import { ProfileBackLink } from "@/components/kid-profile/ProfileBackLink";
import { ProfileFacts } from "@/components/kid-profile/ProfileFacts";
import { ProfileHero } from "@/components/kid-profile/ProfileHero";
import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kid = getKidById(id);

  if (!kid) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          <ProfileBackLink />
          <div className="flex flex-wrap items-start gap-[26px]">
            <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
              <ProfileHero kid={kid} />
              {kid.allergies && <AllergyBanner allergies={kid.allergies} />}
              <ProfileFacts kid={kid} />
            </div>
            <ProfileAside kid={kid} />
          </div>
        </div>
      </main>
    </div>
  );
}
