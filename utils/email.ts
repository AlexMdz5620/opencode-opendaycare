import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

interface SendInvitationEmailInput {
  to: string;
  fullName: string;
  kidFirstName: string;
  code: string;
}

export async function sendInvitationEmail({
  to,
  fullName,
  kidFirstName,
  code,
}: SendInvitationEmailInput): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const activateUrl = `${appUrl}/activate-account?code=${encodeURIComponent(code)}`;

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM ?? "OpenDayCare <onboarding@resend.dev>",
    to,
    subject: `Invitación a OpenDayCare para ${kidFirstName}`,
    text: `Hola ${fullName},

Has sido invitado/a como padre, madre o tutor/a de ${kidFirstName} en OpenDayCare.

Tu código de activación es: ${code}

Activa tu cuenta aquí: ${activateUrl}

Vence en 7 días.`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
