
import { motion } from "framer-motion";
import {
    Calendar,
    CheckCircle,
    Clock,
    TrendingUp,
    ArrowRight,
    Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, isToday } from "date-fns";
import { useVolunteerStats, useRecentNotices } from "@/hooks/useStats";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";

import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function VolunteerDashboard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { volunteerId } = useAuth();

    const handleRsvp = async (sessionId: string, status: 'yes' | 'no' | 'maybe') => {
        if (!volunteerId) return;

        try {
            const { error } = await api
                .from('session_rsvps')
                .upsert({
                    session_id: sessionId,
                    volunteer_id: volunteerId,
                    status: status
                }, {
                    onConflict: 'session_id, volunteer_id'
                });

            if (error) throw error;

            toast({
                title: "RSVP Updated",
                description: `You marked yourself as "${status}" for this session.`,
            });

            // Invalidate to refresh stats and UI
            queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard-stats"] });
        } catch (error) {
            console.error("Error updating RSVP:", error);
            toast({
                title: "Error",
                description: "Failed to update RSVP. Please try again.",
                variant: "destructive"
            });
        }
    };

    const { data: stats, isLoading } = useVolunteerStats(volunteerId);
    const { data: notices } = useRecentNotices(3, "internal");

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading specific stats...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Track your impact and upcoming schedule.</p>
                </div>
                <Button className="shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" asChild>
                    <Link to="/dashboard/my-sessions">
                        View All Sessions <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
            </div>

            {/* Next Session Highlight Banner - Top Priority */}
            {stats?.nextSession && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 shadow-md">
                        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 text-primary font-semibold">
                                    <Award className="w-5 h-5" />
                                    <span>Don't Miss Out!</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold">{stats.nextSession.title || "Upcoming Session"}</h3>
                                <p className="text-muted-foreground">
                                    Your next session at <span className="font-semibold text-foreground">{stats.nextSession.location}</span> is coming up on <span className="font-semibold text-foreground">{format(new Date(stats.nextSession.session_date), "EEEE, MMM dd")}</span>.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 w-full md:w-auto min-w-[300px]">
                                {stats.nextSession.rsvp_enabled && (
                                    <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 text-center">Are you attending?</p>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant={stats.nextSession.userRsvp === 'yes' ? "default" : "outline"}
                                                className={`flex-1 ${stats.nextSession.userRsvp === 'yes' ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-green-50 text-green-700 border-green-200"}`}
                                                onClick={() => handleRsvp(stats!.nextSession!.id, 'yes')}
                                            >
                                                Yes
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={stats.nextSession.userRsvp === 'maybe' ? "default" : "outline"}
                                                className={`flex-1 ${stats.nextSession.userRsvp === 'maybe' ? "bg-amber-500 hover:bg-amber-600 text-white" : "hover:bg-amber-50 text-amber-700 border-amber-200"}`}
                                                onClick={() => handleRsvp(stats!.nextSession!.id, 'maybe')}
                                            >
                                                Maybe
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={stats.nextSession.userRsvp === 'no' ? "default" : "outline"}
                                                className={`flex-1 ${stats.nextSession.userRsvp === 'no' ? "bg-destructive hover:bg-destructive/90 text-white" : "hover:bg-red-50 text-red-700 border-red-200"}`}
                                                onClick={() => handleRsvp(stats!.nextSession!.id, 'no')}
                                            >
                                                No
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <Button size="sm" variant="secondary" className="w-full bg-white/80 hover:bg-white shadow-sm" asChild>
                                    <Link to={`/dashboard/sessions/${stats.nextSession.id}`}>
                                        View Full Details <ArrowRight className="w-3 h-3 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {/* Card 1: Next Session (First Priority) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase">Next Session</p>
                                    {stats?.nextSession ? (
                                        <>
                                            <h3 className="text-lg md:text-xl font-bold mt-1 md:mt-2 truncate max-w-[150px]" title={stats.nextSession.location}>
                                                {format(new Date(stats.nextSession.session_date), "MMM dd")}
                                            </h3>
                                            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">
                                                {stats.nextSession.location}
                                            </p>
                                        </>
                                    ) : (
                                        <h3 className="text-base md:text-lg font-medium mt-1 md:mt-2 text-muted-foreground">No upcoming</h3>
                                    )}
                                </div>
                                <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <Calendar className="h-4 w-4 md:h-6 md:w-6 text-orange-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Card 2: Total Sessions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase">Sessions</p>
                                    <h3 className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats?.totalSessionsAttended || 0}</h3>
                                </div>
                                <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Card 3: Attendance Rate (New) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase">Rate</p>
                                    <h3 className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats?.attendanceRate || 0}%</h3>
                                </div>
                                <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                    <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-accent" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Card 4: Active Days (New) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase">Day Streak</p>
                                    <h3 className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stats?.activeDays || 0}</h3>
                                </div>
                                <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Clock className="h-4 w-4 md:h-6 md:w-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Charts & Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Chart - Spans 2 columns */}
                <motion.div
                    className="lg:col-span-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="h-full shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Attendance History
                            </CardTitle>
                            <CardDescription>Your attendance consistency over the last 6 months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {stats?.attendanceChartData && stats.attendanceChartData.some(d => d.total > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.attendanceChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}%`}
                                                domain={[0, 100]}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '8px',
                                                }}
                                                formatter={(value: number) => [`${value}%`, "Attendance Rate"]}
                                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="attendance"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={3}
                                                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                        <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
                                        <p>Not enough data yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Notices / Next Actions - Spans 1 column */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Notices</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {notices?.length ? (
                                        notices.map((notice) => (
                                            <div key={notice.id} className="p-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-medium text-sm line-clamp-1">{notice.title}</h4>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded">
                                                        {format(new Date(notice.published_date), "MMM dd")}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {notice.description}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <p className="text-sm">No new notices</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 border-t text-center">
                                    <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                                        <Link to="/dashboard/notices">View All Notices</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
