import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, MessageSquare, MonitorPlay, Video } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const features = [
  {
    icon: Video,
    title: "Live classes, not recordings",
    body: "Scheduled sessions with a real instructor, in your own timezone.",
  },
  {
    icon: MonitorPlay,
    title: "Code along on screen",
    body: "Screen sharing and a shared whiteboard keep every step visible.",
  },
  {
    icon: MessageSquare,
    title: "Ask while it matters",
    body: "In-class chat and graded assignments so nothing stays unclear.",
  },
  {
    icon: CalendarClock,
    title: "Catch up any time",
    body: "Recordings, resources and lesson notes stay with your enrollment.",
  },
];

export default function HomePage() {
  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title, subtitle, level, duration_weeks")
        .eq("is_published", true)
        .order("sort_order")
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Live learning platform</p>
          <h1 className="mt-3 text-4xl leading-[1.05] md:text-6xl">
            Learn to build for the web, live with an instructor.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            EntreVault runs small, scheduled classes that teach practical technology skills —
            starting with HTML and CSS. Attend live, ask questions, submit work, get feedback.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/register">
                Start learning <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/courses">Browse courses</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 md:grid-cols-2 md:px-8 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="surface p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-base">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Curriculum</p>
            <h2 className="mt-2 text-2xl md:text-3xl">Courses open for enrollment</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/courses">See all</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(courses ?? []).map((course) => (
            <Link key={course.id} to={`/courses/${course.slug}`} className="surface-hover block p-5">
              <Badge variant="secondary" className="capitalize">
                {course.level}
              </Badge>
              <h3 className="mt-3 text-lg">{course.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>
              {course.duration_weeks && (
                <p className="mt-3 text-xs text-muted-foreground">{course.duration_weeks} weeks</p>
              )}
            </Link>
          ))}
          {courses?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              New courses are being scheduled. Create an account to be notified first.
            </p>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
