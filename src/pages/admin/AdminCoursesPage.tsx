import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, BookOpen, Eye, EyeOff, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", description: "", thumbnail_url: "", category: "TikTok", difficulty: "Beginner", is_published: false
  });

  const load = async () => {
    const { data } = await supabase.from("courses").select("*, lessons(id)").order("sort_order");
    setCourses(data || []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", thumbnail_url: "", category: "TikTok", difficulty: "Beginner", is_published: false });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      title: c.title, description: c.description || "", thumbnail_url: c.thumbnail_url || "",
      category: c.category || "TikTok", difficulty: c.difficulty || "Beginner", is_published: c.is_published
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    if (editing) {
      const { error } = await supabase.from("courses").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Course updated");
    } else {
      const { error } = await supabase.from("courses").insert({ ...form, created_by: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Course created");
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Course deleted");
    load();
  };

  const togglePublish = async (c: any) => {
    await supabase.from("courses").update({ is_published: !c.is_published }).eq("id", c.id);
    load();
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Manage Courses</h1>
          <Button className="gradient-primary text-primary-foreground" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Create Course
          </Button>
        </div>

        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold">{course.title}</h3>
                  <Badge variant={course.is_published ? "default" : "secondary"} className="text-xs">
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{course.difficulty}</Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{course.description}</p>
                <span className="text-xs text-muted-foreground">{course.lessons?.length || 0} lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/courses/${course.id}/lessons`)}>
                  <BookOpen className="h-3 w-3 mr-1" /> Lessons
                </Button>
                <Button variant="outline" size="icon" onClick={() => togglePublish(course)}>
                  {course.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => openEdit(course)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(course.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p className="text-muted-foreground text-center py-8">No courses yet. Create your first course!</p>}
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Course" : "Create Course"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" /></div>
            <div><Label>Description</Label><RichTextEditor content={form.description} onChange={(html) => setForm({ ...form, description: html })} /></div>
            <div><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="bg-secondary border-border" placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border" /></div>
              <div><Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>Publish immediately</Label>
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
