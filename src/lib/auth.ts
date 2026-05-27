export type Role = "super_admin" | "hod" | "team_lead" | "employee";

export type SessionUser = {
  name: string;
  email: string;
  role: Role;
};

const KEY = "devgn_performx_session";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function roleHome(role: Role): string {
  if (role === "super_admin") return "/app/executive";
  if (role === "hod" || role === "team_lead") return "/app/hod";
  return "/app/employee";
}

export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  hod: "Head of Department",
  team_lead: "Team Lead",
  employee: "Employee",
};
