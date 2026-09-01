import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney, intervalSuffix, formatDayTime, formatDuration } from "@/lib/format";

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { user, timezone } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["course", slug, user?.id],
    enabled: !!slug,
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (!course) return null;

      const [modules, lessons, plans, sessions, enrollment, progress] = await Promise.all([
        supabase.from("modules").select("*").eq("course_id", course.id).order("sort_order"),
        supabase.from("lessons").select("*").eq("course_id", course.id).order("sort_order"),
        supabase
          .from("payment_plans")
          .select("*")
          .eq("course_id", course.id)
          .eq("is_active", true)
          .eq("is_archived", false)
          .order("sort_order"),
        supabase
          .from("live_sessions")
          .select("id, title, starts_at, duration_minutes, status")
          .eq("course_id", course.id)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(5),
        user
          ? supabase
              .from("enrollments")
              .select("id, status")
              .eq("course_id", course.id)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        user
          ? supabase
              .from("lesson_progress")
              .select("lesson_id, completed")
              .eq("course_id", course.id)
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      return {
        course,
        modules: modules.data ?? [],
        lessons: lessons.data ?? [],
        plans: plans.data ?? [],
        sessions: sessions.data ?? [],
        enrolled: enrollment.data?.status === "active",
        progress: progress.data ?? [],
      };
    },
  });

  if (isLoading) return <PageContainer><p className="text-sm text-muted-foreground">Loading…</p></PageContainer>;
  if (!data) return <PageContainer><p className="text-sm text-muted-foreground">Course not found.</p></PageContainer>;

  const { course, modules, lessons, plans, sessions, enrolled, progress } = data;
  const isDone = (id: string) => progress.some((p) => p.lesson_id === id && p.completed);

  return (
    <PageContainer>
      <PageHeader
        title={course.title}
        description={course.subtitle ?? undefined}
        action={enrolled ? <Badge>Enrolled</Badge> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {course.description && (
            <div className="surface p-5">
              <h2 className="text-base">About this course</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{course.description}</p>
            </div>
          )}

          {course.learning_objectives?.length > 0 && (
            <div className="surface p-5">
              <h2 className="text-base">What you will learn</h2>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {course.learning_objectives.map((o: string) => (
                  <li key={o} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="surface p-5">
            <h2 className="text-base">Curriculum</h2>
            <div className="mt-4 space-y-5">
              {modules.map((m, idx) => (
                <div key={m.id}>
                  <p className="text-sm font-medium">
                    {idx + 1}. {m.title}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {lessons
                      .filter((l) => l.module_id === m.id)
                      .map((l) => {
                        const open = enrolled || l.is_free_preview;
                        const inner = (
                          <span className="flex items-center gap-2 py-1.5 text-sm">
                            {enrolled ? (
                              isDone(l.id) ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )
                            ) : open ? (
                              <PlayCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={open ? "" : "text-muted-foreground"}>{l.title}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatDuration(l.duration_minutes)}
                            </span>
                          </span>
                        );
                        return (
                          <li key={l.id}>
                            {open ? (
                              <Link to={`/courses/${course.slug}/lessons/${l.id}`} className="block hover:text-primary">
                                {inner}
                              </Link>
                            ) : (
                              inner
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
              {modules.length === 0 && (
                <p className="text-sm text-muted-foreground">Curriculum is being published.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {!enrolled && (
            <div className="surface p-5">
              <h2 className="text-base">Enrollment plans</h2>
              <div className="mt-3 space-y-3">
                {plans.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-sm">
                        {formatMoney(p.price, p.currency)}
                        {intervalSuffix(p.billing_interval)}
                      </span>
                    </div>
                    {p.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                    )}
                  </div>
                ))}
                {plans.length === 0 && (
                  <p className="text-sm text-muted-foreground">Pricing will be announced soon.</p>
                )}
              </div>
              <Button asChild className="mt-4 w-full">
                <Link to={user ? "/billing" : "/register"}>
                  {user ? "Go to billing" : "Create an account"}
                </Link>
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Checkout is being connected. An admin can activate your enrollment once payment is confirmed.
              </p>
            </div>
          )}

          <div className="surface p-5">
            <h2 className="text-base">Upcoming live classes</h2>
            <ul className="mt-3 space-y-3">
              {sessions.map((s) => (
                <li key={s.id} className="text-sm">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDayTime(s.starts_at, timezone)}</p>
                </li>
              ))}
              {sessions.length === 0 && (
                <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
