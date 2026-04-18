import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All marked as read");
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="page-title flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary">{unreadCount} new</Badge>
            )}
          </h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check className="h-4 w-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div
                key={n.id}
                className={`glass-card p-4 ${!n.read ? "border-l-4 border-l-primary" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{n.title}</h3>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {n.type.replace(/_/g, " ")}
                      </Badge>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{n.message}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {n.link && (
                        <Link
                          to={n.link}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
