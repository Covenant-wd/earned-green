import {
  LayoutDashboard,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Bell,
  UserCircle,
  CreditCard,
  Shield,
  Users,
  Video,
  GraduationCap,
  LogOut,
  Library,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const studentItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Learning", url: "/learn", icon: BookOpen },
  { title: "Catalogue", url: "/courses", icon: Library },
  { title: "Schedule", url: "/schedule", icon: CalendarClock },
  { title: "Assignments", url: "/assignments", icon: ClipboardList },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

const teacherItems = [{ title: "Teaching", url: "/teach", icon: GraduationCap }];

const adminItems = [
  { title: "Overview", url: "/admin", icon: Shield },
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Live Classes", url: "/admin/sessions", icon: Video },
  { title: "People", url: "/admin/users", icon: Users },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin, isTeacher, logout, user } = useAuth();
  const unread = useUnreadNotifications();

  const isActive = (path: string) => location.pathname === path;
  const handleNavClick = () => {
    if (isMobile) setTimeout(() => setOpenMobile(false), 0);
  };

  const renderItems = (items: typeof studentItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url} onClick={handleNavClick}>
          <SidebarMenuButton asChild isActive={isActive(item.url)}>
            <NavLink
              to={item.url}
              end
              className={cn("flex items-center gap-2")}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span className="flex-1">{item.title}</span>}
              {!collapsed && item.url === "/notifications" && unread > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-display text-lg font-bold">EntreVault</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learn</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(studentItems)}</SidebarGroupContent>
        </SidebarGroup>

        {(isTeacher || isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>Teach</SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(teacherItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(adminItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user && (
          <div className="mb-2 truncate text-xs text-muted-foreground">{user.email}</div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
