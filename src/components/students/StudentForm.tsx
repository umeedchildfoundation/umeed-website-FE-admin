import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../components/ui/dialog";
import { mediaApi } from "../../services/mediaApi";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Loader2, Upload, Hash, FileText, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { LOCATIONS } from "../../lib/studentConfig";
import { Badge } from "../../components/ui/badge";
import type { Student } from "../../types/student";

export interface StudentFormData extends Student {
    id?: string;
    image_url: string;
    location_code: string;
}

export const emptyStudent: StudentFormData = {
    full_name: "",
    gender: "",
    date_of_birth: "",
    school_name: "",
    class_grade: "",
    parent_guardian_name: "",
    parent_contact_number: "",
    address: "",
    area_locality: "",
    status: "active",
    notes: "",
    image_url: "",
    location_code: "",
    roll_number: "",
    documents: [],
};

interface StudentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StudentFormData) => Promise<void>;
    initialData?: StudentFormData;
    isLoading?: boolean;
    isSuperAdmin?: boolean;
}

export function StudentForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading,
    isSuperAdmin,
}: StudentFormProps) {
    const [formData, setFormData] = useState<StudentFormData>(
        initialData || emptyStudent
    );
    const [uploading, setUploading] = useState(false);

    const isEditing = !!initialData?.id;
    // const canEditRollNumber = isSuperAdmin && isEditing;

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return; // Just return silently if no file selected
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `${Math.random()}.${fileExt}`;

            const uploaded = await mediaApi.upload(file, filePath);
            const publicUrl = mediaApi.getPublicUrl(uploaded.url);
            setFormData((prev) => ({ ...prev, image_url: publicUrl }));
            toast.success("Image uploaded successfully!");
        } catch (error: any) {
            // Graceful failure - image is optional
            toast.warning("Image upload unavailable. You can continue without a photo.");
            console.warn("Upload error:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (field: keyof StudentFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing && !formData.location_code) {
            toast.error("Please select a location");
            return;
        }
        await onSubmit(formData);
    }

    const [activeTab, setActiveTab] = useState("personal");

    const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files?.length) return;

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const uploaded = await mediaApi.upload(file, filePath);
            const publicUrl = mediaApi.getPublicUrl(uploaded.url);
            const newDoc = {
                name: file.name,
                url: publicUrl,
                type: fileExt || "file"
            };

            const currentDocs = formData.documents || [];
            setFormData({ ...formData, documents: [...currentDocs, newDoc] });
            toast.success("Document uploaded");

        } catch (error: any) {
            toast.error("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeDocument = (index: number) => {
        const newDocs = [...(formData.documents || [])];
        newDocs.splice(index, 1);
        setFormData({ ...formData, documents: newDocs });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {initialData?.id ? "Edit Student" : "Add New Student"}
                        {initialData?.roll_number && (
                            <Badge variant="secondary" className="font-mono text-sm">
                                <Hash className="w-3 h-3 mr-1" />
                                {initialData.roll_number}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-4 py-4">
                        <div className="relative group cursor-pointer">
                            <Avatar className="w-24 h-24 border-2 border-border">
                                <AvatarImage src={formData.image_url} />
                                <AvatarFallback className="text-2xl">{formData.full_name?.substring(0, 2).toUpperCase() || "ST"}</AvatarFallback>
                            </Avatar>
                            <label htmlFor="picture-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                            </label>
                            <input
                                id="picture-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">Click to upload profile picture</p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-md overflow-x-auto flex-nowrap hidden sm:grid sm:grid-cols-3">
                            <TabsTrigger value="personal">Personal Info</TabsTrigger>
                            <TabsTrigger value="academic">Academic & Address</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>
                        {/* Mobile Tabs (scrollable) */}
                        <TabsList className="w-full justify-start h-12 p-1 bg-muted rounded-md overflow-x-auto flex sm:hidden no-scrollbar">
                            <TabsTrigger value="personal" className="flex-shrink-0">Personal Info</TabsTrigger>
                            <TabsTrigger value="academic" className="flex-shrink-0">Academic</TabsTrigger>
                            <TabsTrigger value="documents" className="flex-shrink-0">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input id="name" value={formData.full_name} onChange={(e) => handleInputChange("full_name", e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input id="dob" type="date" value={formData.date_of_birth} onChange={(e) => handleInputChange("date_of_birth", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parent">Parent/Guardian Name</Label>
                                    <Input id="parent" value={formData.parent_guardian_name} onChange={(e) => handleInputChange("parent_guardian_name", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact">Parent Contact</Label>
                                    <Input id="contact" value={formData.parent_contact_number} onChange={(e) => handleInputChange("parent_contact_number", e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="academic" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <Select value={formData.location_code} onValueChange={(v) => handleInputChange("location_code", v)} disabled={isEditing && !isSuperAdmin}>
                                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                                        <SelectContent>
                                            {LOCATIONS.map((loc) => (
                                                <SelectItem key={loc.code} value={loc.code}>{loc.name} ({loc.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="class">Class/Grade</Label>
                                    <Input id="class" value={formData.class_grade} onChange={(e) => handleInputChange("class_grade", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school">School Name</Label>
                                    <Input id="school" value={formData.school_name} onChange={(e) => handleInputChange("school_name", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">Area/Locality</Label>
                                    <Input id="area" value={formData.area_locality} onChange={(e) => handleInputChange("area_locality", e.target.value)} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v as "active" | "inactive")}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-4 pt-4">
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleDocumentUpload}
                                    disabled={uploading}
                                />
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Click to upload documents (Optional)</p>
                                <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                            </div>

                            <div className="space-y-2">
                                {formData.documents?.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-primary/10 rounded-md">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{doc.type}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeDocument(idx)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(!formData.documents || formData.documents.length === 0) && (
                                    <p className="text-center text-sm text-muted-foreground py-4">No documents attached.</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || uploading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {initialData?.id ? "Update" : "Add"} Student
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

