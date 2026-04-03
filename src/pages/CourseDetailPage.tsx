import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Circle, Play, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { toast } from "sonner";

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeLesson, setActiveLesson] = useState<any>(null);

  useEffect(() => {
    if (!user || !id) return;

    const load = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      setCourse(courseData);

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("sort_order");
      setLessons(lessonsData || []);
      if (lessonsData?.length) setActiveLesson(lessonsData[0]);

      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true);
      setCompletedIds(new Set((progressData || []).map((p: any) => p.lesson_id)));
    };

    load();
  }, [user, id]);

  const toggleComplete = async (lessonId: string) => {
    if (!user) return;
    const isCompleted = completedIds.has(lessonId);

    if (isCompleted) {
      await supabase
        .from("lesson_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId);
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
    } else {
      await supabase.from("lesson_progress").upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      setCompletedIds((prev) => new Set(prev).add(lessonId));
      toast.success("Lesson completed! 🎉");
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch")) {
      const vid = new URL(url).searchParams.get("v");
      return vid ? `https://www.youtube.com/embed/${vid}` : null;
    }
    if (url.includes("youtu.be/")) {
      const vid = url.split("youtu.be/")[1]?.split("?")[0];
      return vid ? `https://www.youtube.com/embed/${vid}` : null;
    }
    if (url.includes("tiktok.com")) return url;
    return url;
  };

  if (!course) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse-glow h-8 w-8 rounded-full gradient-primary" />
        </div>
      </div>
    );
  }

  const pct = lessons.length > 0 ? Math.round((completedIds.size / lessons.length) * 100) : 0;

  return (
    <div className="page-container">
      <Button variant="ghost" size="sm" onClick={() => navigate("/courses")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to courses
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - lesson list */}
        <div className="lg:w-80 shrink-0">
          <div className="glass-card p-4 mb-4">
            <h2 className="font-display font-bold text-lg">{course.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
            <div className="flex items-center gap-2 mt-3">
              {course.difficulty && <Badge variant="secondary" className="text-xs">{course.difficulty}</Badge>}
              <span className="text-xs text-muted-foreground">{lessons.length} lessons</span>
            </div>
            {lessons.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{completedIds.size}/{lessons.length} completed</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="glass-card overflow-hidden">
            {lessons.map((lesson, i) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className={`w-full text-left p-3 flex items-start gap-3 border-b border-border last:border-0 transition-colors hover:bg-accent/50 ${
                  activeLesson?.id === lesson.id ? "bg-accent/30" : ""
                }`}
              >
                <div className="mt-0.5">
                  {completedIds.has(lesson.id) ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i + 1}. {lesson.title}</p>
                  {lesson.duration_minutes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{lesson.duration_minutes} min</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {activeLesson ? (
            <motion.div key={activeLesson.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display font-semibold text-xl">{activeLesson.title}</h3>
                  <Button
                    size="sm"
                    variant={completedIds.has(activeLesson.id) ? "default" : "outline"}
                    onClick={() => toggleComplete(activeLesson.id)}
                    className={completedIds.has(activeLesson.id) ? "gradient-primary text-primary-foreground" : ""}
                  >
                    {completedIds.has(activeLesson.id) ? (
                      <><CheckCircle2 className="h-4 w-4 mr-1" /> Completed</>
                    ) : (
                      <><Circle className="h-4 w-4 mr-1" /> Mark complete</>
                    )}
                  </Button>
                </div>

                {activeLesson.video_url && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                    {getVideoEmbedUrl(activeLesson.video_url)?.includes("youtube.com/embed") ? (
                      <iframe
                        src={getVideoEmbedUrl(activeLesson.video_url)!}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <a href={activeLesson.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                          <Play className="h-8 w-8" /> Watch video
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {activeLesson.content && (
                  <div className="prose prose-invert max-w-none">
                    {activeLesson.content.startsWith("<") ? (
                      <RichTextDisplay content={activeLesson.content} />
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-wrap">{activeLesson.content}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
