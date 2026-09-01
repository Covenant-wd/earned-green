import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarClock, ClipboardList, Megaphone } from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDayTime, countdown } from "@/lib/format";

export default function DashboardPage() {
  const { user, profile, timezone } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [enrollments, sessions, assignments, announcements] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id, status, course:courses(id, slug, title, subtitle)")
          .eq("user_id", user!.id)
          .eq("status", "active"),
        supabase
          .from("live_sessions")
          .select("id, title, starts_at, duration_minutes, status, course:courses(title, slug)")
          .gte("starts_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .order("starts_at")
          .limit(4),
        supabase
          .from("assignments")
          .select("id, title, due_at, course:courses(title, slug)")
          .eq("is_published", true)
          .order("due_at", { nullsFirst: false })
          .limit(4),
        supabase
          .from("announcements")
          .select("id, title, body, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(3),
        ]);
      const progress = await supabase
        .from("lesson_progress")
        .select("course_id, completed")
        .eq("user_id", user!.id);
      return {
        enrollments: enrollments.data ?? [],
        sessions: sessions.data ?? [],
        assignments: assignments.data ?? [],
        announcements: announcements.data ?? [],
        progress: progress.data ?? [],
      };
    },
  });

  const nextSession = data?.sessions?.[0];

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back${profile?.first_name ? `, ${profile.first_name}` : ""}`}
        description="Your classes, coursework and updates at a glance."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" /> Next live class
          </div>
          {nextSession ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg">{nextSession.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {(nextSession.course as { title?: string } | null)?.title} ·{" "}
                  {formatDayTime(nextSession.starts_at, timezone)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {countdown(nextSession.starts_at) && (
                  <Badge variant="secondary">{countdown(nextSession.starts_at)}</Badge>
                )}
                <Button asChild size="sm">
                  <Link to={`/classroom/${nextSession.id}`}>Enter classroom</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : "No upcoming classes scheduled yet."}
            </p>
          )}
        </div>

        <div className="surface p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" /> Enrolled courses
          </div>
          <p className="mt-2 text-3xl font-semibold">{data?.enrollments.length ?? 0}</p>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link to="/courses">Browse catalogue</Link>
          </Button>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg">My courses</h2>
      {data?.enrollments.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.enrollments.map((e) => {
            const course = e.course as { id: string; slug: string; title: string; subtitle: string | null } | null;
            if (!course) return null;
            const rows = data.progress.filter((p) => p.course_id === course.id);
            const done = rows.filter((p) => p.completed).length;
            const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
            return (
              <Link key={e.id} to={`/courses/${course.slug}`} className="surface-hover block p-5">
                <h3 className="text-base">{course.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{course.subtitle}</p>
                <Progress value={pct} className="mt-4 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">{pct}% of tracked lessons complete</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="You are not enrolled in a course yet"
          description="Explore the catalogue and pick a learning path to get started."
        />
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="h-4 w-4" /> Assignments
          </div>
          {data?.assignments.length ? (
            <ul className="space-y-3">
              {data.assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{a.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {a.due_at ? formatDayTime(a.due_at, timezone) : "No due date"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing due right now.</p>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-3">
            <Link to="/assignments">Open assignments</Link>
          </Button>
        </div>

        <div className="surface p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Megaphone className="h-4 w-4" /> Announcements
          </div>
          {data?.announcements.length ? (
            <ul className="space-y-3">
              {data.announcements.map((a) => (
                <li key={a.id}>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
