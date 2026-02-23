import { useStats, useAttendanceStats } from "@/hooks/useStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Calendar } from "lucide-react";

const downloadCsv = (filename: string, rows: string[][]) => {
  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

export default function ReportsPage() {
  const { data: stats } = useStats();
  const { data: attendance } = useAttendanceStats();

  const handleExportSummary = () => {
    const rows = [
      ["Metric", "Value"],
      ["Active Students", String(stats?.activeStudents || 0)],
      ["Active Volunteers", String(stats?.activeVolunteers || 0)],
      ["Sessions This Month", String(stats?.sessionsThisMonth || 0)],
      ["Total Sessions", String(stats?.totalSessions || 0)],
      ["Avg Attendance %", String(attendance?.avgAttendance || 0)],
    ];
    downloadCsv("summary.csv", rows);
  };

  const handleExportAttendance = () => {
    const rows = [["Session", "Attendance%"]];
    (attendance?.chartData || []).forEach((row) => rows.push([row.date, String(row.attendance)]));
    downloadCsv("attendance.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Exports</h1>
        <p className="text-muted-foreground">Download quick summaries for offline sharing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{stats?.activeStudents ?? 0}</p>
            <Button variant="outline" onClick={handleExportSummary}>
              Export Summary
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Volunteers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{stats?.activeVolunteers ?? 0}</p>
            <Button variant="outline" onClick={handleExportAttendance}>
              Attendance CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{stats?.totalSessions ?? 0}</p>
            <p className="text-sm text-muted-foreground">This month: {stats?.sessionsThisMonth ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

