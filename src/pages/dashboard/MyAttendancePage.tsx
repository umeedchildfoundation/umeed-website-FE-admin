import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { attendanceApi } from "../../services/attendanceApi";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { useToast } from "../../hooks/use-toast";
import { Input } from "../../components/ui/input";

type Row = {
  id: string;
  session_id: string;
  status: "present" | "absent" | "late" | "excused";
  sessions?: { session_date: string; location: string | null };
};

export default function MyAttendancePage() {
  const { volunteerId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", volunteerId],
    enabled: !!volunteerId,
    queryFn: () =>
      attendanceApi.getVolunteerAttendance({ volunteer_id: volunteerId! }) as Promise<Row[]>,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.filter(
      (row) =>
        row.sessions?.session_date?.toLowerCase().includes(q) ||
        row.session_id.toLowerCase().includes(q) ||
        row.sessions?.location?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status: Row["status"] }) =>
      attendanceApi.markVolunteerAttendance({
        volunteer_id: volunteerId!,
        session_id: payload.id,
        status: payload.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance", volunteerId] });
      toast({ title: "Attendance updated" });
    },
    onError: (error) =>
      toast({ title: "Error updating attendance", description: (error as Error).message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
        <p className="text-muted-foreground">Mark your attendance for assigned sessions</p>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by date or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length ? (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.sessions?.session_date ? format(new Date(row.sessions.session_date), "PPP") : row.session_id}
                        <div className="text-xs text-muted-foreground">{row.sessions?.location}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize">{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {["present", "absent", "late", "excused"].map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={row.status === status ? "secondary" : "outline"}
                            onClick={() => updateMutation.mutate({ id: row.id, status: status as Row["status"] })}
                            disabled={updateMutation.isPending}
                          >
                            {status}
                          </Button>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No attendance records yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

