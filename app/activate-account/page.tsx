import type { Metadata } from "next";
import { ActivateForm } from "@/components/activate-account/ActivateForm";
import { ActivateHeader } from "@/components/activate-account/ActivateHeader";
import { InviteCard } from "@/components/activate-account/InviteCard";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

interface InvitationPreview {
  fullName: string;
  email: string;
  childFirstName: string;
  roomName: string;
}

export default async function ActivateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const invitationCode = typeof code === "string" ? code.trim() : "";

  let invitation: InvitationPreview | null = null;
  if (invitationCode) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_invitation_by_code", {
      p_code: invitationCode,
    });
    const row = Array.isArray(data) ? data[0] : undefined;
    if (
      row &&
      row.status === "pending" &&
      new Date(row.expires_at) > new Date()
    ) {
      invitation = {
        fullName: row.full_name,
        email: row.email,
        childFirstName: row.child_first_name,
        roomName: row.room_name,
      };
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] px-7 py-10 sm:px-10">
      <div className="w-full max-w-[440px]">
        <ActivateHeader />
        <InviteCard
          childFirstName={invitation?.childFirstName ?? null}
          roomName={invitation?.roomName ?? null}
        />
        <ActivateForm
          initialCode={invitationCode}
          initialEmail={invitation?.email ?? ""}
        />
      </div>
    </div>
  );
}
