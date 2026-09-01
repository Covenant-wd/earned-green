import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, EmptyState } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, intervalSuffix } from "@/lib/format";

export default function CoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["catalogue"],
    queryFn: async () => {
      const [{ data: courses, error }, { data: plans }] = await Promise.all([
        supabase
          .from("courses")
          .select("id, slug, title, subtitle, level, category, duration_weeks")
          .eq("is_published", true)
          .order("sort_order"),
        supabase
          .from("payment_plans")
          .select("course_id, price, currency, billing_interval")
          .eq("is_active", true)
          .eq("is_archived", false),
      ]);
      if (error) throw error;
      return { courses: courses ?? [], plans: plans ?? [] };
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Course catalogue" description="Live, instructor-led technology courses." />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : data?.courses.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.courses.map((course) => {
            const coursePlans = data.plans.filter((p) => p.course_id === course.id);
            const cheapest = coursePlans.sort((a, b) => Number(a.price) - Number(b.price))[0];
            return (
              <Link key={course.id} to={`/courses/${course.slug}`} className="surface-hover block p-5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{course.level}</Badge>
                  {course.category && <span className="text-xs text-muted-foreground">{course.category}</span>}
                </div>
                <h2 className="mt-3 text-lg">{course.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {course.duration_weeks ? `${course.duration_weeks} weeks` : "Self-paced cohort"}
                  </span>
                  {cheapest && (
                    <span className="font-medium">
                      {formatMoney(cheapest.price, cheapest.currency)}
                      {intervalSuffix(cheapest.billing_interval)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No published courses yet" description="Check back soon — new cohorts are being prepared." />
      )}
    </PageContainer>
  );
}
