"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface SessionUser {
  name: string;
  initial: string;
  roleLabel: string;
}

export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const authUser = session?.user;
      if (!authUser?.email) return;

      const { data: row } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("email", authUser.email)
        .maybeSingle();

      const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        row?.full_name ||
        (typeof metadata.full_name === "string" ? metadata.full_name : "");
      const emailLocal = authUser.email.split("@")[0];
      const name =
        fullName ||
        (emailLocal
          ? emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1)
          : "");

      if (!name) return;

      const metaRole = typeof metadata.role === "string" ? metadata.role : "";
      const room = typeof metadata.room === "string" ? metadata.room : "";
      const dbRole = row?.role ?? "";

      let roleLabel = "";
      if (dbRole === "parent") {
        roleLabel = "Familia";
      } else if (dbRole === "staff" || dbRole === "admin") {
        roleLabel =
          metaRole || dbRole.charAt(0).toUpperCase() + dbRole.slice(1);
        if (room) roleLabel = `${roleLabel} · ${room}`;
      } else if (metaRole && room) {
        roleLabel = `${metaRole} · ${room}`;
      }

      setUser({
        name,
        initial: name.charAt(0).toUpperCase(),
        roleLabel,
      });
    });
  }, []);

  return user;
}
