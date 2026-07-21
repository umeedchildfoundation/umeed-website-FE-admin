import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "../services/studentsApi";
import { volunteersApi } from "../services/volunteersApi";
import { sessionsApi } from "../services/sessionsApi";
import { applicationsApi } from "../services/applicationsApi";
import { eventsApi } from "../services/eventsApi";
import { noticesApi } from "../services/noticesApi";
import { attendanceApi } from "../services/attendanceApi";
import apiClient from "../lib/apiClient";
import {
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import type { Session } from "../types/session";

export function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [students, volunteers, sessions, applications] = await Promise.all([
        studentsApi.getAll(),
        volunteersApi.getAll(),
        sessionsApi.getAll(),
        applicationsApi.getAll(),
      ]);

      const activeStudents = students.filter(
        (s: any) => s.status === "active",
      ).length;
      const activeVolunteers = volunteers.filter(
        (v: any) => v.status === "approved",
      ).length;
      const totalVolunteers = volunteers.length;
      const totalSessions = sessions.length;
      const pendingApplications = applications.filter(
        (a: any) => a.status === "pending",
      ).length;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sessionsThisMonth = sessions.filter(
        (s: Session) => new Date(s.session_date) >= firstDayOfMonth,
      ).length;

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
      const students = await studentsApi.getAll();
      const sixMonthsAgo = subMonths(new Date(), 6);

      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date(),
      });

      return last6Months.map((date) => {
        const monthStr = format(date, "MMM");
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const count = students.filter((s: any) => {
          if (!s.created_at) return false;
          const created = new Date(s.created_at);
          return (
            created >= monthStart &&
            created <= monthEnd &&
            created >= sixMonthsAgo
          );
        }).length;

        return { name: monthStr, students: count };
      });
    },
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: ["session-stats-overview"],
    queryFn: async () => {
      const sessions = await sessionsApi.getAll();

      let completed = 0;
      let scheduled = 0;
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      sessions.forEach((session: Session) => {
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
    },
  });
}

export function useUpcomingSessions(limit = 5) {
  return useQuery({
    queryKey: ["upcoming-sessions", limit],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const sessions = await sessionsApi.getAll();
      return sessions
        .filter((s: Session) => s.session_date >= today)
        .sort((a: Session, b: Session) =>
          a.session_date.localeCompare(b.session_date),
        )
        .slice(0, limit);
    },
  });
}

export function useRecentEvents(limit = 5) {
  return useQuery({
    queryKey: ["recent-events", limit],
    queryFn: async () => {
      const events = await eventsApi.getAll();
      return events
        .sort(
          (a: any, b: any) =>
            new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
        )
        .slice(0, limit);
    },
  });
}

export function useRecentNotices(
  limit = 5,
  visibility?: "public" | "internal",
) {
  return useQuery({
    queryKey: ["recent-notices", limit, visibility],
    queryFn: async () => {
      const params = visibility ? { visibility } : undefined;
      const notices = await noticesApi.getAll(params);
      return notices
        .sort((a: any, b: any) => {
          const dateA = a.published_date
            ? new Date(a.published_date).getTime()
            : 0;
          const dateB = b.published_date
            ? new Date(b.published_date).getTime()
            : 0;
          return dateB - dateA;
        })
        .slice(0, limit);
    },
  });
}

export function useAttendanceStats() {
  return useQuery({
    queryKey: ["attendance-stats"],
    queryFn: async () => {
      const allSessions = await sessionsApi.getAll();
      const sessions = allSessions
        .sort(
          (a: Session, b: Session) =>
            new Date(b.session_date).getTime() -
            new Date(a.session_date).getTime(),
        )
        .slice(0, 8)
        .reverse();

      if (!sessions.length) return { chartData: [], avgAttendance: 0 };

      const chartData = await Promise.all(
        sessions.map(async (session: Session) => {
          const attendance = await attendanceApi.getStudentAttendance({
            session_id: session.id,
          });
          const present = attendance.filter(
            (a: any) => a.status === "present",
          ).length;
          const total = attendance.length || 1;
          const rate = Math.round((present / total) * 100);

          return {
            date: new Date(session.session_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            attendance: rate,
          };
        }),
      );

      const avgAttendance = chartData.length
        ? Math.round(
            chartData.reduce((acc, d) => acc + d.attendance, 0) /
              chartData.length,
          )
        : 0;

      return { chartData, avgAttendance };
    },
  });
}

export function useVolunteerStats(volunteerId: string | null) {
  return useQuery({
    queryKey: ["volunteer-dashboard-stats", volunteerId],
    enabled: !!volunteerId,
    queryFn: async () => {
      const [attendanceRecords, allSessions, volunteer] = await Promise.all([
        attendanceApi.getVolunteerAttendance({ volunteer_id: volunteerId! }),
        sessionsApi.getAll(),
        volunteersApi.getById(volunteerId!),
      ]);

      // Build session lookup map
      const sessionMap = new Map(allSessions.map((s: Session) => [s.id, s]));

      // Enrich attendance with session data
      const attendance = attendanceRecords.map((a: any) => ({
        ...a,
        sessions: sessionMap.get(a.session_id) || null,
      }));

      const totalSessionsAttended = attendance.filter(
        (a: any) => a.status === "present",
      ).length;
      const totalSessionsAssigned = attendance.length;
      const attendanceRate =
        totalSessionsAssigned > 0
          ? Math.round((totalSessionsAttended / totalSessionsAssigned) * 100)
          : 0;
      const totalHours = totalSessionsAttended * 2;

      // Next upcoming session
      const today = new Date().toISOString().split("T")[0];
      const nextSessionData =
        allSessions
          .filter((s: Session) => s.session_date >= today)
          .sort((a: Session, b: Session) =>
            a.session_date.localeCompare(b.session_date),
          )[0] || null;

      let userRsvp: string | null = null;
      if (nextSessionData && (nextSessionData as any).rsvp_enabled) {
        try {
          const { data: rsvps } = await apiClient.get("/session_rsvps", {
            params: { session_id: nextSessionData.id },
          });
          const mine = (rsvps || []).find(
            (r: any) => r.volunteer_id === volunteerId,
          );
          userRsvp = mine?.status ?? null;
        } catch {
          userRsvp = null;
        }
      }

      const nextSession = nextSessionData
        ? { ...nextSessionData, userRsvp }
        : null;

      // Attendance chart (last 6 months)
      const sixMonthsAgo = subMonths(new Date(), 6);
      const recentAttendance = attendance.filter((a: any) => {
        const sessionDate = a.sessions?.session_date
          ? new Date(a.sessions.session_date)
          : null;
        return sessionDate && sessionDate >= sixMonthsAgo;
      });

      const months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date(),
      });

      const attendanceChartData = months.map((date) => {
        const monthStr = format(date, "MMM");
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const sessionsInMonth = recentAttendance.filter((a: any) => {
          const d = a.sessions?.session_date
            ? new Date(a.sessions.session_date)
            : null;
          return d && d >= monthStart && d <= monthEnd;
        });

        const presentCount = sessionsInMonth.filter(
          (a: any) => a.status === "present",
        ).length;
        const totalCount = sessionsInMonth.length;

        return {
          name: monthStr,
          present: presentCount,
          total: totalCount,
          attendance:
            totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
        };
      });

      const activeDays = (volunteer as any)?.created_at
        ? Math.floor(
            (new Date().getTime() -
              new Date((volunteer as any).created_at).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      return {
        totalSessionsAttended,
        totalHours,
        attendanceRate,
        activeDays,
        nextSession: nextSession as any,
        attendanceChartData,
      };
    },
  });
}

export function useNotifications(
  limit = 10,
  visibility?: "public" | "internal",
) {
  return useQuery({
    queryKey: ["notifications", limit, visibility],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const params = visibility ? { visibility } : undefined;

      const [notices, sessions] = await Promise.all([
        noticesApi.getAll(params),
        sessionsApi.getAll(),
      ]);

      const upcomingSessions = sessions
        .filter((s: Session) => s.session_date >= today)
        .sort((a: Session, b: Session) =>
          a.session_date.localeCompare(b.session_date),
        )
        .slice(0, 5);

      const sortedNotices = notices
        .sort((a: any, b: any) => {
          const dateA = a.published_date
            ? new Date(a.published_date).getTime()
            : 0;
          const dateB = b.published_date
            ? new Date(b.published_date).getTime()
            : 0;
          return dateB - dateA;
        })
        .slice(0, limit);

      const combined = [
        ...sortedNotices.map((n: any) => ({
          id: `notice-${n.id}`,
          type: "notice",
          title: n.title,
          message: n.description,
          date: n.published_date ? new Date(n.published_date) : new Date(),
          read: false,
        })),
        ...upcomingSessions.map((s: Session) => ({
          id: `session-${s.id}`,
          type: "session",
          title: "Upcoming Session",
          message: `${s.location} on ${format(new Date(s.session_date), "MMM dd")} at ${s.start_time}`,
          date: new Date(s.session_date),
          read: false,
        })),
      ];

      return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
  });
}

export function useSessionDetailedRSVPs(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-rsvps-detail", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data } = await apiClient.get("/session_rsvps", {
        params: { session_id: sessionId },
      });
      return data || [];
    },
  });
}
