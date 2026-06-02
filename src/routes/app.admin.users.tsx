import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/app/Panels";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, type Role } from "@/lib/auth";
import { inviteUser, setUserRole, assignDepartment } from "@/lib/admin.functions";

export const Route = createFileRoute("/app/admin/users")({
  head: () => ({ meta: [{ title: "User Management · PerformX" }] }),
  component: AdminUsers,
});

type Row = {
  id: string;
  full_name: string;
  email: string | null;
  job_title: string | null;
  department_id: string | null;
  role: Role;
};

const ROLES: Role[] = ["super_admin", "hod", "team_lead", "employee"];

function AdminUsers() {
  const { role, status } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const invite = useServerFn(inviteUser);
  const setRole = useServerFn(setUserRole);
  const setDept = useServerFn(assignDepartment);

  useEffect(() => {
    if (status === "authenticated" && role !== "super_admin") {
      navigate({ to: "/app", replace: true });
    }
  }, [role, status, navigate]);

  const { data: depts } = useQuery({
    queryKey: ["departments-lite"],
    queryFn: async () => {
      const { data } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");
      return data ?? [];
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, job_title, department_id")
          .order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const order: Role[] = ["super_admin", "hod", "team_lead", "employee"];
      const byUser = new Map<string, Role>();
      (roles ?? []).forEach((r) => {
        const cur = byUser.get(r.user_id);
        const next = r.role as Role;
        if (!cur || order.indexOf(next) < order.indexOf(cur)) byUser.set(r.user_id, next);
      });
      return ((profiles ?? []) as Omit<Row, "role">[]).map((p) => ({
        ...p,
        role: byUser.get(p.id) ?? "employee",
      }));
    },
  });

  const mRole = useMutation({
    mutationFn: async (v: { user_id: string; role: Role }) =>
      setRole({ data: v }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mDept = useMutation({
    mutationFn: async (v: { user_id: string; department_id: string | null }) =>
      setDept({ data: v }),
    onSuccess: () => {
      toast.success("Department assigned");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);

  if (role !== "super_admin") return null;

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Identity & Access"
        title="User Management"
        subtitle="Invite teammates, set their role, and place them in the right department."
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground gold-glow"
          >
            <UserPlus className="size-4" /> Invite user
          </button>
        }
      />

      <Panel>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="size-4 animate-spin text-gold" /> Loading users…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-gold/15">
                  <th className="text-left py-3 pr-4">Name</th>
                  <th className="text-left py-3 pr-4">Email</th>
                  <th className="text-left py-3 pr-4">Role</th>
                  <th className="text-left py-3 pr-4">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {(users ?? []).map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-xs font-medium">
                          {(u.full_name || u.email || "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-foreground">{u.full_name || "Unnamed"}</div>
                          <div className="text-xs text-muted-foreground">{u.job_title || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          mRole.mutate({ user_id: u.id, role: e.target.value as Role })
                        }
                        className="bg-surface border border-gold/20 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold/50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={u.department_id ?? ""}
                        onChange={(e) =>
                          mDept.mutate({
                            user_id: u.id,
                            department_id: e.target.value || null,
                          })
                        }
                        className="bg-surface border border-gold/20 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-gold/50"
                      >
                        <option value="">— Unassigned —</option>
                        {(depts ?? []).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && (
        <InviteModal
          depts={depts ?? []}
          onClose={() => setOpen(false)}
          onSubmit={async (payload) => {
            try {
              await invite({ data: payload });
              toast.success(`Invitation sent to ${payload.email}`);
              qc.invalidateQueries({ queryKey: ["admin-users"] });
              setOpen(false);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

function InviteModal({
  depts,
  onClose,
  onSubmit,
}: {
  depts: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (p: {
    email: string;
    full_name: string;
    role: Role;
    department_id: string | null;
    job_title?: string;
  }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [dept, setDept] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md gold-glow">
        <div className="flex items-center gap-3 mb-5">
          <div className="size-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Shield className="size-5 text-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Invite teammate</h3>
            <p className="text-xs text-muted-foreground">They'll receive an email to set a password.</p>
          </div>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            await onSubmit({
              email,
              full_name: name,
              role,
              department_id: dept || null,
              job_title: title || undefined,
            });
            setBusy(false);
          }}
        >
          <Field label="Full name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Job title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </Field>
            <Field label="Department">
              <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-gold text-primary-foreground font-medium disabled:opacity-60 gold-glow"
            >
              {busy ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-surface border border-gold/20 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
