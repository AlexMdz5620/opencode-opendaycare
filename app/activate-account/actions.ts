"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export interface ActivateState {
  error?: string;
}

export async function activateAccount(
  _prevState: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const code = formData.get("code");
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof code !== "string" ||
    code.trim() === "" ||
    typeof email !== "string" ||
    email.trim() === "" ||
    typeof password !== "string" ||
    password === ""
  ) {
    return { error: "Este campo es obligatorio" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } =
    await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

  if (signUpError) {
    if (
      signUpError.code === "user_already_exists" ||
      /already/i.test(signUpError.message)
    ) {
      return { error: "Este email ya tiene una cuenta. Iniciá sesión." };
    }
    return { error: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  if (!signUpData.user) {
    return { error: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  const { error: acceptError } = await supabase.rpc("accept_invitation", {
    p_code: code.trim(),
  });

  if (acceptError) {
    await supabase.auth.signOut();
    return { error: "Código inválido o expirado" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
