import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "agency" | "operator";

export async function requireRole(allowedRoles: AppRole[]) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", userId)
    .maybeSingle();

  const role = (profile?.roles as { name?: string } | null)?.name;

  if (!role || !allowedRoles.includes(role as AppRole)) redirect("/");

  return { userId, role: role as AppRole };
}
