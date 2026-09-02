import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDayTime } from "@/lib/format";

export default function TeacherCourseDetail() {
  const { id } = useParams();
  const { timezone } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-course", id],
    enabled: !!id,
    queryFn: async () => {
      const [course, modules, lessons, sessions, assignments, enrollments] = await Promise.all([
        supabase.from("courses").select("*").eq("id", id!).maybeSingle(),
        supabase.from("modules").select("*").eq("course_id", id!).order("sort_order"),
        supabase.from("lessons").select("*").eq("course_id", id!).order("sort_order"),
        supabase.from("live_sessions").select("*").eq("course_id", id!).order("starts_at", { ascending: false }).limit(20),
        supabase.from("assignments").select("*").eq("course_id", id!),
        supabase.from("enrollments").select("id, status").eq("course_id", id!),
      ]);
      return {
        course: course.data,
        modules: modules.data ?? [],
        lessons: lessons.data ?? [],
        sessions: sessions.data ?? [],
        assignments: assignments.data ?? [],
        enrollments: enrollments.data ?? [],
      };
    },
  });

  if (isLoading) return <PageContainer><p className="text-sm text-muted-foreground">Loading…</p></PageContainer>;
  if (!data?.course) return <PageContainer><p className="text-sm text-muted-foreground">Course not found.</p></PageContainer>;

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to="/teach">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to teaching
        </Link>
      </Button>

      <PageHeader
        title={data.course.title}
        description={data.course.subtitle ?? undefined}
        action={<Badge variant="secondary">{data.enrollments.filter((e) => e.status === "active").length} active students</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base">Curriculum</h2>
          <div className="mt-3 space-y-4">
            {data.modules.map((m) => (
              <div key={m.id}>
                <p className="text-sm font-medium">{m.title}</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {data.lessons
                    .filter((l) => l.module_id === m.id)
                    .map((l) => (
                      <li key={l.id}>{l.title}</li>
                    ))}
                </ul>
              </div>
            ))}
            {data.modules.length === 0 && <p className="text-sm text-muted-foreground">No modules yet.</p>}
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-base">Live sessions</h2>
          <ul className="mt-3 space-y-2">
            {data.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{s.title}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatDayTime(s.starts_at, timezone)}</span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/classroom/${s.id}`}>Open</Link>
                  </Button>
                </span>
              </li>
            ))}
            {data.sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
          </ul>
        </div>

        <div className="surface p-5 lg:col-span-2">
          <h2 className="text-base">Assignments</h2>
          <ul className="mt-3 space-y-2">
            {data.assignments.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/teach/assignments/${a.id}/submissions`}
                  className="flex items-center justify-between text-sm hover:text-primary"
                >
                  {a.title}
                  <span className="text-xs text-muted-foreground">Grade submissions →</span>
                </Link>
              </li>
            ))}
            {data.assignments.length === 0 && <p className="text-sm text-muted-foreground">No assignments yet.</p>}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
