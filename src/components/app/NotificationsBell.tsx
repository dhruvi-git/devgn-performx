import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(15);
    setItems((data ?? []) as Notification[]);
  };

  useEffect(() => {
    if (!profile?.id) return;
    load();
    const channel = supabase
      .channel(`notif-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const unread = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!profile?.id || unread === 0) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", profile.id)
      .is("read_at", null);
    load();
  };

  const openItem = async (n: Notification) => {
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link) navigate({ to: n.link });
    load();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative size-9 rounded-lg glass flex items-center justify-center hover:border-gold/40 transition">
          <Bell className="size-4 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-primary-foreground text-[10px] font-medium flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 border-gold/30 bg-surface/95 backdrop-blur-xl" align="end">
        <div className="flex items-center justify-between p-4 border-b border-gold/15">
          <div>
            <div className="text-sm font-medium">Notifications</div>
            <div className="text-xs text-muted-foreground">{unread} unread</div>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-gold hover:underline flex items-center gap-1">
              <Check className="size-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto divide-y divide-gold/10">
          {items.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">No notifications yet</div>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => openItem(n)}
              className={`w-full text-left p-4 hover:bg-gold/5 transition ${!n.read_at ? "bg-gold/[0.03]" : ""}`}
            >
              <div className="flex items-start gap-3">
                {!n.read_at && <span className="mt-1.5 size-1.5 rounded-full bg-gold shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
