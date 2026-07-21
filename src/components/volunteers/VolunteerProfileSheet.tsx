
import { useState } from "react";
import { Sheet, SheetContent } from "../../components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { format } from "date-fns";
import { User, MapPin, Phone, Mail, Briefcase, Award, Calendar, Clock, Activity, Languages, FileText, RotateCcw, Trash2, Pencil, CheckCircle2, Check, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { volunteersApi } from "../../services/volunteersApi";
import { attendanceApi } from "../../services/attendanceApi";
import { mediaApi } from "../../services/mediaApi";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { ImageCropDialog } from "../../components/profile/ImageCropDialog";
import { Input } from "../../components/ui/input";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { generateVolunteerId, getVolunteerSequentialNumber } from "../../lib/volunteerConfig";
import type { Volunteer } from "../../types/volunteer";

// Define locally to match VolunteersPage or import if moved to types

interface VolunteerProfileSheetProps {
    volunteer: Volunteer | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (volunteer: Volunteer) => void;
}

export function VolunteerProfileSheet({ volunteer, isOpen, onClose, onEdit }: VolunteerProfileSheetProps) {
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const queryClient = useQueryClient();
    const { isSuperAdmin } = useAuth();

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string>("");

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            setImageToCrop(reader.result as string);
            setCropDialogOpen(true);
        };

        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        try {
            setUploadingAvatar(true);
            const fileExt = 'jpg';
            const filePath = `${volunteer?.id || 'unknown'}/${Date.now()}.${fileExt}`;

            const uploaded = await mediaApi.upload(croppedImageBlob as File, filePath);
            const publicUrl = mediaApi.getPublicUrl(uploaded.url);

            await volunteersApi.update(volunteer!.id, { profile_picture: publicUrl });

            // Try to update auth metadata if user_id linked (best effort)
            if (volunteer?.user_id) {
                // Admin API to update other user? Only possible with service role.
                // Supabase Client here is likely public/anon/user role. 
                // Admin cannot update another user's metadata easily without Edge Function.
                // We will skip auth metadata update for now and rely on listeners or just DB.
            }

            await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
            toast.success("Profile picture updated");

        } catch (error: any) {
            console.error("Avatar upload error:", error);
            toast.error("Upload failed: " + error.message);
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (!volunteer) return null;

    const statusConfig = {
        approved: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
        pending: { label: "Probation", className: "bg-amber-100 text-amber-700 border-amber-200" },
        rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
        inactive: { label: "Inactive", className: "bg-slate-100 text-slate-700 border-slate-200" },
    };

    const handleRevertToProbation = async () => {
        try {
            await volunteersApi.update(volunteer.id, { status: 'pending' } as any);
            await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
            toast.success("Volunteer reverted to probation status");
            onClose();
        } catch (error: any) {
            toast.error("Failed to update status: " + error.message);
        }
    };

    const handleSkipProbation = async () => {
        try {
            const updateData: any = { status: 'approved' };

            // Check if ID is missing, if so, generate it
            if (!volunteer.volunteer_id) {
                const allVols = await volunteersApi.getAll();
                let maxSeq = 0;
                if (allVols) {
                    allVols.forEach((v: any) => {
                        if (v.volunteer_id) {
                            const seq = getVolunteerSequentialNumber(v.volunteer_id);
                            if (seq > maxSeq) maxSeq = seq;
                        }
                    });
                }
                updateData.volunteer_id = generateVolunteerId(maxSeq);

                // If joined_at is missing, set it now
                if (!volunteer.joined_at) {
                    updateData.joined_at = new Date().toISOString();
                }
            }

            await volunteersApi.update(volunteer.id, updateData as any);
            await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
            toast.success("Volunteer approved (Probation Skipped)");
            onClose();
        } catch (error: any) {
            toast.error("Failed to skip probation: " + error.message);
        }
    };

    const handleDelete = async () => {
        try {
            await volunteersApi.remove(volunteer.id);
            await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
            toast.success("Volunteer deleted successfully");
            onClose();
        } catch (error: any) {
            toast.error("Delete failed: " + error.message);
        }
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0">
                    <div className="h-full flex flex-col">
                        {/* Header Profile Section */}
                        <div className="bg-primary/5 p-6 border-b">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="relative group">
                                        <Avatar className="h-20 w-20 border-2 border-background shadow-lg text-2xl">
                                            <AvatarImage src={volunteer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${volunteer.name}`} className="object-cover" />
                                            <AvatarFallback>{volunteer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {isSuperAdmin && (
                                            <label
                                                htmlFor="admin-avatar-upload"
                                                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition shadow-md ring-2 ring-background flex items-center justify-center transform hover:scale-105"
                                                title="Upload Photo (Super Admin)"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                <input
                                                    id="admin-avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAvatarUpload}
                                                    disabled={uploadingAvatar}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{volunteer.name}</h2>
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-1 text-muted-foreground text-sm">
                                            <Mail className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate max-w-[200px] sm:max-w-none">{volunteer.email || "No Email"}</span>
                                            <span className="text-muted-foreground/40">•</span>
                                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md shrink-0">
                                                {volunteer.volunteer_id || "ID: N/A"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge variant="outline" className={statusConfig[volunteer.status]?.className || ""}>
                                                {statusConfig[volunteer.status]?.label || volunteer.status}
                                            </Badge>
                                            {volunteer.status === "pending" && (
                                                <>
                                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{volunteer.attendance_count || 0}/12</span>
                                                    <div className="flex-1 min-w-24 max-w-40 bg-amber-200 dark:bg-amber-700 rounded-full h-2 overflow-hidden">
                                                        {(volunteer.attendance_count || 0) > 0 && (
                                                            <div
                                                                className="bg-amber-500 h-2 rounded-full transition-all"
                                                                style={{ width: `${((volunteer.attendance_count || 0) / 12) * 100}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {onEdit && (
                                    <div className="flex items-center gap-1 mt-4 sm:mt-0">
                                        {volunteer.status === 'pending' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleSkipProbation}
                                                className="h-8 px-3 bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                                                title="Skip Probation"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                Skip
                                            </Button>
                                        )}
                                        {volunteer.status === 'approved' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleRevertToProbation}
                                                className="h-8 px-3 text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-200"
                                                title="Revert to Probation"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-1.5" />
                                                Revert
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(volunteer)} title="Edit Profile" className="h-8 w-8">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setShowDeleteAlert(true)} title="Delete Volunteer" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                            <TabsList className="w-full justify-start rounded-none border-b h-12 px-4 bg-transparent overflow-x-auto flex-nowrap shrink-0">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap">Overview</TabsTrigger>
                                <TabsTrigger value="professional" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap">Professional & Skills</TabsTrigger>
                                <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap">Documents</TabsTrigger>
                                <TabsTrigger value="attendance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap">Attendance History</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 p-4 sm:p-6 bg-secondary/5">
                                <TabsContent value="overview" className="mt-0 space-y-6">
                                    <OverviewTab volunteer={volunteer} />
                                </TabsContent>
                                <TabsContent value="professional" className="mt-0 space-y-6">
                                    <ProfessionalTab volunteer={volunteer} />
                                </TabsContent>
                                <TabsContent value="documents" className="mt-0 space-y-6">
                                    <DocumentsTab volunteer={volunteer} onEdit={onEdit} />
                                </TabsContent>
                                <TabsContent value="attendance" className="mt-0 space-y-6">
                                    <AttendanceHistoryTab volunteerId={volunteer.id} />
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
                                This action cannot be undone. This will permanently delete the volunteer
                                <strong> {volunteer.name}</strong> and remove their data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Sheet>

            <ImageCropDialog
                isOpen={cropDialogOpen}
                onClose={() => setCropDialogOpen(false)}
                imageSrc={imageToCrop}
                onCropComplete={handleCropComplete}
            />
        </>
    );
}

function OverviewTab({ volunteer }: { volunteer: Volunteer }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Contact & Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-primary/70" />
                            <span className="font-semibold">Phone:</span> {volunteer.phone || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-primary/70" />
                            <span className="font-semibold">Gender:</span> {volunteer.gender || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-primary/70" />
                            <span className="font-semibold">Age:</span> {volunteer.age || "N/A"} yrs
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-primary/70" />
                            <span className="font-semibold">Address:</span> {volunteer.address || "N/A"}
                        </div>
                    </CardContent>
                </Card>

                <StatsSummary volunteerId={volunteer.id} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Joining Info
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Joined on: {volunteer.joined_at ? format(new Date(volunteer.joined_at), "PPP") : "Unknown Date"}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsSummary({ volunteerId }: { volunteerId: string }) {
    const { data: stats } = useQuery({
        queryKey: ["volunteer-stats", volunteerId],
        queryFn: async () => {
            const data = await attendanceApi.getVolunteerAttendance({ volunteer_id: volunteerId });

            const total = data.length;
            const present = data.filter((r: any) => r.status === 'present').length;
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

function ProfessionalTab({ volunteer }: { volunteer: Volunteer }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" /> Professional Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-secondary/10 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Occupation</p>
                            <p className="font-semibold text-lg">{volunteer.occupation || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Availability</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                <p className="font-medium">{volunteer.availability || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" /> Skills & Languages
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {volunteer.skills && volunteer.skills.length > 0 ? (volunteer.skills).map((s, i) => (
                                <Badge key={i} variant="secondary">{s}</Badge>
                            )) : <span className="text-sm text-muted-foreground italic">No skills listed</span>}
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <Languages className="w-4 h-4" /> Languages
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {volunteer.preferred_languages && volunteer.preferred_languages.length > 0 ? (volunteer.preferred_languages).map((l, i) => (
                                <Badge key={i} variant="outline">{l}</Badge>
                            )) : <span className="text-sm text-muted-foreground italic">No languages listed</span>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function DocumentsTab({ volunteer, onEdit }: { volunteer: Volunteer; onEdit?: (volunteer: Volunteer) => void }) {
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");

    const handleRename = async (index: number) => {
        if (!volunteer.documents || !editingName.trim()) return;

        const newDocs = [...volunteer.documents];
        newDocs[index] = { ...newDocs[index], name: editingName.trim() };

        try {
            await volunteersApi.update(volunteer.id, { documents: newDocs } as any);
            toast.success("Document renamed");
            if (onEdit) {
                onEdit({ ...volunteer, documents: newDocs });
            }
        } catch {
            toast.error("Failed to rename document");
        }
        setEditingIdx(null);
        setEditingName("");
    };

    const handleDelete = async (index: number) => {
        if (!volunteer.documents) return;

        const newDocs = volunteer.documents.filter((_, i) => i !== index);

        try {
            await volunteersApi.update(volunteer.id, { documents: newDocs } as any);
            toast.success("Document deleted");
            if (onEdit) {
                onEdit({ ...volunteer, documents: newDocs });
            }
        } catch {
            toast.error("Failed to delete document");
        }
    };

    const startEditing = (index: number) => {
        setEditingIdx(index);
        setEditingName(volunteer.documents?.[index]?.name || "");
    };

    const [viewingDoc, setViewingDoc] = useState<{ name: string; url: string } | null>(null);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Documentation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {volunteer.documents && volunteer.documents.length > 0 ? (
                        <div className="space-y-2">
                            {volunteer.documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-md bg-secondary/5 hover:bg-secondary/10 transition-colors gap-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                        {editingIdx === idx ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="h-8 text-sm"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRename(idx)}
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 shrink-0" onClick={() => handleRename(idx)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditingIdx(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{doc.type}</p>
                                            </div>
                                        )}
                                    </div>
                                    {editingIdx !== idx && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="sm" onClick={() => setViewingDoc(doc)}>
                                                View
                                            </Button>
                                            {onEdit && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(idx)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6 border-2 border-dashed rounded-lg bg-secondary/5 text-muted-foreground">
                            <p className="text-sm">No documents uploaded.</p>
                            <p className="text-xs mt-1">Upload documents via Edit Profile.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Document Viewer Dialog */}
            <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
                <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-4 border-b shrink-0">
                        <DialogTitle className="truncate">{viewingDoc?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
                        {viewingDoc && (
                            viewingDoc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={viewingDoc.url} alt={viewingDoc.name} className="max-w-full max-h-full object-contain shadow-sm" />
                            ) : (
                                <iframe src={viewingDoc.url} className="w-full h-full border-0 rounded-md bg-white shadow-sm" title={viewingDoc.name} />
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AttendanceHistoryTab({ volunteerId }: { volunteerId: string }) {
    const { data: history, isLoading } = useQuery({
        queryKey: ["volunteer-attendance-history", volunteerId],
        queryFn: async () => {
            const data = await attendanceApi.getVolunteerAttendance({ volunteer_id: volunteerId });
            return data.map((record: any) => ({
                date: record.sessions?.session_date ?? null,
                location: record.sessions?.location ?? null,
                status: record.status,
            }));
        }
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading history...</div>;
    if (!history?.length) return <div className="p-8 text-center text-muted-foreground">No attendance records found.</div>;

    return (
        <div className="space-y-4">
            {history.map((record: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-lg shadow-sm">
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
                    <Badge variant={record.status === "present" ? "default" : "secondary"} className="uppercase self-start sm:self-center">
                        {record.status}
                    </Badge>
                </div>
            ))}
        </div>
    );
}
