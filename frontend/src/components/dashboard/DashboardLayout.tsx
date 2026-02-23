import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { Bell, LogOut, Settings, User, Check } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRef, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useStats";
import { format } from "date-fns";

function DashboardLayoutContent() {
  const { user, role, signOut } = useAuth();
  const { setOpenMobile } = useSidebar();
  const { toast } = useToast();
  const touchStartRef = useRef<number | null>(null);
  const [volunteerName, setVolunteerName] = useState<string | null>(null);
  const [volunteerAvatar, setVolunteerAvatar] = useState<string | null>(null);

  // Notification Logic
  const { data: notifications } = useNotifications(10, role === "admin" ? undefined : "internal");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.length);
    }
  }, [notifications]);

  // Auto-link Volunteer Profile to User Account
  useEffect(() => {
    const linkVolunteerProfile = async () => {
      if (!user?.email || !user.id || role !== "volunteer") return;

      const { data: existingVolunteer } = await api
        .from("volunteers")
        .select("id, user_id")
        .eq("email", user.email)
        .filter("user_id", "is", null)
        .single();

      if (existingVolunteer) {
        const { error } = await api
          .from("volunteers")
          .update({ user_id: user.id })
          .eq("id", existingVolunteer.id);

        if (!error) {
          toast({
            title: "Profile Linked",
            description: "Your volunteer profile has been connected to your account.",
            className: "bg-green-50 border-green-200",
          });
        }
      }
    };

    linkVolunteerProfile();
  }, [user, role, toast]);

  // Fetch volunteer name and avatar
  useEffect(() => {
    const fetchVolunteerData = async () => {
      if (!user?.email) return;

      const { data } = await api
        .from("volunteers")
        .select("name, profile_picture")
        .eq("email", user.email)
        .maybeSingle();

      if (data) {
        if (data.name) setVolunteerName(data.name);
        if (data.profile_picture) setVolunteerAvatar(data.profile_picture);
      }
    };

    fetchVolunteerData();
  }, [user]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchEnd - touchStartRef.current;

    // Swipe right to open (must start from left edge area)
    if (diff > 50 && touchStartRef.current < 50) {
      setOpenMobile(true);
    }

    touchStartRef.current = null;
  };

  const markAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <div
      className="min-h-screen flex w-full bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <DashboardSidebar />
      <SidebarInset className="flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <div className="min-w-0 hidden md:block">
                <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
                  Welcome, {volunteerName?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || user?.email?.split("@")[0] || "User"}
                </h1>

              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse ring-2 ring-background" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-auto px-2 text-xs" onClick={markAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="grid gap-1 p-1">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`flex flex-col gap-1 p-3 rounded-md transition-colors hover:bg-muted/50 ${unreadCount > 0 ? "bg-primary/5" : ""
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium line-clamp-1">{notification.title}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {format(new Date(notification.date), "MMM dd")}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No new notifications
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                      <Link to="/dashboard/activities">View all activities</Link>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <ModeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage
                        src={volunteerAvatar || user?.user_metadata?.avatar_url || "/placeholder-avatar.jpg"}
                        alt={user?.email || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {volunteerName ? volunteerName[0].toUpperCase() : (user?.email?.[0].toUpperCase() || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {role?.replace("_", " ")}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  );
}
