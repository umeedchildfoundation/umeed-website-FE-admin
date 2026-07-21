import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { sessionsApi } from "../../services/sessionsApi";
import { attendanceApi } from "../../services/attendanceApi";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { format } from "date-fns";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Check, X, Clock, HelpCircle, Minus } from "lucide-react";

type Session = {
  id: string;
  session_date: string;
  location: string | null;
  notes: string | null;
};

type AttendanceRecord = {
  session_id: string;
  status: "present" | "absent" | "late" | "excused";
};

export default function MySessionsPage() {
  const { volunteerId } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Fetch all sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["all-sessions"],
    queryFn: async () => {
      const data = await sessionsApi.getAll();
      return (data as Session[]).sort((a, b) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
    },
  });

  // Fetch volunteer's attendance records
  const { data: myAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["my-volunteer-attendance", volunteerId],
    enabled: !!volunteerId,
    queryFn: async () => {
      const data = await attendanceApi.getVolunteerAttendance({ volunteer_id: volunteerId! });
      return data as AttendanceRecord[];
    },
  });

  // Create a map of session_id -> status
  const attendanceMap = useMemo(() => {
    const map: Record<string, AttendanceRecord["status"]> = {};
    myAttendance?.forEach((record) => {
      map[record.session_id] = record.status;
    });
    return map;
  }, [myAttendance]);

  // Filter sessions by search
  const filtered = useMemo(() => {
    if (!sessions) return [];
    const q = search.toLowerCase();
    return sessions.filter(
      (session) =>
        session.session_date.toLowerCase().includes(q) ||
        session.location?.toLowerCase().includes(q) ||
        session.notes?.toLowerCase().includes(q)
    );
  }, [sessions, search]);

  const isLoading = sessionsLoading || attendanceLoading;

  const getStatusBadge = (status: AttendanceRecord["status"] | undefined) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
            <Check className="w-3 h-3" /> Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
            <X className="w-3 h-3" /> Absent
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
            <Clock className="w-3 h-3" /> Late
          </Badge>
        );
      case "excused":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
            <HelpCircle className="w-3 h-3" /> Excused
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <Minus className="w-3 h-3" /> Not Marked
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Sessions</h1>
        <p className="text-muted-foreground">View all sessions and your attendance status</p>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by date, location, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="grid grid-cols-1 overflow-hidden w-full rounded-md border sm:border-0 border-border">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>My Attendance</TableHead>
                    <TableHead className="hidden md:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length ? (
                    filtered.map((session) => (
                      <TableRow
                        key={session.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/dashboard/my-sessions/${session.id}`)}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(session.session_date), "PPP")}
                        </TableCell>
                        <TableCell>{session.location || "-"}</TableCell>
                        <TableCell>{getStatusBadge(attendanceMap[session.id])}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {session.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No sessions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
