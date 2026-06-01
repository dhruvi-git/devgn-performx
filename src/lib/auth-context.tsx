import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfileAndRole, type Profile, type Role } from "@/lib/auth";

type AuthState = {
  status: "loading" | "authenticated" | "anonymous";
  session: Session | null;
  profile: Profile | null;
  role: Role;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role>("employee");
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const hydrate = async (s: Session | null) => {
    if (!s?.user) {
      setSession(null);
      setProfile(null);
      setRole("employee");
      setStatus("anonymous");
      return;
    }
    setSession(s);
    const { profile, role } = await fetchProfileAndRole(s.user.id);
    setProfile(profile);
    setRole(role);
    setStatus("authenticated");
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer Supabase calls to avoid deadlocks
      setTimeout(() => { void hydrate(s); }, 0);
    });
    // Then check existing session
    supabase.auth.getSession().then(({ data }) => { void hydrate(data.session); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      session,
      profile,
      role,
      refresh: async () => {
        const { data } = await supabase.auth.getSession();
        await hydrate(data.session);
      },
    }),
    [status, session, profile, role],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
