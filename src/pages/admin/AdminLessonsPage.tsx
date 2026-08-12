import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "sonner";

export default function AdminLessonsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", content: "", video_url: "", sort_order: 0, duration_minutes: "", is_published: true
  });

  const load = async () => {
    if (!courseId) return;
    const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).single();
    setCourse(c);
    const { data: l } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order");
    setLessons(l || []);
  };

  useEffect(() => { load(); }, [courseId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", video_url: "", sort_order: lessons.length, duration_minutes: "", is_published: true });
    setDialogOpen(true);
  };

  const openEdit = (l: any) => {
    setEditing(l);
    setForm({
      title: l.title, content: l.content || "", video_url: l.video_url || "",
      sort_order: l.sort_order, duration_minutes: l.duration_minutes?.toString() || "", is_published: l.is_published
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    const payload = {
      title: form.title, content: form.content, video_url: form.video_url,
      sort_order: form.sort_order,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      is_published: form.is_published,
      course_id: courseId!
    };

    if (editing) {
      const { error } = await supabase.from("lessons").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Lesson updated");
    } else {
      const { error } = await supabase.from("lessons").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Lesson created");
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lesson deleted");
    load();
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/courses")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to courses
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Lessons — {course?.title}</h1>
            <p className="text-sm text-muted-foreground">{lessons.length} lessons</p>
          </div>
          <Button className="gradient-primary text-primary-foreground" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add Lesson
          </Button>
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, i) => (
            <div key={lesson.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{i + 1}.</span>
                  <h3 className="font-display font-semibold">{lesson.title}</h3>
                  <Badge variant={lesson.is_published ? "default" : "secondary"} className="text-xs">
                    {lesson.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                  {lesson.video_url && <span>📹 Has video</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => openEdit(lesson)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(lesson.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {lessons.length === 0 && <p className="text-muted-foreground text-center py-8">No lessons yet. Add your first lesson!</p>}
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Lesson" : "Add Lesson"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-background" /></div>
            <div><Label>Content</Label><RichTextEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} /></div>
            <div><Label>Video URL (YouTube, TikTok, etc.)</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="bg-background" placeholder="https://youtube.com/watch?v=..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (minutes)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="bg-background" /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="bg-background" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
