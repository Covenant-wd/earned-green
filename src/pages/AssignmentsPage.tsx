import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageContainer, PageHeader, EmptyState } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDayTime } from "@/lib/format";

export default function AssignmentsPage() {
  const { user, timezone } = useAuth();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["assignments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [assignments, submissions] = await Promise.all([
        supabase
          .from("assignments")
          .select("*, course:courses(title)")
          .eq("is_published", true)
          .order("due_at", { nullsFirst: false }),
        supabase.from("assignment_submissions").select("*").eq("user_id", user!.id),
      ]);
      return { assignments: assignments.data ?? [], submissions: submissions.data ?? [] };
    },
  });

  const submit = async (assignmentId: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("assignment_submissions").insert({
      assignment_id: assignmentId,
      user_id: user.id,
      content: content || null,
      file_url: fileUrl || null,
      status: "submitted",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submission sent");
    setOpenId(null);
    setContent("");
    setFileUrl("");
    qc.invalidateQueries({ queryKey: ["assignments"] });
  };

  return (
    <PageContainer>
      <PageHeader title="Assignments" description="Submit your work and track instructor feedback." />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading assignments…</p>
      ) : data?.assignments.length ? (
        <div className="space-y-3">
          {data.assignments.map((a) => {
            const sub = data.submissions.find((s) => s.assignment_id === a.id);
            return (
              <div key={a.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base">{a.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {(a.course as { title?: string } | null)?.title} ·{" "}
                      {a.due_at ? `Due ${formatDayTime(a.due_at, timezone)}` : "No due date"} · {a.max_score} pts
                    </p>
                  </div>
                  {sub ? (
                    <Badge variant={sub.status === "graded" ? "default" : "secondary"} className="capitalize">
                      {sub.status === "graded" ? `Graded · ${sub.score ?? 0}/${a.max_score}` : sub.status}
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                      {openId === a.id ? "Cancel" : "Submit work"}
                    </Button>
                  )}
                </div>

                {a.instructions && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.instructions}</p>
                )}

                {sub?.feedback && (
                  <div className="mt-3 rounded-xl bg-secondary p-3 text-sm">
                    <p className="font-medium">Instructor feedback</p>
                    <p className="mt-1 text-muted-foreground">{sub.feedback}</p>
                  </div>
                )}

                {openId === a.id && !sub && (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="Write your answer or paste your code"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={5}
                    />
                    <Input
                      placeholder="Link to your work (optional)"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                    />
                    <Button onClick={() => submit(a.id)} disabled={saving || (!content && !fileUrl)}>
                      {saving ? "Submitting…" : "Send submission"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No assignments yet" description="Your instructor has not published any coursework." />
      )}
    </PageContainer>
  );
}
