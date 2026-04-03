import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, BarChart3, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, { total: number; completed: number }>>({});

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*, lessons(*)")
        .eq("is_published", true)
        .order("sort_order");
      setCourses(coursesData || []);

      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed, lessons!inner(course_id)")
        .eq("user_id", user.id)
        .eq("completed", true);

      const prog: Record<string, { total: number; completed: number }> = {};
      (coursesData || []).forEach((c: any) => {
        const total = c.lessons?.length || 0;
        const completed = (progressData || []).filter(
          (p: any) => p.lessons?.course_id === c.id
        ).length;
        prog[c.id] = { total, completed };
      });
      setProgress(prog);
    };

    load();
  }, [user]);

  const difficultyColor = (d: string) => {
    if (d === "Beginner") return "bg-success/10 text-success";
    if (d === "Intermediate") return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Learn TikTok</h1>
          <p className="text-muted-foreground text-sm mt-1">Master content creation with step-by-step courses</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No courses available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const p = progress[course.id] || { total: 0, completed: 0 };
            const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-hover cursor-pointer overflow-hidden"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {course.thumbnail_url && (
                  <div className="aspect-video bg-secondary overflow-hidden">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-semibold text-lg">{course.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {course.category && <Badge variant="secondary" className="text-xs">{course.category}</Badge>}
                    {course.difficulty && <Badge className={`text-xs ${difficultyColor(course.difficulty)}`}>{course.difficulty}</Badge>}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {course.lessons?.length || 0} lessons
                    </span>
                  </div>
                  {p.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{p.completed}/{p.total} completed</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-primary text-sm mt-3 font-medium">
                    {pct > 0 ? "Continue" : "Start"} course <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
