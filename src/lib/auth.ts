import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "hod" | "team_lead" | "employee";

export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  hod: "Head of Department",
  team_lead: "Team Lead",
  employee: "Employee",
};

export function roleHome(role: Role): string {
  if (role === "super_admin") return "/app/executive";
  if (role === "hod" || role === "team_lead") return "/app/hod";
  return "/app/employee";
}

const ORDER: Role[] = ["super_admin", "hod", "team_lead", "employee"];
export function highestRole(roles: Role[]): Role {
  for (const r of ORDER) if (roles.includes(r)) return r;
  return "employee";
}

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  job_title: string | null;
  department_id: string | null;
};

export async function fetchProfileAndRole(
  userId: string,
): Promise<{ profile: Profile | null; role: Role }> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, job_title, department_id")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const role = highestRole(((roles ?? []) as { role: Role }[]).map((r) => r.role));
  return { profile: (profile as Profile | null) ?? null, role };
}

export async function signOut() {
  await supabase.auth.signOut();
}
