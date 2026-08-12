import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RichTextDisplay } from "@/components/RichTextEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GuidesPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("guides")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setGuides(data || []));
  }, []);

  const filtered = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      (g.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Tips & Guides</h1>
          <p className="text-muted-foreground text-sm mt-1">TikTok content creation tips from the community</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No guides available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((guide) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-hover cursor-pointer overflow-hidden"
              onClick={() => setSelectedGuide(guide)}
            >
              {guide.thumbnail_url && (
                <div className="aspect-video bg-secondary overflow-hidden">
                  <img src={guide.thumbnail_url} alt={guide.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-display font-semibold mb-2">{guide.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  {guide.category && <Badge variant="secondary" className="text-xs">{guide.category}</Badge>}
                  <span className="text-xs text-muted-foreground">{new Date(guide.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {guide.content?.replace(/<[^>]+>/g, "").slice(0, 120)}...
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedGuide} onOpenChange={() => setSelectedGuide(null)}>
        <DialogContent className="glass-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{selectedGuide?.title}</DialogTitle>
            <div className="flex gap-2 mt-1">
              {selectedGuide?.category && <Badge variant="secondary" className="text-xs">{selectedGuide.category}</Badge>}
            </div>
          </DialogHeader>
          <div className="prose prose-invert max-w-none mt-4">
            {selectedGuide?.content?.startsWith("<") ? (
              <RichTextDisplay content={selectedGuide.content} />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">{selectedGuide?.content}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
