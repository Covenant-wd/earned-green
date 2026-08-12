import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "sonner";

export default function AdminGuidesPage() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "Tips", thumbnail_url: "", is_published: false });

  const load = async () => {
    const { data } = await supabase.from("guides").select("*").order("created_at", { ascending: false });
    setGuides(data || []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "", category: "Tips", thumbnail_url: "", is_published: false });
    setDialogOpen(true);
  };

  const openEdit = (g: any) => {
    setEditing(g);
    setForm({ title: g.title, content: g.content || "", category: g.category || "Tips", thumbnail_url: g.thumbnail_url || "", is_published: g.is_published });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    if (editing) {
      const { error } = await supabase.from("guides").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Guide updated");
    } else {
      const { error } = await supabase.from("guides").insert({ ...form, created_by: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Guide created");
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("guides").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Guide deleted");
    load();
  };

  const togglePublish = async (g: any) => {
    await supabase.from("guides").update({ is_published: !g.is_published }).eq("id", g.id);
    load();
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Manage Guides</h1>
          <Button className="gradient-primary text-primary-foreground" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Create Guide
          </Button>
        </div>

        <div className="space-y-3">
          {guides.map((guide) => (
            <div key={guide.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold">{guide.title}</h3>
                  <Badge variant={guide.is_published ? "default" : "secondary"} className="text-xs">
                    {guide.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{guide.category}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => togglePublish(guide)}>
                  {guide.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => openEdit(guide)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(guide.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {guides.length === 0 && <p className="text-muted-foreground text-center py-8">No guides yet.</p>}
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Guide" : "Create Guide"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-background" /></div>
            <div><Label>Content</Label><RichTextEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-background" /></div>
              <div><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="bg-background" placeholder="https://..." /></div>
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
