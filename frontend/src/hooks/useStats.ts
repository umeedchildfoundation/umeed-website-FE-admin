import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

export function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [studentsRes, volunteersRes, sessionsRes, applicationsRes] = await Promise.all([
        api.from("students").select("id, status", { count: "exact" }),
        api.from("volunteers").select("id, status", { count: "exact" }),
        api.from("sessions").select("id, session_date", { count: "exact" }),
        api.from("volunteer_applications").select("id, status", { count: "exact" }),
      ]);

      const activeStudents = studentsRes.data?.filter(s => s.status === "active").length || 0;
      const activeVolunteers = volunteersRes.data?.filter(v => v.status === "approved").length || 0;
      const totalVolunteers = volunteersRes.count || 0;
      const totalSessions = sessionsRes.count || 0;
      const pendingApplications = applicationsRes.data?.filter(a => a.status === "pending").length || 0;

      // Get this month's sessions
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sessionsThisMonth = sessionsRes.data?.filter(s => new Date((s as any).session_date) >= firstDayOfMonth).length || 0;

      return {
        activeStudents,
        activeVolunteers,
        totalVolunteers,
        totalSessions,
        sessionsThisMonth,
        pendingApplications,
      };
    },
  });
}

export function useStudentGrowth() {
  return useQuery({
    queryKey: ["student-growth"],
    queryFn: async () => {
      const startOfPeriod = subMonths(new Date(), 6);
      const { data: students } = await api
        .from("students")
        .select("created_at")
        .gte("created_at", startOfPeriod.toISOString());

      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
      });

      return last6Months.map(date => {
        const monthStr = format(date, "MMM");
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const count = students?.filter(s => {
          if (!s.created_at) return false;
          const created = new Date(s.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length || 0;

        return {
          name: monthStr,
          students: count,
        };
      });
    }
  })
}

export function useSessionStats() {
  return useQuery({
    queryKey: ["session-stats-overview"],
    queryFn: async () => {
      const { data: sessions, error } = await api
        .from("sessions")
        .select("session_date");

      if (error) throw error;

      let completed = 0;
      let scheduled = 0;
      const now = new Date();
      // Reset time to compare dates only
      now.setHours(0, 0, 0, 0);

      sessions?.forEach(session => {
        const date = new Date(session.session_date);
        if (date < now) {
          completed++;
        } else {
          scheduled++;
        }
      });

      return [
        { name: "Completed", value: completed, color: "hsl(var(--primary))" },
        { name: "Scheduled", value: scheduled, color: "hsl(var(--accent))" },
      ];
    }
  })
}


export function useUpcomingSessions(limit = 5) {
  return useQuery({
    queryKey: ["upcoming-sessions", limit],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await api
        .from("sessions")
        .select("*")
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentEvents(limit = 5) {
  return useQuery({
    queryKey: ["recent-events", limit],
    queryFn: async () => {
      const { data, error } = await api
        .from("events")
        .select("*, event_media(url, media_type)")
        .order("event_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentNotices(limit = 5, visibility?: "public" | "internal") {
  return useQuery({
    queryKey: ["recent-notices", limit, visibility],
    queryFn: async () => {
      let q = api.from("notices").select("*").order("published_date", { ascending: false }).limit(limit);
      if (visibility) {
        q = q.eq("visibility", visibility);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAttendanceStats() {
  return useQuery({
    queryKey: ["attendance-stats"],
    queryFn: async () => {
      const { data: sessions } = await api
        .from("sessions")
        .select("id, session_date")
        .order("session_date", { ascending: false })
        .limit(8);

      if (!sessions?.length) return { chartData: [], avgAttendance: 0 };

      const chartData = await Promise.all(
        sessions.reverse().map(async (session) => {
          const { data: attendance } = await api
            .from("student_attendance")
            .select("status")
            .eq("session_id", session.id);

          const present = attendance?.filter(a => a.status === "present").length || 0;
          const total = attendance?.length || 1;
          const rate = Math.round((present / total) * 100);

          return {
            date: new Date((session as any).session_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            attendance: rate,
          };
        })
      );

      const avgAttendance = chartData.length
        ? Math.round(chartData.reduce((acc, d) => acc + d.attendance, 0) / chartData.length)
        : 0;

      return { chartData, avgAttendance };
    },
  });
}

export function useVolunteerStats(volunteerId: string | undefined) {
  return useQuery({
    queryKey: ["volunteer-dashboard-stats", volunteerId],
    enabled: !!volunteerId,
    queryFn: async () => {
      // 1. Get Attendance Stats
      const { data: attendance } = await api
        .from("volunteer_attendance")
        .select(`
          status, 
          session_id, 
          sessions (
            session_date,
            start_time,
            end_time
          )
        `)
        .eq("volunteer_id", volunteerId);

      const totalSessionsAttended = attendance?.filter(a => a.status === "present").length || 0;
      const totalSessionsAssigned = attendance?.length || 0;
      const attendanceRate = totalSessionsAssigned > 0
        ? Math.round((totalSessionsAttended / totalSessionsAssigned) * 100)
        : 0;

      // Estimate hours: 2 hours per session default, or calculate from start/end if available?
      const totalHours = totalSessionsAttended * 2;

      // 2. Get Next Session
      const today = new Date().toISOString().split("T")[0];
      const { data: nextSessionData } = await api
        .from("sessions")
        .select("*, session_rsvps(status)")
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      // Check current user's RSVP if session exists
      let nextSession = null;
      if (nextSessionData) {
        const { data: userRsvpData } = await api
          .from("session_rsvps")
          .select("status")
          .eq("session_id", nextSessionData.id)
          .eq("volunteer_id", volunteerId)
          .maybeSingle();

        nextSession = {
          ...nextSessionData,
          userRsvp: userRsvpData?.status || null
        };
      }

      // 3. Get Recent Attendance History (last 6 months) for Chart
      const sixMonthsAgo = subMonths(new Date(), 6);
      const recentAttendance = attendance?.filter(a => {
        const sessionDate = new Date((a.sessions as any)?.session_date);
        return sessionDate >= sixMonthsAgo;
      });

      // Group by month
      const months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
      });

      const attendanceChartData = months.map(date => {
        const monthStr = format(date, "MMM");
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const sessionsInMonth = recentAttendance?.filter(a => {
          const d = new Date((a.sessions as any)?.session_date);
          return d >= monthStart && d <= monthEnd;
        });

        const presentCount = sessionsInMonth?.filter(a => a.status === "present").length || 0;
        const totalCount = sessionsInMonth?.length || 0;

        return {
          name: monthStr,
          present: presentCount,
          total: totalCount,
          attendance: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
        };
      });

      // Active Since (Days Active)
      const { data: volunteer } = await api.from("volunteers").select("created_at").eq("id", volunteerId).maybeSingle();
      const activeDays = volunteer?.created_at
        ? Math.floor((new Date().getTime() - new Date(volunteer.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        totalSessionsAttended,
        totalHours,
        attendanceRate,
        activeDays,
        nextSession: nextSession as any, // casting to any to include userRsvp, temporary fix until types updated
        attendanceChartData
      };
    },
  });
}

export function useNotifications(limit = 10, visibility?: "public" | "internal") {
  return useQuery({
    queryKey: ["notifications", limit, visibility],
    queryFn: async () => {
      // 1. Get Recent Notices
      let noticeQuery = api
        .from("notices")
        .select("id, title, description, published_date, visibility")
        .order("published_date", { ascending: false })
        .limit(limit);

      if (visibility) {
        noticeQuery = noticeQuery.eq("visibility", visibility);
      }

      const { data: notices } = await noticeQuery;

      // 2. Get Upcoming Sessions (as notifications)
      const today = new Date();
      const { data: sessions } = await api
        .from("sessions")
        .select("id, location, session_date, start_time")
        .gte("session_date", today.toISOString().split("T")[0])
        .order("session_date", { ascending: true })
        .limit(5);

      // 3. Combine and Format
      const combined = [
        ...(notices || []).map(n => ({
          id: `notice-${n.id}`,
          type: 'notice',
          title: n.title,
          message: n.description,
          date: new Date(n.published_date),
          read: false
        })),
        ...(sessions || []).map(s => ({
          id: `session-${s.id}`,
          type: 'session',
          title: "Upcoming Session",
          message: `${s.location} on ${format(new Date(s.session_date), "MMM dd")} at ${s.start_time}`,
          date: new Date(s.session_date), // This is in future, so it stays at top if sorting by "latest first"??
          read: false
        }))
      ];

      // Sort by DATE DESCENDING (Newest/Future first)
      return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
  });
}
// ... existing code ...
export function useSessionDetailedRSVPs(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-rsvps-detail", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await api
        .from("session_rsvps")
        .select(`
          status,
          volunteers (
            id,
            name,
            email,
            profile_picture,
            volunteer_id
          )
        `)
        .eq("session_id", sessionId);

      if (error) throw error;
      return data || [];
    },
  });
}
