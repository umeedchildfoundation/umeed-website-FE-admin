
import { useState } from "react";
import { Sheet, SheetContent } from "../../components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { format } from "date-fns";
import { User, MapPin, Phone, School, FileText, Calendar, UserCheck, BookOpen, Users, Activity, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "../../services/studentsApi";
import { attendanceApi } from "../../services/attendanceApi";
import { volunteersApi } from "../../services/volunteersApi";
import apiClient from "../../lib/apiClient";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import type { Student } from "../../types/student";

interface StudentProfileSheetProps {
    student: StudentExtended | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (student: StudentExtended) => void;
}

type StudentExtended = Student & {id: string, image_url: string, location_code: string, enrollment_date: string}

export function StudentProfileSheet({ student, isOpen, onClose, onEdit }: StudentProfileSheetProps) {
    const queryClient = useQueryClient();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    if (!student) return null;

    const handleDelete = async (s: StudentExtended) => {
        try {
            await studentsApi.remove(s.id);
            await queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student deleted successfully");
            onClose();
        } catch (error: any) {
            toast.error("Delete failed: " + error.message);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0">
                <div className="h-full flex flex-col">
                    {/* Header Profile Section */}
                    <div className="bg-primary/5 p-6 border-b">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Avatar className="h-20 w-20 border-2 border-background shadow-lg text-2xl">
                                    <AvatarImage src={student.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${student.full_name}`} />
                                    <AvatarFallback>{student.full_name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold">{student.full_name}</h2>
                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-1 text-muted-foreground">
                                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md text-foreground/80">
                                            {student.roll_number || student.id || "ID: N/A"}
                                        </span>
                                        <School className="w-4 h-4 ml-2" />
                                        <span>{student.class_grade || "N/A"}</span>
                                        <span>•</span>
                                        <span>{student.school_name || "Unknown School"}</span>
                                    </div>
                                    <Badge variant={student.status === "active" ? "default" : "secondary"} className="mt-2">
                                        {student.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                            {onEdit && (
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="sm" onClick={() => onEdit(student)} className="flex-1 sm:flex-none">
                                        <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteAlert(true)} className="flex-1 sm:flex-none">
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                        <TabsList className="w-full justify-start rounded-none border-b h-12 px-4 bg-transparent overflow-x-auto flex-nowrap shrink-0">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:underline data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap">Overview</TabsTrigger>
                            <TabsTrigger value="academic" className="data-[state=active]:bg-transparent data-[state=active]:underline data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap">Academic & Docs</TabsTrigger>
                            <TabsTrigger value="attendance" className="data-[state=active]:bg-transparent data-[state=active]:underline data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap">Attendance History</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 p-4 sm:p-6 bg-secondary/5">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                <OverviewTab student={student} />
                            </TabsContent>
                            <TabsContent value="academic" className="mt-0 space-y-6">
                                <AcademicFamilyTab student={student} />
                            </TabsContent>
                            <TabsContent value="attendance" className="mt-0 space-y-6">
                                <AttendanceHistoryTab studentId={student.id} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </SheetContent>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the student
                            <strong> {student.full_name}</strong> and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(student)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Sheet>
    );
}

function OverviewTab({ student }: { student: StudentExtended }) {
    // Determine Age
    const age = student.date_of_birth
        ? new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()
        : "Unknown";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Personal Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-primary/70" />
                            <span className="font-semibold">Gender:</span> {student.gender || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-primary/70" />
                            <span className="font-semibold">DOB:</span> {student.date_of_birth ? format(new Date(student.date_of_birth), "PPP") : "N/A"} ({age} yrs)
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-primary/70" />
                            <span className="font-semibold">Area:</span> {student.area_locality || "N/A"}
                        </div>
                    </CardContent>
                </Card>

                <StatsSummary studentId={student.id} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for recent activity logic if we had an activity log */}
                    <div className="text-sm text-muted-foreground italic">
                        Recently marked present in session at {student.area_locality || "Center"}.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsSummary({ studentId }: { studentId: string }) {
    const { data: stats } = useQuery({
        queryKey: ["student-stats", studentId],
        queryFn: async () => {
            const data = await attendanceApi.getStudentAttendance({ student_id: studentId });
            const total = data?.length || 0;
            const present = data?.filter((r: {status: string}) => r.status === 'present').length || 0;
            const rate = total ? Math.round((present / total) * 100) : 0;
            return { total, present, rate };
        }
    });

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm">Attendance Rate</span>
                    <span className={`text-lg font-bold ${stats?.rate && stats.rate > 80 ? "text-green-600" : "text-amber-600"}`}>
                        {stats?.rate || 0}%
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span>Sessions Attended</span>
                    <span className="font-semibold">{stats?.present || 0} / {stats?.total || 0}</span>
                </div>
            </CardContent>
        </Card>
    );
}


function AcademicFamilyTab({ student }: { student: StudentExtended}) {
    return (
        <div className="space-y-6">
            {/* Family Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> Family Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-secondary/10 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Parent/Guardian</p>
                            <p className="font-semibold text-lg">{student.parent_guardian_name || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Number</p>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-600" />
                                <p className="font-medium">{student.parent_contact_number || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Academic Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" /> Academic Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">School</p>
                            <p className="font-medium">{student.school_name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Class</p>
                            <p className="font-medium">{student.class_grade || "N/A"}</p>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Enrollment Date</p>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{student.enrollment_date ? format(new Date(student.enrollment_date), "PPP") : "N/A"}</span>
                        </div>
                    </div>
                    {student.notes && (
                        <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                            <p className="text-sm font-semibold text-yellow-800 mb-1">Notes / Observations</p>
                            <p className="text-sm text-yellow-700">{student.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Documentation Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Documentation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {student.documents && student.documents.length > 0 ? (
                        <div className="space-y-2">
                            {student.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-md bg-secondary/5 hover:bg-secondary/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{doc.type}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6 border-2 border-dashed rounded-lg bg-secondary/5 text-muted-foreground">
                            <p className="text-sm">No documents uploaded yet.</p>
                            <p className="text-xs mt-1">Upload birth certificate, ID proof, etc. via Edit.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function AttendanceHistoryTab({ studentId }: { studentId: string }) {
    const { data: history, isLoading } = useQuery({
        queryKey: ["student-attendance-history", studentId],
        queryFn: async () => {
            const attendanceData = await attendanceApi.getStudentAttendance({ student_id: studentId });
            if (!attendanceData.length) return [];

            const sessionIds = attendanceData.map((a: any) => a.session_id);

            // Fetch assignments for this student
            const assignmentMap: Record<string, string> = {};
            try {
                const { data: assignments } = await apiClient.get("/attendance/assignments", {
                    params: { student_id: studentId },
                });
                if (assignments?.length) {
                    const allVols = await volunteersApi.getAll();
                    const volNameMap: Record<string, string> = {};
                    allVols.forEach((v: any) => { volNameMap[v.id] = v.name; });

                    assignments.forEach((a: any) => {
                        if (sessionIds.includes(a.session_id)) {
                            assignmentMap[a.session_id] = volNameMap[a.volunteer_id] || "Unknown Volunteer";
                        }
                    });
                }
            } catch {
                // assignments endpoint might not exist — continue without it
            }

            return attendanceData.map((record: any) => ({
                date: record.sessions?.session_date ?? null,
                location: record.sessions?.location ?? null,
                status: record.status,
                assignedVolunteer: assignmentMap[record.session_id] || "No specific volunteer"
            }));
        }
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading history...</div>;

    if (!history?.length) return <div className="p-8 text-center text-muted-foreground">No attendance history found.</div>;

    return (
        <div className="space-y-4">
            {history.map((record: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 mb-2 sm:mb-0">
                        <div className="p-2 bg-primary/10 rounded-full text-primary mt-1">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-base">{record.date ? format(new Date(record.date), "PPP") : "Unknown Date"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" /> {record.location || "Unknown Location"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                            <p className="text-xs text-muted-foreground">Mentored by</p>
                            <p className="text-sm font-medium flex items-center gap-1 justify-end">
                                <UserCheck className="w-3 h-3 text-purple-600" />
                                {record.assignedVolunteer}
                            </p>
                        </div>
                        <Badge variant={record.status === "present" ? "default" : "destructive"} className="uppercase">
                            {record.status}
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    );
}
