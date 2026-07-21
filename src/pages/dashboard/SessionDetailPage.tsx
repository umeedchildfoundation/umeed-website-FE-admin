import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { sessionsApi } from "../../services/sessionsApi";
import { attendanceApi, type AttendanceRecord } from "../../services/attendanceApi";
import apiClient from "../../lib/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Users,
  Check,
  X,
  HelpCircle,
  Minus,
} from "lucide-react";

type SessionDetail = {
  id: string;
  title: string | null;
  date: string;
  session_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  status: string | null;
  rsvp_enabled: number | boolean;
};

type RsvpEntry = {
  volunteer_id: string;
  status: "yes" | "no" | "maybe";
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { volunteerId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session-detail", id],
    enabled: !!id,
    queryFn: async () =>
      (await sessionsApi.getById(id!)) as unknown as SessionDetail,
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["session-rsvps", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get<RsvpEntry[]>("/session_rsvps", {
        params: { session_id: id },
      });
      return data || [];
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ["session-attendance", id],
    enabled: !!id,
    queryFn: async () => {
      const data = await attendanceApi.getVolunteerAttendance({
        session_id: id!,
      });
      return data || [];
    },
  });

  const myRsvp = rsvps?.find((r) => r.volunteer_id === volunteerId)?.status ?? null;
  const myAttendance =
    (attendance as AttendanceRecord[] | undefined)?.find(
      (a) => a.volunteer_id === volunteerId,
    )?.status ?? null;

  const goingCount = rsvps?.filter((r) => r.status === "yes").length || 0;
  const maybeCount = rsvps?.filter((r) => r.status === "maybe").length || 0;
  const notGoingCount = rsvps?.filter((r) => r.status === "no").length || 0;

  const handleRsvp = async (status: "yes" | "no" | "maybe") => {
    if (!volunteerId || !id) return;
    setSubmitting(status);
    try {
      await apiClient.post("/session_rsvps", {
        session_id: id,
        volunteer_id: volunteerId,
        status,
      });
      toast({
        title: "RSVP updated",
        description: `You marked yourself as "${status}" for this session.`,
      });
      queryClient.invalidateQueries({ queryKey: ["session-rsvps", id] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard-stats"] });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const attendanceBadge = (status: AttendanceRecord["status"] | null) => {
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

  if (sessionLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-4">
        <p>Session not found.</p>
        <Button variant="outline" asChild>
          <Link to="/dashboard/my-sessions">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Sessions
          </Link>
        </Button>
      </div>
    );
  }

  const sessionDate = session.session_date || session.date;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/dashboard/my-sessions">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Sessions
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {session.title || "Session"}
              </CardTitle>
              <p className="text-muted-foreground mt-1 capitalize">
                {session.status || "scheduled"}
              </p>
            </div>
            {attendanceBadge(myAttendance)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {sessionDate ? format(new Date(sessionDate), "PPPP") : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {session.start_time
                  ? `${session.start_time}${session.end_time ? ` - ${session.end_time}` : ""}`
                  : "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{session.location || "TBD"}</span>
            </div>
            {!!session.rsvp_enabled && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>
                  {goingCount} going &middot; {maybeCount} maybe &middot;{" "}
                  {notGoingCount} not going
                </span>
              </div>
            )}
          </div>

          {session.notes && (
            <div className="flex items-start gap-2 text-sm bg-muted/40 rounded-lg p-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-foreground/90">{session.notes}</p>
            </div>
          )}

          {!!session.rsvp_enabled && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <p className="text-sm font-medium mb-3">Are you attending?</p>
              <div className="flex gap-2">
                <Button
                  variant={myRsvp === "yes" ? "default" : "outline"}
                  className={`flex-1 ${myRsvp === "yes" ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-green-50 text-green-700 border-green-200"}`}
                  disabled={!volunteerId || submitting !== null || rsvpsLoading}
                  onClick={() => handleRsvp("yes")}
                >
                  Yes
                </Button>
                <Button
                  variant={myRsvp === "maybe" ? "default" : "outline"}
                  className={`flex-1 ${myRsvp === "maybe" ? "bg-amber-500 hover:bg-amber-600 text-white" : "hover:bg-amber-50 text-amber-700 border-amber-200"}`}
                  disabled={!volunteerId || submitting !== null || rsvpsLoading}
                  onClick={() => handleRsvp("maybe")}
                >
                  Maybe
                </Button>
                <Button
                  variant={myRsvp === "no" ? "default" : "outline"}
                  className={`flex-1 ${myRsvp === "no" ? "bg-destructive hover:bg-destructive/90 text-white" : "hover:bg-red-50 text-red-700 border-red-200"}`}
                  disabled={!volunteerId || submitting !== null || rsvpsLoading}
                  onClick={() => handleRsvp("no")}
                >
                  No
                </Button>
              </div>
              {!volunteerId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Only linked volunteer accounts can RSVP.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
