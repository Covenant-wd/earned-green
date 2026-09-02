import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, EmptyState } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney, formatDate, intervalSuffix } from "@/lib/format";

export default function BillingPage() {
  const { user, timezone } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["billing", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [enrollments, subscriptions, payments] = await Promise.all([
        supabase
          .from("enrollments")
          .select("*, course:courses(title)")
          .eq("user_id", user!.id)
          .order("enrolled_at", { ascending: false }),
        supabase
          .from("subscriptions")
          .select("*, course:courses(title), plan:payment_plans(name, price, currency, billing_interval)")
          .eq("user_id", user!.id),
        supabase
          .from("payments")
          .select("*, course:courses(title)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);
      return {
        enrollments: enrollments.data ?? [],
        subscriptions: subscriptions.data ?? [],
        payments: payments.data ?? [],
      };
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Billing" description="Your enrollments, subscriptions and payment history." />

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <section className="space-y-3">
        <h2 className="text-lg">Enrollments</h2>
        {data?.enrollments.length ? (
          data.enrollments.map((e) => (
            <div key={e.id} className="surface flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{(e.course as { title?: string } | null)?.title}</p>
                <p className="text-xs text-muted-foreground">
                  Enrolled {formatDate(e.enrolled_at, timezone)}
                  {e.access_expires_at ? ` · access until ${formatDate(e.access_expires_at, timezone)}` : ""}
                </p>
              </div>
              <Badge variant={e.status === "active" ? "default" : "secondary"} className="capitalize">
                {e.status}
              </Badge>
            </div>
          ))
        ) : (
          <EmptyState title="No enrollments yet" description="Pick a course from the catalogue to get started." />
        )}
      </section>

      {data?.subscriptions.length ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg">Subscriptions</h2>
          {data.subscriptions.map((s) => {
            const plan = s.plan as { name?: string; price?: number; currency?: string; billing_interval?: string } | null;
            return (
              <div key={s.id} className="surface flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {(s.course as { title?: string } | null)?.title} — {plan?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Renews {formatDate(s.current_period_end, timezone)}
                  </p>
                </div>
                <span className="text-sm">
                  {plan?.price != null && formatMoney(plan.price, plan.currency)}
                  {plan?.billing_interval && intervalSuffix(plan.billing_interval)}
                </span>
              </div>
            );
          })}
        </section>
      ) : null}

      <section className="mt-8 space-y-3">
        <h2 className="text-lg">Payment history</h2>
        {data?.payments.length ? (
          data.payments.map((p) => (
            <div key={p.id} className="surface flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{(p.course as { title?: string } | null)?.title ?? "Payment"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(p.paid_at ?? p.created_at, timezone)} · {p.provider}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{formatMoney(p.amount, p.currency)}</p>
                <Badge variant="secondary" className="capitalize">{p.status}</Badge>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        )}
      </section>
    </PageContainer>
  );
}
