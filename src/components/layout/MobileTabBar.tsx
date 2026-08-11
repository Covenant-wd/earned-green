import { LayoutDashboard, ListChecks, Wallet, Bell, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const location = useLocation();
  const { isAdmin, profile } = useAuth();
  const isApproved = isAdmin || profile?.registration_status === "active";

  const items = [
    { title: "Home", url: "/dashboard", icon: LayoutDashboard },
    ...(isApproved ? [{ title: "Tasks", url: "/tasks", icon: ListChecks }] : []),
    { title: "Wallet", url: "/wallet", icon: Wallet },
    { title: "Alerts", url: "/notifications", icon: Bell },
    { title: "Profile", url: "/profile", icon: UserCircle },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl safe-bottom md:hidden">
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = location.pathname === item.url;
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
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-accent"
                  )}
                >
                  <item.icon className="h-[1.1rem] w-[1.1rem]" />
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
