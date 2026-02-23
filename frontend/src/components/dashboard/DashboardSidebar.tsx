import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  Bell,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  UserPlus,
  Paintbrush,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Heart } from "lucide-react";

const adminNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/dashboard/students", icon: GraduationCap },
  { title: "Volunteers", url: "/dashboard/volunteers", icon: Users },
  { title: "Sessions", url: "/dashboard/sessions", icon: Calendar },
  { title: "Attendance", url: "/dashboard/attendance", icon: ClipboardCheck },
  { title: "Applications", url: "/dashboard/applications", icon: UserPlus },

  { title: "Notices", url: "/dashboard/notices", icon: Bell },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
];

const volunteerNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Sessions", url: "/dashboard/my-sessions", icon: Calendar },
  { title: "Notices", url: "/dashboard/notices", icon: Bell },
];

export function DashboardSidebar() {
  const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { isAdmin, user, role, volunteerStatus } = useAuth();
  const collapsed = state === "collapsed" && !isMobile;

  const getNavItems = () => {
    // Show admin nav for admin/super_admin roles
    if (isAdmin) return adminNavItems;

    // Show volunteer nav for volunteer role
    if (role === "volunteer") {
      // PROBATION CHECK: If pending, show limited items
      if (volunteerStatus === "pending") {
        return volunteerNavItems.filter(item => ["Dashboard", "Notices"].includes(item.title));
      }
      return volunteerNavItems;
    }

    // Fallback: show at least Dashboard while role is loading
    return [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }];
  };

  const navItems = getNavItems();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (collapsed) {
      e.preventDefault();
      toggleSidebar();
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={cn("p-4 overflow-hidden", collapsed && "px-1")}>
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-white dark:bg-transparent">
            <img
              src="/logo.png"
              alt="UMEED Logo"
              className="w-full h-full object-cover"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in pl-1">
              <span className="font-display text-lg font-semibold text-sidebar-foreground">
                UMEED
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">
              {!collapsed && "Settings"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Site Customization">
                    <NavLink
                      to="/dashboard/customize"
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Paintbrush className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>Site Customization</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Settings">
                    <NavLink
                      to="/dashboard/settings"
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Settings className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>Settings</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

    </Sidebar>
  );
}
