import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, EmptyState } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDayTime, formatDuration, countdown } from "@/lib/format";

export default function SchedulePage() {
  const { timezone } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_sessions")
        .select("id, title, description, starts_at, duration_minutes, status, course:courses(title, slug)")
        .gte("starts_at", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
        .order("starts_at")
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Class schedule"
        description={`All times shown in ${timezone}.`}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading schedule…</p>
      ) : data?.length ? (
        <div className="space-y-3">
          {data.map((s) => (
            <div key={s.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base">{s.title}</h2>
                  {s.status === "live" && <Badge>Live now</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {(s.course as { title?: string } | null)?.title} · {formatDayTime(s.starts_at, timezone)} ·{" "}
                  {formatDuration(s.duration_minutes)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {countdown(s.starts_at) && <Badge variant="secondary">{countdown(s.starts_at)}</Badge>}
                <Button asChild size="sm" variant={s.status === "live" ? "default" : "outline"}>
                  <Link to={`/classroom/${s.id}`}>Open classroom</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No upcoming classes" description="New live sessions will show up here as they are scheduled." />
      )}
    </PageContainer>
  );
}
