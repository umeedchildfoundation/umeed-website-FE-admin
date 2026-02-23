import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceMarking } from "@/components/attendance/AttendanceMarking";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { ClipboardCheck, History, Calendar, Users, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("mark");

  const { data: stats } = useQuery({
    queryKey: ["attendance-page-stats"],
    queryFn: async () => {
      const [sessions, studentAttendance, volunteerAttendance, students] = await Promise.all([
        api.from("sessions").select("id", { count: "exact" }),
        api.from("student_attendance").select("id", { count: "exact" }).eq("status", "present"),
        api.from("volunteer_attendance").select("id", { count: "exact" }).eq("status", "present"),
        api.from("students").select("id", { count: "exact" }).eq("status", "active"),
      ]) as [any, any, any, any];

      const totalPresent = (studentAttendance.count || 0) + (volunteerAttendance.count || 0);

      return {
        totalSessions: sessions.count || 0,
        totalPresent: totalPresent,
        activeStudents: students.count || 0,
        avgAttendance: sessions.count ? Math.round(totalPresent / sessions.count) : 0
      };
    }
  });

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Attendance Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Track daily attendance for students and volunteers or analyze history.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Sessions",
            value: stats?.totalSessions || 0,
            icon: Calendar,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20"
          },
          {
            label: "Avg. Attendance",
            value: stats?.avgAttendance || 0,
            icon: Users,
            color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20"
          },
          {
            label: "Total Check-ins",
            value: stats?.totalPresent || 0,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-100 dark:bg-green-900/20"
          },
          {
            label: "Active Students",
            value: stats?.activeStudents || 0,
            icon: TrendingUp,
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20"
          },
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="mark" className="gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History & Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="mt-0 focus-visible:ring-0">
          <AttendanceMarking />
        </TabsContent>

        <TabsContent value="history" className="mt-0 focus-visible:ring-0">
          <AttendanceHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
