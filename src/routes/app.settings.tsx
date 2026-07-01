import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { UserCircle, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Panel } from "@/components/app/Panels";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateProfile } from "@/lib/profile.functions";
import { roleLabels } from "@/lib/auth";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · PerformX" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, role, refresh } = useAuth();
  const save = useServerFn(updateProfile);

  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setJobTitle(profile.job_title ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const saveMut = useMutation({
    mutationFn: async () =>
      save({
        data: {
          full_name: fullName || undefined,
          job_title: jobTitle || null,
          avatar_url: avatarUrl || null,
        },
      }),
    onSuccess: async () => {
      toast.success("Profile updated");
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your identity, presentation, and workspace preferences."
      />

      <div className="space-y-6">
        <Panel title="Profile">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-16 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-xl font-medium overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                (fullName || "M")[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="text-sm text-foreground">{profile?.email}</div>
              <div className="text-xs text-gold flex items-center gap-1 mt-1">
                <ShieldCheck className="size-3" />
                {roleLabels[role]}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Job title</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Producer"
                className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Avatar URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              className="bg-gradient-gold text-primary-foreground"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              <Save className="size-4 mr-2" />
              {saveMut.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </Panel>

        <Panel title="About">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <UserCircle className="size-5 text-gold shrink-0" />
            <p>
              Devgn PerformX is your workforce intelligence platform. To change your email or reset your
              password, use the "Forgot password" flow from the sign-in screen. Role and department
              assignments are managed by your organization admin.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
