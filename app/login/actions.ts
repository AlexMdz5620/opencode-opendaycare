"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    email.trim() === "" ||
    typeof password !== "string" ||
    password === ""
  ) {
    return { error: "Este campo es obligatorio" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userRow } = user
    ? await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  revalidatePath("/", "layout");
  redirect(
    userRow?.role === "staff" || userRow?.role === "admin"
      ? "/staff"
      : "/family",
  );
}
