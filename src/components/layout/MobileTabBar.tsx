import { LayoutDashboard, BookOpen, CalendarClock, Bell, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Learn", url: "/learn", icon: BookOpen },
  { title: "Classes", url: "/schedule", icon: CalendarClock },
  { title: "Alerts", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

export function MobileTabBar() {
  const location = useLocation();
  const unread = useUnreadNotifications();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur safe-bottom md:hidden">
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.url);
          const showBadge = item.url === "/notifications" && unread > 0;
          return (
            <li key={item.url} className="flex-1">
              <Link
                to={item.url}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative flex h-6 w-10 items-center justify-center">
                  <item.icon className="h-[1.15rem] w-[1.15rem]" />
                  {showBadge && (
                    <span className="absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                      {unread > 99 ? "99+" : unread}
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
