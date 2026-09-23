import { KIDS } from "@/app/_data/kids";
import { KidCard } from "@/components/kids/KidCard";
import { KidsHeader } from "@/components/kids/KidsHeader";
import { KidsRoomLabel } from "@/components/kids/KidsRoomLabel";
import { KidsSearch } from "@/components/kids/KidsSearch";
import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <KidsHeader />
          <KidsSearch />
          <KidsRoomLabel />
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {KIDS.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
