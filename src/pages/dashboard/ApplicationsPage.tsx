import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { authService } from "../../lib/api";
import { applicationsApi } from "../../services/applicationsApi";
import { volunteersApi } from "../../services/volunteersApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";
import { format } from "date-fns";
import { Input } from "../../components/ui/input";
import { Eye } from "lucide-react";
import { sendApprovalEmail } from "../../services/emailService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  occupation: string | null;
  availability: string | null;
  motivation: string | null;
  skills_subjects: string[] | null;
  preferred_languages: string[] | null;
  status: "pending" | "approved" | "rejected" | "inactive";
  created_at: string | null;
};

function parseArrayField(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ApplicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => applicationsApi.getAll() as Promise<Application[]>,
    select: (data) =>
      data.map((app) => ({
        ...app,
        skills_subjects: parseArrayField(app.skills_subjects),
        preferred_languages: parseArrayField(app.preferred_languages),
      })),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { app: Application; status: Application["status"] }) => {
      // 1. Update Application Status
      await applicationsApi.update(payload.app.id, { status: payload.status });

      // 2. If Approved, create volunteer profile + auth account
      if (payload.status === "approved") {
        const { data: authData, error: authError } = await authService.register(
          payload.app.email,
          "umeed@123",
          payload.app.full_name,
        ).then((d) => ({ data: d, error: null })).catch((e) => ({ data: null, error: e }));

        if (authError) {
          console.warn("User creation warning (may already exist):", authError.message);
        }

        const existing = await volunteersApi.getAll({ email: payload.app.email });
        if (!existing.length) {
          await volunteersApi.create({
            name: payload.app.full_name,
            email: payload.app.email,
            phone: payload.app.phone ?? undefined,
            age: payload.app.age ?? undefined,
            gender: payload.app.gender ?? undefined,
            address: payload.app.address ?? undefined,
            occupation: payload.app.occupation ?? undefined,
            availability: payload.app.availability ?? undefined,
            skills: payload.app.skills_subjects as any,
            preferred_languages: payload.app.preferred_languages as any,
            status: "pending",
            joined_at: new Date().toISOString(),
            user_id: authData?.user?.id,
          } as any);
        } else if (authData?.user?.id) {
          await volunteersApi.update(existing[0].id, { user_id: authData.user.id } as any);
        }
      }
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });

      if (variables.status === "approved") {
        const loginLink = "http://172.20.10.3:8080/login";

        // Fetch Official Email

        // Send Email via EmailJS
        try {
          await sendApprovalEmail(
            variables.app.email,
            variables.app.full_name,
            loginLink
          );

          toast({
            title: "Application Approved",
            description: (
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  ✅ Volunteer Profile Created
                </span>
                <span className="flex items-center gap-2">
                  📧 Email Invitation Sent
                </span>
              </div>
            ),
            className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200"
          });

        } catch (error: any) {
          console.error("EmailJS Error:", error);
          toast({
            title: "Email Sending Failed",
            description: `Attempted to send to: '${variables.app.email}'. Error: ${error?.text || error?.message || "Unknown error"}.`,
            variant: "destructive"
          });
        }
      } else {
        toast({ title: "Application updated" });
      }
    },
    onError: (error) => toast({ title: "Error", description: (error as Error).message, variant: "destructive" }),
  });

  const statusVariant = (status: Application["status"]) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredApps = useMemo(() => {
    if (!applications) return [];
    const q = search.toLowerCase();
    return applications.filter((a) => {
      const skillsText = (a.skills_subjects || []).join(", ").toLowerCase();
      return (
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        skillsText.includes(q)
      );
    });
  }, [applications, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Volunteer Applications</h1>
        <p className="text-muted-foreground">Approve or reject volunteer applications</p>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by name, email, or skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="grid grid-cols-1 overflow-hidden w-full rounded-md border sm:border-0 border-border">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredApps.length ? (
                    filteredApps.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.full_name}</TableCell>
                        <TableCell>{app.email}</TableCell>
                        <TableCell className="max-w-xs truncate">{(app.skills_subjects || []).join(", ") || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(app.status)} className="capitalize">
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{app.created_at ? format(new Date(app.created_at), "PPP") : "—"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedApp(app)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          {app.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ app: app, status: "approved" })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateMutation.mutate({ app: app, status: "rejected" })}>
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No applications yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedApp?.created_at ? format(new Date(selectedApp.created_at), "PPP") : "Unknown date"}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Full Name</h4>
                  <p className="text-base">{selectedApp.full_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Email</h4>
                  <p className="text-base">{selectedApp.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Phone</h4>
                  <p className="text-base">{selectedApp.phone || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Age / Gender</h4>
                  <p className="text-base">
                    {selectedApp.age || "N/A"} / {selectedApp.gender || "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Address</h4>
                  <p className="text-base">{selectedApp.address || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Occupation</h4>
                  <p className="text-base">{selectedApp.occupation || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Availability</h4>
                  <p className="text-base capitalize">{(selectedApp.availability || "").replace("-", " ") || "N/A"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Skills & Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.skills_subjects?.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  )) || "None listed"}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Preferred Languages</h4>
                <p className="text-base">{selectedApp.preferred_languages?.join(", ") || "N/A"}</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Motivation</h4>
                <p className="text-sm italic text-foreground/80 whitespace-pre-wrap">
                  "{selectedApp.motivation || "No motivation provided."}"
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                <Button variant="outline" onClick={() => setSelectedApp(null)}>Close</Button>
                {selectedApp.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateMutation.mutate({ app: selectedApp, status: "rejected" });
                        setSelectedApp(null);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        updateMutation.mutate({ app: selectedApp, status: "approved" });
                        setSelectedApp(null);
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
