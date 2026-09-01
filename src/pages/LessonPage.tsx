import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileText, Link2 } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDuration } from "@/lib/format";

export default function LessonPage() {
  const { slug, lessonId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lesson", lessonId, user?.id],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data: lesson, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId!)
        .maybeSingle();
      if (error) throw error;
      if (!lesson) return null;
      const [resources, progress] = await Promise.all([
        supabase.from("resources").select("*").eq("lesson_id", lesson.id).order("sort_order"),
        user
          ? supabase
              .from("lesson_progress")
              .select("*")
              .eq("lesson_id", lesson.id)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { lesson, resources: resources.data ?? [], progress: progress.data };
    },
  });

  const markComplete = async () => {
    if (!user || !data?.lesson) return;
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: data.lesson.id,
        course_id: data.lesson.course_id,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) toast.error(error.message);
    else {
      toast.success("Lesson marked complete");
      qc.invalidateQueries({ queryKey: ["lesson", lessonId] });
    }
  };

  if (isLoading) return <PageContainer><p className="text-sm text-muted-foreground">Loading…</p></PageContainer>;
  if (!data) return <PageContainer><p className="text-sm text-muted-foreground">Lesson not found.</p></PageContainer>;

  const completed = data.progress?.completed;

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to={`/courses/${slug}`}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to course
        </Link>
      </Button>

      <PageHeader
        title={data.lesson.title}
        description={data.lesson.description ?? formatDuration(data.lesson.duration_minutes)}
        action={
          <Button onClick={markComplete} disabled={!!completed} variant={completed ? "outline" : "default"}>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {completed ? "Completed" : "Mark complete"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <article className="surface p-6">
          {data.lesson.content ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: data.lesson.content }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Lesson notes will appear here once the instructor publishes them.
            </p>
          )}
        </article>

        <aside className="surface h-fit p-5">
          <h2 className="text-base">Resources</h2>
          <ul className="mt-3 space-y-2">
            {data.resources.map((r) => (
              <li key={r.id}>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Link2 className="h-4 w-4" /> {r.title}
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" /> {r.title}
                  </span>
                )}
              </li>
            ))}
            {data.resources.length === 0 && (
              <p className="text-sm text-muted-foreground">No resources attached.</p>
            )}
          </ul>
        </aside>
      </div>
    </PageContainer>
  );
}
