import type { Metadata } from "next";
import { ActivateForm } from "@/components/activate-account/ActivateForm";
import { ActivateHeader } from "@/components/activate-account/ActivateHeader";
import { InviteCard } from "@/components/activate-account/InviteCard";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] px-7 py-10 sm:px-10">
      <div className="w-full max-w-[440px]">
        <ActivateHeader />
        <InviteCard />
        <ActivateForm />
      </div>
    </div>
  );
}
