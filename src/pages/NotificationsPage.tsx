import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer, PageHeader, EmptyState } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDayTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user, timezone } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
  };

  const open = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
  };

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Class reminders, grades and platform updates."
        action={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={markAll}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data?.length ? (
        <div className="space-y-2">
          {data.map((n) => {
            const body = (
              <div
                className={cn("surface p-4", !n.read && "border-l-2 border-primary")}
                onClick={() => !n.read && open(n.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDayTime(n.created_at, timezone)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} className="block">
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No notifications" description="You are all caught up." />
      )}
    </PageContainer>
  );
}
