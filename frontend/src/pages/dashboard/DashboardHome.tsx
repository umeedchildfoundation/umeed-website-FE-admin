import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  Calendar,
  UserPlus,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle,
  Activity,
  PieChart as PieChartIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStats, useUpcomingSessions, useAttendanceStats, useRecentEvents, useRecentNotices, useStudentGrowth, useSessionStats } from "@/hooks/useStats";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { format, isToday } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
  PieChart, Pie, Cell, Legend
} from "recharts";

import { useState, useEffect } from "react";
import { VolunteerDashboard } from "@/components/dashboard/VolunteerDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function DashboardHome() {
  const { user, role, isAdmin, volunteerStatus, volunteerId } = useAuth();

  // Stats and data fetching... 
  // (Note: AdminDashboard helps fetch its own specific data now, but we keep these if needed for logic below or legacy parts)

  const [probationStats, setProbationStats] = useState<{ count: number; isPending: boolean } | null>(null);

  useEffect(() => {
    const fetchProbationStats = async () => {
      // FIX: Check volunteerStatus from context
      if (isAdmin || !user?.email) return;

      try {
        // If status is not pending, we don't need probation stats
        if (volunteerStatus !== "pending") {
          setProbationStats(null);
          return;
        }

        if (volunteerId) {
          // 2. Get Attendance Count
          const { count, error: countError } = await api
            .from("volunteer_attendance")
            .select("*", { count: "exact", head: true })
            .eq("volunteer_id", volunteerId)
            .eq("status", "present");

          if (countError) {
            console.warn("Could not fetch attendance count (table might be missing), defaulting to 0:", countError);
            setProbationStats({ count: 0, isPending: true });
          } else {
            setProbationStats({ count: count || 0, isPending: true });
          }
        } else {
          // Status pending but no ID yet? Just show 0 progress
          setProbationStats({ count: 0, isPending: true });
        }
      } catch (err) {
        console.error("Unexpected error in fetchProbationStats:", err);
      }
    };

    fetchProbationStats();
  }, [user, role, isAdmin, volunteerStatus, volunteerId]);

  // If Admin, show the Premium Admin Dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // If Probationary Volunteer, show simplified view
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Probation Progress Card (Only for Probationary Volunteers) */}
      {probationStats?.isPending && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full relative overflow-hidden rounded-2xl shadow-lg border border-primary/20"
        >
          {/* Background Gradient & Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 z-0" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />

          <Card className="relative z-10 border-0 bg-transparent shadow-none">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">

                {/* Left Side: Progress & Status */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/5 text-primary">
                      Volunteer Probation Track
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center md:justify-start gap-2">
                      <GraduationCap className="h-8 w-8 text-primary" />
                      {12 - probationStats.count > 0 ? (
                        <span>{12 - probationStats.count} Sessions Left</span>
                      ) : (
                        <span className="text-green-600">Goal Reached! 🎉</span>
                      )}
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                      {probationStats.count === 0 && "Your journey starts here! Attend your first session to begin making an impact."}
                      {probationStats.count > 0 && probationStats.count < 6 && "Great start! Consistency is key to making a lasting difference."}
                      {probationStats.count >= 6 && probationStats.count < 12 && "You're over halfway there! Your dedication is inspiring us all."}
                      {probationStats.count >= 12 && "Incredible! You've proven your commitment. An admin will review your profile shortly."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Progress ({probationStats.count}/12)</span>
                      <span className="text-primary">{Math.min(100, Math.round((probationStats.count / 12) * 100))}%</span>
                    </div>
                    <Progress value={(probationStats.count / 12) * 100} className="h-4 rounded-full bg-secondary" indicatorClassName="bg-gradient-to-r from-primary to-accent transition-all duration-1000" />
                  </div>
                </div>

                {/* Right Side: Key Stats Panel */}
                <div className="w-full md:w-auto min-w-[200px] grid grid-cols-2 md:grid-cols-1 gap-4">
                  <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border/50 text-center shadow-sm">
                    <Calendar className="w-6 h-6 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{probationStats.count}</p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Completed</p>
                  </div>
                  <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border/50 text-center shadow-sm">
                    <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{Math.max(0, 12 - probationStats.count)}</p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Remaining</p>
                  </div>
                </div>
              </div>

              {/* Motivation Footer */}
              {probationStats.count < 12 && (
                <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    "Small acts, when multiplied by millions of people, can transform the world."
                  </p>
                  <Button size="sm" className="shadow-md" asChild>
                    <Link to="/dashboard/sessions">Find Next Session <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Volunteer Stats Dashboard */}
      {!isAdmin && !probationStats?.isPending && (
        <VolunteerDashboard />
      )}
    </div>
  );
}
