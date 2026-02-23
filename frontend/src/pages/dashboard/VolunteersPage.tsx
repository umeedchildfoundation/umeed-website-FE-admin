import { sendApprovalEmail } from "@/services/emailService";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, authService } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VolunteerProfileSheet } from "@/components/volunteers/VolunteerProfileSheet";
import { VolunteerForm, VolunteerFormData } from "@/components/volunteers/VolunteerForm";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { generateVolunteerId, getVolunteerSequentialNumber } from "@/lib/volunteerConfig";

type Volunteer = {
  id: string;
  volunteer_id?: string | null;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  occupation: string | null;
  skills: string[] | null;
  preferred_languages: string[] | null;
  availability: string | null;
  status: "pending" | "approved" | "rejected" | "inactive";
  joined_at: string | null;
  attendance_count?: number;
  profile_picture?: string | null;
};

const emptyVolunteer: Partial<Volunteer> = {
  name: "",
  email: "",
  phone: "",
  age: undefined,
  gender: "",
  address: "",
  occupation: "",
  skills: [],
  preferred_languages: [],
  availability: "",
  status: "approved",
};

export default function VolunteersPage() {
  const { toast } = useToast();
  const { isSuperAdmin, isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  // --- QUERIES ---
  const { data: volunteers, isLoading, isError, error } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      // 1. Fetch Volunteers
      const { data: volunteersData, error: volunteersError } = await api
        .from("volunteers")
        .select("*")
        .order("created_at", { ascending: false });

      if (volunteersError) {
        console.error("DEBUG: Error fetching volunteers:", volunteersError);
        throw volunteersError;
      }

      // 2. Fetch Attendance
      const { data: attendanceData, error: attendanceError } = await api
        .from("volunteer_attendance")
        .select("volunteer_id")
        .eq("status", "present");

      if (attendanceError) {
        console.error("DEBUG: Error fetching attendance:", attendanceError);
        // Continue without counts
        return volunteersData.map((v: any) => ({
          ...v,
          name: v.name || v.full_name || "Unknown Volunteer",
          attendance_count: 0
        })) as Volunteer[];
      }

      // 3. Aggregate Counts
      const attendanceCounts: Record<string, number> = {};
      attendanceData.forEach(item => {
        attendanceCounts[item.volunteer_id] = (attendanceCounts[item.volunteer_id] || 0) + 1;
      });

      // 4. Merge
      return volunteersData.map((v: any) => ({
        ...v,
        name: v.name || v.full_name || "Unknown Volunteer",
        profile_picture: v.profile_picture,
        attendance_count: attendanceCounts[v.id] || 0
      })) as Volunteer[];
    },
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (volunteer: Partial<Volunteer>) => {
      if (!volunteer.name || !volunteer.email) throw new Error("Name and email are required");
      const { error } = await api.from("volunteers").insert([{
        ...volunteer,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status || 'pending',
        joining_date: new Date().toISOString()
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Volunteer added successfully" });
      setIsModalOpen(false);
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (volunteer: Partial<Volunteer> & { id: string }) => {
      const { id, ...data } = volunteer;
      const { error } = await api.from("volunteers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Volunteer updated" });
      setIsModalOpen(false);
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("volunteers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Volunteer deleted" });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const skipProbationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("volunteers").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Probation skipped. Volunteer approved." });
    },
  });

  const promoteToAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await api.from("user_roles").upsert({ user_id: userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Promoted to Admin" }),
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  // --- HELPERS ---
  const filteredVolunteers = volunteers?.filter((v) => {
    const name = v.name || "";
    const email = v.email || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (activeTab === "probation") matchesStatus = v.status === "pending";
    if (activeTab === "active") matchesStatus = v.status === "approved";
    if (activeTab === "inactive") matchesStatus = v.status === "inactive" || v.status === "rejected";

    return matchesSearch && matchesStatus;
  });

  // Stats for the top cards
  const stats = {
    total: volunteers?.length || 0,
    active: volunteers?.filter(v => v.status === 'approved').length || 0,
    pending: volunteers?.filter(v => v.status === 'pending').length || 0,
    inactive: volunteers?.filter(v => v.status === 'inactive' || v.status === 'rejected').length || 0,
  };

  const statusConfig = {
    approved: { label: "Active", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
    pending: { label: "Probation", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
    inactive: { label: "Inactive", className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleEdit = (v: Volunteer) => { setSelectedVolunteer(v); setIsModalOpen(true); };
  const handleView = (v: Volunteer) => { setSelectedVolunteer(v); setIsDrawerOpen(true); };

  const handleFormSubmit = async (data: VolunteerFormData) => {
    const { id, ...rest } = data;
    const payload: any = { ...rest };
    if (payload.email) payload.email = payload.email.trim().toLowerCase();
    if (payload.name) payload.name = payload.name.trim();

    delete payload.attendance_count;

    // Ensure numeric fields
    if (typeof payload.age === 'string' && payload.age.trim() === '') payload.age = null;
    else if (payload.age) payload.age = Number(payload.age);

    if (id) {
      await updateMutation.mutateAsync({ ...payload, id });
    } else {
      // 1. Create local auth user
      let createdUserId = null;
      try {
        const { data: authData, error: authError } = await authService.signUp({
          email: payload.email,
          password: "umeed@123",
          options: {
            data: { full_name: payload.name },
            autoLogin: false
          }
        });

        if (authError) {
          throw authError;
        }

        console.log("Auth User Created Successfully:", authData?.user?.id);
        createdUserId = authData?.user?.id;

      } catch (err: any) {
        console.error("Failed to create auth user:", err);
        toast({
          title: "Authentication Account Failed",
          description: "Could not create login account: " + (err.message || "Unknown error"),
          variant: "destructive"
        });
        // CRITICAL: Stop execution. Do not create profile if auth fails.
        return;
      }

      // 2. Generate Volunteer ID
      let maxSeq = 0;
      if (volunteers) {
        volunteers.forEach(v => {
          const seq = getVolunteerSequentialNumber(v.volunteer_id);
          if (seq > maxSeq) maxSeq = seq;
        });
      }
      const newVolunteerId = generateVolunteerId(maxSeq);

      // 3. Create Volunteer Record with user_id and volunteer_id
      const finalPayload = { ...payload, user_id: createdUserId, volunteer_id: newVolunteerId };
      await createMutation.mutateAsync(finalPayload);

      // 3. Send welcome email
      try {
        const loginLink = "http://172.20.10.3:8080/login";
        await sendApprovalEmail(payload.email, payload.name, loginLink);
        toast({ title: "Volunteer account created & email sent" });
      } catch (emailError) {
        console.error("Failed to send email", emailError);
        toast({ title: "Volunteer added, but email failed", variant: "destructive" });
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {isError && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20 flex items-center gap-2">
          <span className="font-bold">Error loading volunteers:</span>
          {error?.message || "Unknown error occurred"}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Volunteers</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and track their progress.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setSelectedVolunteer(null); setIsModalOpen(true); }} className="shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-4 h-4 mr-2" /> Add Volunteer
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Volunteers", value: stats.total, icon: UserCheck, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20" },
          { label: "Active Members", value: stats.active, icon: Shield, color: "text-green-600 bg-green-100 dark:bg-green-900/20" },
          { label: "In Probation", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20" },
          { label: "Inactive", value: stats.inactive, icon: Trash2, color: "text-slate-500 bg-slate-100 dark:bg-slate-800/50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-card">
        <div className="p-4 border-b space-y-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all" className="rounded-md">All Team</TabsTrigger>
                <TabsTrigger value="active" className="rounded-md">Active</TabsTrigger>
                <TabsTrigger value="probation" className="rounded-md">Probation</TabsTrigger>
                <TabsTrigger value="inactive" className="rounded-md">Inactive</TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search volunteers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[300px]">Volunteer</TableHead>
                  <TableHead>Role & Status</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">Loading team...</TableCell>
                    </TableRow>
                  ) : filteredVolunteers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Search className="w-10 h-10 mb-2 opacity-20" />
                          <p>No volunteers found matching your criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVolunteers?.map((volunteer) => (
                      <motion.tr
                        key={volunteer.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group transition-colors hover:bg-muted/30 border-b border-border/50 last:border-0"
                      >
                        <TableCell className={`py-3 ${user?.preferences?.tableDensity === 'compact' ? 'py-1' : 'py-3'}`}>
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium font-mono border border-primary/20 shadow-sm">
                            {volunteer.volunteer_id || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={`${user?.preferences?.tableDensity === 'compact' ? 'h-8 w-8' : 'h-10 w-10'} border-2 border-background shadow-sm`}>
                              <AvatarImage src={volunteer.profile_picture || undefined} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {getInitials(volunteer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className="flex flex-col cursor-pointer"
                              onClick={() => handleView(volunteer)}
                            >
                              <span className="font-medium text-foreground hover:text-primary hover:underline transition-colors">
                                {volunteer.name}
                              </span>
                              <span className="text-xs text-muted-foreground line-clamp-1">{volunteer.email}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col items-start gap-1.5">
                            <Badge variant="outline" className={`font-medium ${statusConfig[volunteer.status].className}`}>
                              {statusConfig[volunteer.status].label}
                            </Badge>

                            {volunteer.status === 'pending' && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                <span>{volunteer.attendance_count || 0}/12 Sessions</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col text-sm text-foreground/80">
                            {volunteer.phone ? (
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground mr-1" />{volunteer.phone}</span>
                            ) : <span className="text-muted-foreground italic text-xs">No phone</span>}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(volunteer)} className="h-8 w-8 text-muted-foreground hover:text-primary" title="View Profile">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* --- MODALS --- */}

      {/* Create/Edit Volunteer Modal */}
      <VolunteerForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedVolunteer}
      />

      {/* View Details Drawer */}
      <VolunteerProfileSheet
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        volunteer={selectedVolunteer as any}
        onEdit={(v) => handleEdit(v as any)}
      />

    </div>
  );
}
