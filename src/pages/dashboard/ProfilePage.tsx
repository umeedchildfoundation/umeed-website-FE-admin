
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../components/ui/dialog";
import { Pencil, Loader2, FileText, Briefcase, Clock, Lock } from "lucide-react";
import { authApi } from "../../services/authApi";
import { volunteersApi } from "../../services/volunteersApi";
import { attendanceApi } from "../../services/attendanceApi";
import { mediaApi } from "../../services/mediaApi";
import { VolunteerForm, type VolunteerFormData } from "../../components/volunteers/VolunteerForm";
import { ImageCropDialog } from "../../components/profile/ImageCropDialog";
import type { CustomError } from "../../types/common";

export default function ProfilePage() {
    const { user, role, volunteerId } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string>("");
    const [viewingDoc, setViewingDoc] = useState<{ name: string; url: string } | null>(null);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        avatarUrl: "",
        volunteerId: "",
    });

    const [volunteerData, setVolunteerData] = useState<VolunteerFormData | null>(null);
    const [volunteerStatus, setVolunteerStatus] = useState<string>("approved");
    const [attendanceCount, setAttendanceCount] = useState(0);

    // Password Change State
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({
                title: "Passwords do not match",
                description: "New password and confirmation must match.",
                variant: "destructive"
            });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters.",
                variant: "destructive"
            });
            return;
        }

        setPasswordLoading(true);
        try {
            await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            toast({ title: "Password changed successfully" });
            setChangePasswordOpen(false);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
          const err = error as CustomError
            toast({
                title: "Change password failed",
                description: err.message || "Could not change password.",
                variant: "destructive"
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user, volunteerId]);

    const fetchProfileData = async () => {
        setFetching(true);
        try {
            const basicData = {
                fullName: user?.fullName || "",
                email: user?.email || "",
                phone: "",
                location: "",
                bio: "",
                avatarUrl: user?.avatarUrl || "",
                volunteerId: "",
            };

            if (volunteerId) {
                try {
                    const volData = await volunteersApi.getById(volunteerId) as any;
                    basicData.fullName = volData.name || basicData.fullName;
                    basicData.phone = volData.phone || basicData.phone;
                    basicData.location = volData.address || basicData.location;
                    basicData.bio = volData.occupation || basicData.bio;
                    basicData.volunteerId = volData.volunteer_id || "";

                    setVolunteerData({
                        id: volData.id,
                        name: volData.name,
                        email: volData.email,
                        phone: volData.phone,
                        address: volData.address,
                        age: volData.age,
                        gender: volData.gender,
                        occupation: volData.occupation,
                        skills: volData.skills || [],
                        preferred_languages: volData.preferred_languages || [],
                        availability: volData.availability,
                        status: volData.status,
                        documents: volData.documents || [],
                        attendance_count: volData?.attendance_count ?? 0
                    });

                    setVolunteerStatus(volData.status || "approved");

                    // Fetch attendance count for probation tracker
                    const attendanceData = await attendanceApi.getVolunteerAttendance({ volunteer_id: volunteerId });
                    setAttendanceCount(attendanceData.filter((a: any) => a.status === "present").length);
                } catch {
                    // Volunteer not found or fetch failed — continue with basic data
                }
            }
            setFormData(basicData);
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            setImageToCrop(reader.result as string);
            setCropDialogOpen(true);
        };

        reader.readAsDataURL(file);
        // Reset input so same file can be selected again
        event.target.value = '';
    };

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        try {
            setUploadingAvatar(true);

            const filePath = `avatar_${user?.id || 'unknown'}_${Date.now()}.jpg`;
            const uploaded = await mediaApi.upload(croppedImageBlob as File, filePath);
            const publicUrl = mediaApi.getPublicUrl(uploaded.url);

            if (volunteerId) {
                await volunteersApi.update(volunteerId, { profile_picture: publicUrl } as any);
            }

            await authApi.updateMe({ avatarUrl: publicUrl });

            // Force reload to ensure all components get the new image
            window.location.reload();

            setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
            toast({ title: "Profile picture updated" });

        } catch (error) {
          const err = error as CustomError
            console.error("Avatar upload error:", error);
            toast({
                title: "Upload failed",
                description: err.message || "Could not upload profile picture.",
                variant: "destructive"
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleVolunteerUpdate = async (data: VolunteerFormData) => {
        setLoading(true);
        try {
            const { id, ...rest } = data;
            if (rest.email) rest.email = rest.email.trim().toLowerCase();
            void id;

            await volunteersApi.update(volunteerId!, {
                name: rest.name,
                email: rest.email,
                phone: rest.phone,
                address: rest.address,
                age: rest.age ? Number(rest.age) : null,
                gender: rest.gender,
                occupation: rest.occupation,
                skills: rest.skills,
                preferred_languages: rest.preferred_languages,
                availability: rest.availability,
                documents: rest.documents
            } as any);

            await authApi.updateMe({ fullName: rest.name });

            toast({ title: "Profile Updated", description: "Your details have been saved." });
            setIsEditOpen(false);
            fetchProfileData();

        } catch (error) {
          const err = error as CustomError
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleGenericSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.updateMe({ fullName: formData.fullName });
            toast({ title: "Profile updated" });
        } catch (error) {
          const err = error as CustomError
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="flex justify-center pt-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10 px-4">
            {/* Profile Header - Mobile Friendly */}
            <div className="p-4 md:p-6 mb-6 bg-card rounded-xl border shadow-sm">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                    <div className="relative group shrink-0">
                        <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
                            <AvatarImage src={formData.avatarUrl || "/placeholder-avatar.jpg"} className="object-cover" />
                            <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary">
                                {formData.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <label
                            htmlFor="avatar-upload"
                            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition shadow-lg ring-2 ring-background flex items-center justify-center"
                        >
                            {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                            />
                        </label>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-xl md:text-3xl font-bold text-foreground">
                            {formData.fullName || "User"}
                        </h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                            {formData.volunteerId && (
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {formData.volunteerId}
                                </Badge>
                            )}

                            {/* Role Badge Logic: Show only the highest privilege */}
                            {role?.includes("super_admin") ? (
                                <Badge variant="default" className="bg-primary hover:bg-primary/90">Super Admin</Badge>
                            ) : role?.includes("admin") ? (
                                <Badge variant="default">Admin</Badge>
                            ) : (
                                <Badge variant="secondary">Volunteer</Badge>
                            )}
                        </div>
                    </div>

                    {volunteerId && (
                        <div className="shrink-0 w-full md:w-auto">
                            <Button onClick={() => setIsEditOpen(true)} size="default" className="w-full md:w-auto">
                                <Briefcase className="w-4 h-4 mr-2" />
                                <span className="hidden md:inline">Manage Profile</span>
                                <span className="md:hidden">Edit Profile</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Probation Tracker - Separate Card */}
            {volunteerId && volunteerStatus === "pending" && (
                <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <CardTitle className="text-base text-amber-800 dark:text-amber-200">Probation Period</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-amber-700 dark:text-amber-300">Sessions Attended</span>
                                <span className="text-lg font-bold text-amber-800 dark:text-amber-200">{attendanceCount} / 12</span>
                            </div>
                            <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-4">
                                <div
                                    className="bg-amber-500 h-4 rounded-full transition-all duration-300"
                                    style={{ width: attendanceCount > 0 ? `${(attendanceCount / 12) * 100}%` : '0%' }}
                                />
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                {attendanceCount >= 12
                                    ? "🎉 You've completed your probation! Contact an admin to get approved."
                                    : `${12 - attendanceCount} more sessions to complete your probation period.`
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Content */}
            {volunteerId && volunteerData ? (
                <div className="grid gap-6 animate-fade-in">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>About Me</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground text-sm">Email</Label>
                                        <p className="text-sm break-all">{volunteerData.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-sm">Phone</Label>
                                        <p className="text-sm">{volunteerData.phone || "N/A"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-sm">Location</Label>
                                        <p className="text-sm">{volunteerData.address || "N/A"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-sm">Age</Label>
                                        <p className="text-sm">{volunteerData.age || "N/A"}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="text-muted-foreground text-sm">Occupation</Label>
                                        <p className="text-sm">{volunteerData.occupation || "N/A"}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground mb-2 block text-sm">Skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {volunteerData.skills?.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                                        {!volunteerData.skills?.length && <span className="text-sm text-muted-foreground">No skills listed</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {volunteerData.documents?.map((doc, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 bg-muted rounded-md text-sm">
                                            <FileText className="w-4 h-4 text-primary shrink-0" />
                                            <button
                                                onClick={() => setViewingDoc(doc)}
                                                className="truncate hover:underline flex-1 text-xs text-left"
                                            >
                                                {doc.name}
                                            </button>
                                        </div>
                                    ))}
                                    {!volunteerData.documents?.length && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                    Use "Manage Profile" above to upload or manage documents
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-primary" />
                                    Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" onClick={() => setChangePasswordOpen(true)}>
                                    Change Password
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <VolunteerForm
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        initialData={volunteerData}
                        onSubmit={handleVolunteerUpdate}
                        isLoading={loading}
                    />

                    <ImageCropDialog
                        isOpen={cropDialogOpen}
                        onClose={() => setCropDialogOpen(false)}
                        imageSrc={imageToCrop}
                        onCropComplete={handleCropComplete}
                    />

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
                </div>
            ) : (

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleGenericSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bio</Label>
                                        <Input value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(true)}>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Change Password
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )
            }


            {/* Change Password Dialog */}
            <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={passwordLoading}>
                                {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Change Password
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
