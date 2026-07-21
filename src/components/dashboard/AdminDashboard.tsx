import { motion } from "framer-motion";
import {
    GraduationCap,
    Users,
    Calendar,
    TrendingUp,
    Plus,
    ArrowUpRight,
    Clock,
    Megaphone,
    UserPlus,
    MapPin
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useStats, useAttendanceStats } from "../../hooks/useStats";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";
import { SessionRSVPDetailSheet } from "./SessionRSVPDetailSheet";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, Pie, PieChart as RePieChart, Legend
} from "recharts";
import { sessionsApi } from "../../services/sessionsApi";
import { volunteersApi } from "../../services/volunteersApi";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "../../types/session";

// Hook to fetch sessions (mix of recent past and upcoming)
function useSessionsWithRSVPCounts() {
    return useQuery({
        queryKey: ["admin-sessions-rsvp-overview"],
        queryFn: async () => {
            const allSessions = await sessionsApi.getAll();
            return allSessions
                .sort((a: Session, b: Session) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
                .slice(0, 10)
                .map((session: Session) => ({
                    ...session,
                    counts: { yes: 0, maybe: 0, no: 0, total_responses: 0 }
                }));
        }
    });
}

function useVolunteerStatusStats() {
    return useQuery({
        queryKey: ["volunteer-status-distribution"],
        queryFn: async () => {
            const vols = await volunteersApi.getAll();
            const counts = { approved: 0, pending: 0, rejected: 0 };
            vols.forEach((v: any) => {
                if (v.status === 'approved') counts.approved++;
                else if (v.status === 'pending') counts.pending++;
                else if (v.status === 'rejected') counts.rejected++;
            });
            return [
                { name: 'Active', value: counts.approved, color: '#22c55e' },
                { name: 'Pending', value: counts.pending, color: '#f59e0b' },
                { name: 'Rejected', value: counts.rejected, color: '#ef4444' }
            ];
        }
    });
}

export function AdminDashboard() {
    const { data: stats, isLoading: statsLoading } = useStats();
    const { data: attendanceStats } = useAttendanceStats();
    const { data: sessionsWithCounts } = useSessionsWithRSVPCounts();
    const { data: volunteerStatusData } = useVolunteerStatusStats();

    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedSessionTitle, setSelectedSessionTitle] = useState<string>("");

    const handleSessionClick = (id: string, title: string) => {
        setSelectedSessionId(id);
        setSelectedSessionTitle(title || "Session Details");
    };

    // Determine "Next Session": closest one in the future (or today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort logic for finding next session
    const futureSessions = sessionsWithCounts?.filter((s: Session) => new Date(s.session_date) >= today) || [];
    const nextSession = futureSessions.length > 0
        ? futureSessions.sort((a: Session, b: Session) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0]
        : null;

    // Stat Card Component
    const StatCard = ({ title, value, subtitle, icon: Icon, trend, iconBg, borderColor }: any) => (
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
            <Card className={`relative overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 ${borderColor}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
                    <div className={`p-1.5 rounded-lg ${iconBg}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold tracking-tight">{value}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        {trend && (
                            <span className={`${trend.isPositive ? 'text-green-500' : 'text-red-500'} font-semibold`}>
                                {trend.isPositive ? '↑' : '↓'} {trend.value}%
                            </span>
                        )}
                        {subtitle}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10 px-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-sm text-muted-foreground">Manage your organization efficiently.</p>
                </div>
            </div>

            {/* 1. Stats Grid (Top Priority) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Students"
                    value={statsLoading ? "..." : stats?.activeStudents || 0}
                    subtitle="vs last month"
                    icon={GraduationCap}
                    trend={{ value: 12, isPositive: true }}
                    iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                    borderColor="border-l-blue-500"
                />
                <StatCard
                    title="Total Volunteers"
                    value={statsLoading ? "..." : stats?.totalVolunteers || 0}
                    subtitle="active members"
                    icon={Users}
                    trend={{ value: 5, isPositive: true }}
                    iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
                    borderColor="border-l-purple-500"
                />
                <StatCard
                    title="Sessions"
                    value={statsLoading ? "..." : stats?.sessionsThisMonth || 0}
                    subtitle="this month"
                    icon={Calendar}
                    iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                    borderColor="border-l-emerald-500"
                />
                <StatCard
                    title="Avg Attendance"
                    value={`${attendanceStats?.avgAttendance || 0}%`}
                    subtitle="all sessions"
                    icon={TrendingUp}
                    trend={{ value: 2, isPositive: (attendanceStats?.avgAttendance || 0) > 70 }}
                    iconBg="bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400"
                    borderColor="border-l-orange-500"
                />
            </div>

            {/* 2. Hero RSVP Card (Second Priority) */}
            {nextSession && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    <Card className="border-l-4 border-l-primary shadow-md overflow-hidden bg-gradient-to-r from-card to-primary/5">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur">Next Session</Badge>
                                        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                                            {(nextSession as any).title || "Upcoming Session"}
                                        </h3>
                                        <div className="flex items-center gap-4 text-muted-foreground mt-2 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(nextSession.session_date), "EEEE, MMM dd")}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {nextSession.start_time?.slice(0, 5) || "TBD"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {(nextSession as any).location || "TBD"}
                                            </span>
                                        </div>
                                    </div>

                                    {(nextSession as any).rsvp_enabled ? (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center justify-center bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-2 rounded-xl border border-green-500/20 min-w-[70px]">
                                                <span className="text-2xl font-bold leading-none">{nextSession.counts.yes}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Yes</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl border border-amber-500/20 min-w-[70px]">
                                                <span className="text-2xl font-bold leading-none">{nextSession.counts.maybe}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Maybe</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center bg-red-500/10 text-red-700 dark:text-red-400 px-4 py-2 rounded-xl border border-red-500/20 min-w-[70px]">
                                                <span className="text-2xl font-bold leading-none">{nextSession.counts.no}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">No</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Badge variant="secondary">RSVP Disabled</Badge>
                                    )}
                                </div>

                                <div className="w-full md:w-auto flex flex-col gap-3">
                                    <Button
                                        size="lg"
                                        className="w-full md:w-auto shadow-lg bg-primary hover:bg-primary/90"
                                        onClick={() => handleSessionClick(nextSession.id, (nextSession as any).title)}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        View Guest List
                                    </Button>
                                    <Button variant="outline" asChild className="w-full md:w-auto bg-background/50">
                                        <Link to={`/dashboard/sessions`}>
                                            Session Details <ArrowUpRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* 3. Quick Tools (Row of Buttons) */}
            <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm" asChild>
                        <Link to="/dashboard/notices">
                            <Megaphone className="w-5 h-5 mb-1" />
                            <span className="font-semibold text-xs md:text-sm">Post Notice</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm" asChild>
                        <Link to="/dashboard/volunteers">
                            <UserPlus className="w-5 h-5 mb-1" />
                            <span className="font-semibold text-xs md:text-sm">Add Volunteer</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" asChild>
                        <Link to="/dashboard/students">
                            <GraduationCap className="w-5 h-5 mb-1" />
                            <span className="font-semibold text-xs md:text-sm">Add Student</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm" asChild>
                        <Link to="/dashboard/sessions">
                            <Plus className="w-5 h-5 mb-1" />
                            <span className="font-semibold text-xs md:text-sm">Create Session</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 4. Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Attendance Area Chart (Larger) */}
                <Card className="lg:col-span-2 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Attendance History
                        </CardTitle>
                        <CardDescription>Students & Volunteers Flow</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={attendanceStats?.chartData || []}>
                                    <defs>
                                        <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                    <Area type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#attendanceGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Volunteer Fleet Donut */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Volunteer Fleet</CardTitle>
                        <CardDescription>Status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={volunteerStatusData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ value }) => {
                                            if (value === 0) return null;
                                            return value;
                                        }}
                                        labelLine={false}
                                    >
                                        {volunteerStatusData?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 5. Recent & Upcoming Sessions List */}
            <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Recent & Upcoming Sessions
                        </CardTitle>
                        <CardDescription>Scheduled events and their RSVP status</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/dashboard/sessions">View All</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        {sessionsWithCounts && sessionsWithCounts.map((session: Session & {counts: { yes: number, maybe: number}}) => {
                            const isPast = new Date(session.session_date) < today;
                            const isNext = nextSession && session.id === nextSession.id;

                            return (
                                <motion.div
                                    key={session.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="group cursor-pointer"
                                    onClick={() => handleSessionClick(session.id, (session as any).title)}
                                >
                                    <div className={`p-4 rounded-xl border transition-all hover:shadow-sm ${isPast ? 'bg-muted/30 border-muted opacity-80' : 'bg-card hover:border-primary/50'} ${isNext ? 'border-primary/40 ring-1 ring-primary/10' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`font-semibold truncate w-3/4 transition-colors ${isPast ? 'text-muted-foreground' : 'group-hover:text-primary'}`}>
                                                {(session as any).title || "Session"}
                                            </h4>
                                            {isNext && <Badge className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">NEXT</Badge>}
                                            {isPast && <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">PAST</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2 mb-3">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(session.session_date), "MMM dd")}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.start_time?.slice(0, 5)}</span>
                                        </p>

                                        {session.rsvp_enabled ? (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`text-green-600 bg-green-50 border-green-200 ${isPast ? 'opacity-70 grayscale-[0.3]' : ''}`}>{session.counts.yes} Yes</Badge>
                                                <Badge variant="outline" className={`text-amber-600 bg-amber-50 border-amber-200 ${isPast ? 'opacity-70 grayscale-[0.3]' : ''}`}>{session.counts.maybe} Maybe</Badge>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="text-xs">Poll Off</Badge>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Slide-over Sheet for Details */}
            <SessionRSVPDetailSheet
                sessionId={selectedSessionId}
                sessionTitle={selectedSessionTitle}
                isOpen={!!selectedSessionId}
                onClose={() => setSelectedSessionId(null)}
            />
        </div>
    );
}
