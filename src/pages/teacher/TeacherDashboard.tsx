import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, EmptyState } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDayTime } from "@/lib/format";

export default function TeacherDashboard() {
  const { user, timezone, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: assigned } = await supabase
        .from("course_instructors")
        .select("course_id, is_lead, course:courses(id, title, slug, is_published)")
        .eq("teacher_id", user!.id);

      let courses = (assigned ?? [])
        .map((a) => a.course as { id: string; title: string; slug: string; is_published: boolean } | null)
        .filter(Boolean) as { id: string; title: string; slug: string; is_published: boolean }[];

      if (isAdmin && courses.length === 0) {
        const { data: all } = await supabase.from("courses").select("id, title, slug, is_published").order("sort_order");
        courses = all ?? [];
      }

      const ids = courses.map((c) => c.id);
      const [sessions, assignments] = await Promise.all([
        ids.length
          ? supabase
              .from("live_sessions")
              .select("id, title, starts_at, status, course_id")
              .in("course_id", ids)
              .gte("starts_at", new Date(Date.now() - 3 * 3600 * 1000).toISOString())
              .order("starts_at")
              .limit(6)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase.from("assignments").select("id, title, course_id").in("course_id", ids)
          : Promise.resolve({ data: [] }),
      ]);

      return { courses, sessions: sessions.data ?? [], assignments: assignments.data ?? [] };
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Teaching" description="Your courses, classes and grading queue." />

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <section>
        <h2 className="mb-3 text-lg">Courses</h2>
        {data?.courses.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.courses.map((c) => (
              <Link key={c.id} to={`/teach/courses/${c.id}`} className="surface-hover flex items-center justify-between p-4">
                <span className="text-base">{c.title}</span>
                <Badge variant={c.is_published ? "default" : "secondary"}>
                  {c.is_published ? "Published" : "Draft"}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No courses assigned" description="An admin can assign you as an instructor." />
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg">Upcoming classes</h2>
        {data?.sessions.length ? (
          <div className="space-y-2">
            {data.sessions.map((s) => (
              <div key={s.id} className="surface flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDayTime(s.starts_at, timezone)}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/classroom/${s.id}`}>Open classroom</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No classes scheduled.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg">Assignments to grade</h2>
        {data?.assignments.length ? (
          <div className="space-y-2">
            {data.assignments.map((a) => (
              <Link
                key={a.id}
                to={`/teach/assignments/${a.id}/submissions`}
                className="surface-hover flex items-center justify-between p-4 text-sm"
              >
                {a.title}
                <span className="text-xs text-muted-foreground">Review submissions →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No assignments published yet.</p>
        )}
      </section>
    </PageContainer>
  );
}
