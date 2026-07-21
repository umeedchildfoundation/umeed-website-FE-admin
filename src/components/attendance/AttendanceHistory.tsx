import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "../../services/attendanceApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Search, Filter, Download, Users, X } from "lucide-react";
import { cn } from "../../lib/utils";

type AttendanceRecord = {
    id: string;
    person_id: string;
    name: string;
    type: "student" | "volunteer";
    date: string; // Session Date
    status: "present" | "absent" | "late" | "excused";
    marked_at: string;
};
import { useAuth } from "../../contexts/AuthContext";

export function AttendanceHistory() {
    const { isAdmin } = useAuth();
    const isVolunteer = !isAdmin;

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "student" | "volunteer">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "late">("all");
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

    // Fetch and combine all attendance
    const { data: records, isLoading } = useQuery({
        queryKey: ["attendance-history-all"],
        queryFn: async () => {
            const [studentsData, volunteersData] = await Promise.all([
                attendanceApi.getStudentAttendance(),
                attendanceApi.getVolunteerAttendance(),
            ]);

            const studentRecords: AttendanceRecord[] = (studentsData as any[]).map((r: any) => ({
                id: r.id,
                person_id: r.student_id,
                name: r.students?.full_name || "Unknown",
                type: "student",
                date: r.sessions?.session_date ?? r.session_id,
                status: r.status,
                marked_at: r.marked_at,
            }));

            const volunteerRecords: AttendanceRecord[] = (volunteersData as any[]).map((r: any) => ({
                id: r.id,
                person_id: r.volunteer_id,
                name: r.volunteers?.name || "Unknown",
                type: "volunteer",
                date: r.sessions?.session_date ?? r.session_id,
                status: r.status,
                marked_at: r.marked_at,
            }));

            return [...studentRecords, ...volunteerRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
    });

    // Filter Logic
    const filteredRecords = useMemo(() => {
        if (!records) return [];
        return records.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === "all" || r.type === typeFilter;
            const matchesStatus = statusFilter === "all" || r.status === statusFilter;

            let matchesDate = true;
            if (dateFilter && r.date) {
                matchesDate = isSameDay(new Date(r.date), dateFilter);
            }

            return matchesSearch && matchesType && matchesStatus && matchesDate;
        });
    }, [records, search, typeFilter, statusFilter, dateFilter]);

    // Stats Calculation
    const stats = useMemo(() => {
        const total = filteredRecords.length;
        if (total === 0) return { present: 0, absent: 0, rate: 0 };
        const present = filteredRecords.filter(r => r.status === "present").length;
        return {
            present,
            absent: total - present,
            rate: Math.round((present / total) * 100)
        };
    }, [filteredRecords]);

    const statusConfig = {
        present: { label: "Present", variant: "default" as const, className: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" },
        absent: { label: "Absent", variant: "destructive" as const, className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" },
        late: { label: "Late", variant: "secondary" as const, className: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" },
        excused: { label: "Excused", variant: "outline" as const, className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" },
    };

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 flex-1 flex-wrap">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            className="pl-9 bg-secondary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[200px] justify-start text-left font-normal",
                                    !dateFilter && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateFilter}
                                onSelect={setDateFilter}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {dateFilter && (
                        <Button variant="ghost" size="icon" onClick={() => setDateFilter(undefined)}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}

                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                        <SelectTrigger className="w-full md:w-[150px]">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="All Types" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="student">Students</SelectItem>
                            {!isVolunteer && <SelectItem value="volunteer">Volunteers</SelectItem>}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <SelectTrigger className="w-full md:w-[150px]">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="All Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    {!isVolunteer && (
                        <Button variant="outline" className="gap-2" onClick={() => {
                            // Export CSV Logic could go here
                        }}>
                            <Download className="w-4 h-4" /> Export
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                <StatsCard label="Total Records" value={filteredRecords.length} />
                <StatsCard label="Attendance Rate" value={`${stats.rate}%`} className={stats.rate > 80 ? "text-green-600" : "text-amber-600"} />
                <StatsCard label="Total Present" value={stats.present} />
            </div>

            {/* Table */}
            <Card className="border-border/50 shadow-sm overflow-hidden grid grid-cols-1">
                <div className="overflow-x-auto w-full">
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Marked At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading records...</TableCell>
                                </TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records match your filters.</TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((r) => (
                                    <TableRow key={`${r.type}-${r.id}`} className="hover:bg-secondary/20">
                                        <TableCell className="font-medium">
                                            {r.date ? format(new Date(r.date), "MMM dd, yyyy") : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.type === 'student' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                                                    }`}>
                                                    {r.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {r.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize bg-secondary/50">
                                                {r.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusConfig[r.status].variant} className={cn("capitalize shadow-none", statusConfig[r.status].className)}>
                                                {r.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {format(new Date(r.marked_at), "MMM dd, HH:mm")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

function StatsCard({ label, value, className }: any) {
    return (
        <Card>
            <CardContent className="p-3 md:p-6 flex flex-col items-center justify-center text-center gap-1">
                <span className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
                <span className={cn("text-xl md:text-2xl font-bold leading-none", className)}>{value}</span>
            </CardContent>
        </Card>
    )
}
