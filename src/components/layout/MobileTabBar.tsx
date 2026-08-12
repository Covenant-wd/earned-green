import { useEffect, useState } from "react";
import { LayoutDashboard, ListChecks, Wallet, Bell, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const location = useLocation();
  const { isAdmin, profile, user } = useAuth();
  const isApproved = isAdmin || profile?.registration_status === "active";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const channel = supabase
      .channel("notifications-tabbar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        fetchUnread
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, location.pathname]);

  const items = [
    { title: "Home", url: "/dashboard", icon: LayoutDashboard },
    ...(isApproved ? [{ title: "Tasks", url: "/tasks", icon: ListChecks }] : []),
    { title: "Wallet", url: "/wallet", icon: Wallet },
    { title: "Alerts", url: "/notifications", icon: Bell },
    { title: "Profile", url: "/profile", icon: UserCircle },
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[var(--radius)] border-0 bg-background neu-raised safe-bottom md:hidden">
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = location.pathname === item.url;
          const showBadge = item.url === "/notifications" && unreadCount > 0;
          return (
            <li key={item.url} className="flex-1">
              <Link
                to={item.url}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active ? "neu-inset text-primary" : "neu-flat"
                  )}
                >
                  <item.icon className="h-[1.1rem] w-[1.1rem]" />
                  {showBadge && (
                    <span className="absolute -top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
