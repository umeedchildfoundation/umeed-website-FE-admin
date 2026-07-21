import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../../services/sessionsApi";
import { studentsApi } from "../../services/studentsApi";
import { volunteersApi } from "../../services/volunteersApi";
import { attendanceApi } from "../../services/attendanceApi";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Check, X, Clock, HelpCircle, Save, Loader2, Calendar as CalendarIcon, User, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthContext";
import { Alert, AlertDescription } from "../../components/ui/alert";
import type { Session } from "../../types/session";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const MAX_VOLUNTEER_UPDATES = 3;

export function AttendanceMarking() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user, isAdmin } = useAuth();
    // Volunteer = anyone who is not an admin
    const isVolunteer = !isAdmin;

    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"students" | "volunteers">("students");
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch Sessions
    const { data: sessions } = useQuery({
        queryKey: ["sessions-list"],
        queryFn: () => sessionsApi.getAll(),
    });

    // Auto-select most recent session
    useEffect(() => {
        if (sessions?.length && !selectedSessionId) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [sessions, selectedSessionId]);

    // Fetch update count for this volunteer + session
    const { data: updateCount = 0, refetch: refetchUpdateCount } = useQuery({
        queryKey: ["attendance-update-count", selectedSessionId, user?.id],
        enabled: !!selectedSessionId && !!user?.id && isVolunteer,
        queryFn: async () => {
            // attendance_update_log endpoint not yet in BE, default to 0
            return 0;
        },
    });

    const remainingUpdates = MAX_VOLUNTEER_UPDATES - updateCount;
    const canUpdate = !isVolunteer || remainingUpdates > 0;

    // Fetch Users (Students/Volunteers)
    const { data: people, isLoading: peopleLoading } = useQuery({
        queryKey: ["attendance-people", activeTab],
        queryFn: async () => {
            if (activeTab === "students") {
                const data = await studentsApi.getAll();
                return data.map((d: any) => ({ id: d.id, name: d.full_name, type: "student", avatar: null }));
            } else {
                const data = await volunteersApi.getAll();
                return data.map((d: any) => ({ id: d.id, name: d.name, type: "volunteer", avatar: d.profile_picture }));
            }
        },
    });

    // Fetch Existing Attendance
    const { data: existingAttendance, isLoading: attendanceLoading } = useQuery({
        queryKey: ["existing-attendance", selectedSessionId, activeTab],
        enabled: !!selectedSessionId,
        queryFn: async () => {
            const userCol = activeTab === "students" ? "student_id" : "volunteer_id";
            const data = activeTab === "students"
                ? await attendanceApi.getStudentAttendance({ session_id: selectedSessionId })
                : await attendanceApi.getVolunteerAttendance({ session_id: selectedSessionId });
            const map: Record<string, AttendanceStatus> = {};
            data.forEach((d: any) => { map[d[userCol]] = d.status; });
            return map;
        },
    });

    // Sync state with gathered attendance
    useEffect(() => {
        if (existingAttendance) {
            setAttendance(existingAttendance);
            setHasChanges(false);
        } else {
            setAttendance({});
        }
    }, [existingAttendance]);

    const handleStatusChange = (userId: string, status: AttendanceStatus) => {
        if (!canUpdate) {
            toast({
                title: "Limit Reached",
                description: "Sorry, you cannot make any more updates. Please contact your admin for changes.",
                variant: "destructive"
            });
            return;
        }
        setAttendance(prev => ({ ...prev, [userId]: status }));
        setHasChanges(true);
    };

    const markAll = (status: AttendanceStatus) => {
        if (!canUpdate) {
            toast({
                title: "Limit Reached",
                description: "Sorry, you cannot make any more updates. Please contact your admin for changes.",
                variant: "destructive"
            });
            return;
        }
        if (!people) return;
        const newAttendance = { ...attendance };
        people.forEach(p => {
            newAttendance[p.id] = status;
        });
        setAttendance(newAttendance);
        setHasChanges(true);
    };

    // Filter Logic
    const filteredPeople = useMemo(() => {
        if (!people) return [];
        return people.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [people, searchTerm]);

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!selectedSessionId) throw new Error("No session selected");

            // Check limit again on save attempt
            if (!canUpdate) {
                // Throw specific error to be caught by onError
                throw new Error("Sorry, you cannot make any more updates. Please contact your admin for changes.");
            }

            const entries = Object.entries(attendance);
            await Promise.all(
                entries.map(([userId, status]) =>
                    activeTab === "students"
                        ? attendanceApi.markStudentAttendance({ student_id: userId, session_id: selectedSessionId, status })
                        : attendanceApi.markVolunteerAttendance({ volunteer_id: userId, session_id: selectedSessionId, status }),
                ),
            );
        },
        onSuccess: () => {
            const updatesLeft = isVolunteer ? remainingUpdates - 1 : null;
            toast({
                title: "Attendance saved",
                description: updatesLeft !== null
                    ? `Saved! You have ${updatesLeft} update${updatesLeft !== 1 ? 's' : ''} left for this session.`
                    : `Updated records for ${Object.keys(attendance).length} people.`
            });
            setHasChanges(false);
            refetchUpdateCount();
            queryClient.invalidateQueries({ queryKey: ["existing-attendance"] });
            queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
        },
        onError: (error: any) => {
            toast({
                title: "Cannot Save",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    return (
        <div className="space-y-6">
            {/* Volunteer Update Limit Warning - REMOVED per request */}
            {isVolunteer && selectedSessionId && remainingUpdates > 0 && (
                <Alert variant={remainingUpdates === 1 ? "default" : undefined} className={cn(
                    "border",
                    remainingUpdates > 1 && "border-blue-200 bg-blue-50 text-blue-800",
                    remainingUpdates === 1 && "border-amber-200 bg-amber-50 text-amber-800"
                )}>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="flex items-center gap-2">
                        <span>
                            You have <strong>{remainingUpdates}</strong> update{remainingUpdates !== 1 ? 's' : ''} remaining for this session.
                        </span>
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-secondary/30 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 w-full">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Session</label>
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger className="w-full md:w-[300px] bg-background">
                                <SelectValue placeholder="Select a session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions?.map((s: Session) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {format(new Date(s.session_date), "MMM dd, yyyy")} • {s.location}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        onClick={() => saveMutation.mutate()}
                        // Enable button even if limit reached so they can click and see the toast
                        disabled={!hasChanges || saveMutation.isPending || !selectedSessionId}
                        className={cn("w-full md:w-auto gap-2 transition-all", hasChanges ? "animate-pulse-subtle" : "")}
                    >
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSearchTerm(""); }} className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    {/* Only show tabs if admin, otherwise just show Students label */}
                    {!isVolunteer ? (
                        <TabsList className="grid w-full md:w-[300px] grid-cols-2">
                            <TabsTrigger value="students" className="gap-2">
                                <User className="w-4 h-4" /> Students
                            </TabsTrigger>
                            <TabsTrigger value="volunteers" className="gap-2">
                                <User className="w-4 h-4" /> Volunteers
                            </TabsTrigger>
                        </TabsList>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Students Attendance</span>
                        </div>
                    )}

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search names..."
                            className="pl-9 h-10"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap mr-2">Quick Mark:</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" onClick={() => markAll("present")}>
                        Mark All Present
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => markAll("absent")}>
                        Mark All Absent
                    </Button>
                </div>

                <TabsContent value="students" className="mt-0">
                    <AttendanceList
                        people={filteredPeople}
                        attendance={attendance}
                        loading={peopleLoading || attendanceLoading}
                        onStatusChange={handleStatusChange}
                    />
                </TabsContent>
                {!isVolunteer && (
                    <TabsContent value="volunteers" className="mt-0">
                        <AttendanceList
                            people={filteredPeople}
                            attendance={attendance}
                            loading={peopleLoading || attendanceLoading}
                            onStatusChange={handleStatusChange}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

function AttendanceList({ people, attendance, loading, onStatusChange }: any) {
    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading list...</div>;
    }

    if (!people?.length) {
        return <div className="p-8 text-center text-muted-foreground border rounded-lg bg-secondary/10">No records found matching your search.</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {people.map((person: any) => {
                const status = attendance[person.id];
                return (
                    <div key={person.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={person.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${person.name}`} className="object-cover" />
                                <AvatarFallback>{person.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{person.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">{person.type}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <StatusButton
                                active={status === "present"}
                                type="present"
                                onClick={() => onStatusChange(person.id, "present")}
                            />
                            <StatusButton
                                active={status === "late"}
                                type="late"
                                onClick={() => onStatusChange(person.id, "late")}
                            />
                            <StatusButton
                                active={status === "excused"}
                                type="excused"
                                onClick={() => onStatusChange(person.id, "excused")}
                            />
                            <StatusButton
                                active={status === "absent"}
                                type="absent"
                                onClick={() => onStatusChange(person.id, "absent")}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function StatusButton({ active, type, onClick }: { active: boolean, type: AttendanceStatus, onClick: () => void }) {
    const config = {
        present: { icon: Check, color: "text-green-600", bg: "bg-green-100", border: "border-green-200", hover: "hover:bg-green-50", activeRing: "ring-green-500" },
        absent: { icon: X, color: "text-red-600", bg: "bg-red-100", border: "border-red-200", hover: "hover:bg-red-50", activeRing: "ring-red-500" },
        late: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200", hover: "hover:bg-amber-50", activeRing: "ring-amber-500" },
        excused: { icon: HelpCircle, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200", hover: "hover:bg-blue-50", activeRing: "ring-blue-500" },
    }[type];

    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-md border transition-all duration-200",
                active
                    ? `${config.bg} ${config.color} ${config.border} ring-2 ring-offset-1 ${config.activeRing}`
                    : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary",
            )}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
