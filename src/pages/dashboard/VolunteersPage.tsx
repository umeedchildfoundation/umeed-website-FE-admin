import { sendApprovalEmail } from "../../services/emailService";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../../lib/api";
import { volunteersApi } from "../../services/volunteersApi";
import { attendanceApi } from "../../services/attendanceApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Shield,
  UserCheck,
  Phone,
  Clock
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { VolunteerProfileSheet } from "../../components/volunteers/VolunteerProfileSheet";
import { VolunteerForm, type VolunteerFormData } from "../../components/volunteers/VolunteerForm";

import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Card, CardContent } from "../../components/ui/card";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import { generateVolunteerId, getVolunteerSequentialNumber } from "../../lib/volunteerConfig";
import type { CustomError } from "../../types/common";
import type { Volunteer } from "../../types/volunteer";

const PAGE_SIZE = 10;

// Builds a windowed page-number list with ellipses, e.g. [1, "...", 4, 5, 6, "...", 12]
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

export default function VolunteersPage() {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  // Reset back to page 1 whenever the search term or tab filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // --- QUERIES ---
  const { data: volunteers, isLoading, isError, error } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      // 1. Fetch Volunteers
      const volunteersData = await volunteersApi.getAll();

      // 2. Fetch Attendance
      let attendanceData: { volunteer_id: string }[] = [];
      try {
        attendanceData = await attendanceApi.getVolunteerAttendance({ status: "present" }) as any;
      } catch {
        return volunteersData.map((v: Volunteer) => ({
          ...v,
          name: v.name || v.full_name || "Unknown Volunteer",
          attendance_count: 0,
        })) as Volunteer[];
      }

      // 3. Aggregate Counts
      const attendanceCounts: Record<string, number> = {};
      attendanceData.forEach((item: { volunteer_id: string }) => {
        attendanceCounts[item.volunteer_id] = (attendanceCounts[item.volunteer_id] || 0) + 1;
      });

      // 4. Merge
      return volunteersData.map((v: Volunteer) => ({
        ...v,
        name: v.name || v.full_name || "Unknown Volunteer",
        profile_picture: v.profile_picture,
        attendance_count: attendanceCounts[v.id] || 0
      }));
    },
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (volunteer: Partial<Volunteer>) => {
      if (!volunteer.name || !volunteer.email) throw new Error("Name and email are required");
      await volunteersApi.create({
        ...volunteer,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status || "pending",
        joined_at: new Date().toISOString(),
      });
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
      await volunteersApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Volunteer updated" });
      setIsModalOpen(false);
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  // --- HELPERS ---
  const filteredVolunteers = volunteers?.filter((v: Volunteer) => {
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

  const totalPages = Math.max(1, Math.ceil((filteredVolunteers?.length || 0) / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedVolunteers = filteredVolunteers?.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Stats for the top cards
  const stats = {
    total: volunteers?.length || 0,
    active: volunteers?.filter((v: Volunteer) => v.status === 'approved').length || 0,
    pending: volunteers?.filter((v: Volunteer) => v.status === 'pending').length || 0,
    inactive: volunteers?.filter((v: Volunteer) => v.status === 'inactive' || v.status === 'rejected').length || 0,
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
    const { id, attendance_count, ...rest } = data;
    const payload = { ...rest };
    if (payload.email) payload.email = payload.email.trim().toLowerCase();
    if (payload.name) payload.name = payload.name.trim();

    // delete payload.attendance_count;
    console.log(attendance_count);
    
    // Ensure numeric fields
    if (typeof payload.age === 'string' && payload.age.trim() === '') delete payload.age;
    else if (payload.age) payload.age = Number(payload.age);

    if (id) {
      await updateMutation.mutateAsync({ ...payload, id });
    } else {
      // 1. Create local auth user
      let createdUserId = null;
      try {
        const authData = await authService.register(payload.email, "umeed@123", payload.name);

        console.log("Auth User Created Successfully:", authData?.user?.id);
        createdUserId = authData?.user?.id;

      } catch (error) {
        const err = error as CustomError;
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
        volunteers.forEach((v: Volunteer) => {
          if (v.volunteer_id) {
            const seq = getVolunteerSequentialNumber(v.volunteer_id);
            if (seq > maxSeq) maxSeq = seq;
          }
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
                    paginatedVolunteers?.map((volunteer: Volunteer) => (
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {safePage} of {totalPages} &middot; {filteredVolunteers?.length || 0} volunteers
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (safePage > 1) setCurrentPage(safePage - 1);
                    }}
                    className={safePage <= 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>

                {getPageNumbers(safePage, totalPages).map((page, idx) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safePage}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (safePage < totalPages) setCurrentPage(safePage + 1);
                    }}
                    className={safePage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
        volunteer={selectedVolunteer}
        onEdit={(v: Volunteer) => handleEdit(v)}
      />

    </div>
  );
}
