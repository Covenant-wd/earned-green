import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Megaphone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { broadcastNotification } from "@/lib/notifications";
import { toast } from "sonner";

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("registration_status", "active")
      .then(({ count }) => setActiveCount(count || 0));

    loadRecent();
  }, []);

  const loadRecent = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("title, message, created_at")
      .eq("type", "broadcast")
      .order("created_at", { ascending: false })
      .limit(20);
    // Deduplicate by title+created_at minute (since broadcast inserts one row per user)
    const seen = new Set<string>();
    const unique = (data || []).filter((n) => {
      const key = `${n.title}-${new Date(n.created_at).toISOString().slice(0, 16)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setRecentBroadcasts(unique.slice(0, 5));
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!confirm(`Send this broadcast to all ${activeCount} active users?`)) return;
    setSending(true);
    const result = await broadcastNotification({
      title: title.trim(),
      message: message.trim(),
      link: link.trim() || undefined,
    });
    if (result.success) {
      toast.success(`Broadcast sent to ${activeCount} users`);
      setTitle("");
      setMessage("");
      setLink("");
      loadRecent();
    } else {
      toast.error("Failed to send broadcast");
    }
    setSending(false);
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title mb-2 flex items-center gap-2">
          <Megaphone className="h-6 w-6" /> Broadcast Message
        </h1>
        <p className="text-muted-foreground mb-6">
          Send an announcement to all <span className="font-semibold text-foreground">{activeCount}</span> active users (in-app + email).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New course launched!"
                className="bg-secondary border-border"
                maxLength={120}
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement..."
                className="bg-secondary border-border"
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">{message.length}/1000</p>
            </div>
            <div>
              <Label>Link (optional)</Label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/courses or https://..."
                className="bg-secondary border-border"
              />
            </div>
            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={handleSend}
              disabled={sending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : `Send to ${activeCount} users`}
            </Button>
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Mail className="h-3 w-3 mt-0.5 shrink-0" />
              Emails will start delivering automatically once a sender domain is connected. In-app notifications work immediately.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Recent broadcasts</h3>
            {recentBroadcasts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No broadcasts yet</p>
            ) : (
              <div className="space-y-3">
                {recentBroadcasts.map((b, i) => (
                  <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(b.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
