
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, FileText, Trash2, ArrowRight, Pencil, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SUBJECT_OPTIONS = [
    "Mathematics", "English", "Science", "Hindi",
    "Social Studies", "Computer Basics", "Art & Craft", "General Knowledge"
];

const LANGUAGE_OPTIONS = ["English", "Gujarati", "Hindi", "Others"];

export interface VolunteerFormData {
    id?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    age: string;
    gender: string;
    occupation: string;
    skills: string[];
    preferred_languages: string[];
    availability: string;
    status: "pending" | "approved" | "rejected" | "inactive";
    documents?: { name: string; url: string; type: string }[];
}

export const emptyVolunteer: VolunteerFormData = {
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    gender: "",
    occupation: "",
    skills: [],
    preferred_languages: [],
    availability: "",
    status: "pending",
    documents: [],
};

interface VolunteerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: VolunteerFormData) => Promise<void>;
    initialData?: any;
    isLoading?: boolean;
}

export function VolunteerForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading,
}: VolunteerFormProps) {
    const [formData, setFormData] = useState<VolunteerFormData>(emptyVolunteer);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("personal");
    const [editingDocIndex, setEditingDocIndex] = useState<number | null>(null);
    const [editingDocName, setEditingDocName] = useState("");

    // Reset form when opening or changing initialData
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Helper to safely parse array or string to array
                const parseArray = (val: any): string[] => {
                    if (Array.isArray(val)) return val;
                    if (typeof val === 'string' && val.trim() !== '') return val.split(',').map((s: string) => s.trim());
                    return [];
                };

                setFormData({
                    id: initialData.id,
                    name: initialData.name || "",
                    email: initialData.email || "",
                    phone: initialData.phone || "",
                    address: initialData.address || "",
                    age: initialData.age ? String(initialData.age) : "",
                    gender: initialData.gender || "",
                    occupation: initialData.occupation || "",
                    skills: parseArray(initialData.skills),
                    preferred_languages: parseArray(initialData.preferred_languages),
                    availability: initialData.availability || "",
                    status: initialData.status || "pending",
                    documents: initialData.documents || [],
                });
            } else {
                setFormData(emptyVolunteer);
            }
            setActiveTab("personal");
        }
    }, [isOpen, initialData]);

    // Auto-focus first field when tab changes
    useEffect(() => {
        if (activeTab === "professional") {
            setTimeout(() => {
                document.getElementById("occupation")?.focus();
            }, 50);
        }
    }, [activeTab]);

    const handleInputChange = (field: keyof VolunteerFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
    }

    const toggleArrayItem = (field: 'skills' | 'preferred_languages', item: string) => {
        const currentItems = formData[field] || [];
        const newItems = currentItems.includes(item)
            ? currentItems.filter(i => i !== item)
            : [...currentItems, item];
        setFormData({ ...formData, [field]: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    }

    const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files?.length) return;

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Check if storage is available
            if (!api.storage) {
                toast.warning("Storage not configured");
                return;
            }

            const { error: uploadError } = await api.storage
                .from("documents")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = api.storage.from("documents").getPublicUrl(filePath);

            const newDoc = {
                name: file.name,
                url: data.publicUrl,
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
        toast.success("Document removed");
    };

    const startEditingDoc = (index: number) => {
        const doc = formData.documents?.[index];
        if (doc) {
            setEditingDocIndex(index);
            setEditingDocName(doc.name);
        }
    };

    const saveDocName = () => {
        if (editingDocIndex === null) return;
        const newDocs = [...(formData.documents || [])];
        if (newDocs[editingDocIndex] && editingDocName.trim()) {
            newDocs[editingDocIndex] = { ...newDocs[editingDocIndex], name: editingDocName.trim() };
            setFormData({ ...formData, documents: newDocs });
            toast.success("Document renamed");
        }
        setEditingDocIndex(null);
        setEditingDocName("");
    };

    const cancelEditDoc = () => {
        setEditingDocIndex(null);
        setEditingDocName("");
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        if (activeTab === "personal") setActiveTab("professional");
        else if (activeTab === "professional") setActiveTab("documents");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData?.id ? "Edit Volunteer" : "Add New Volunteer"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-md overflow-x-auto flex-nowrap hidden sm:grid sm:grid-cols-3">
                            <TabsTrigger value="personal">Personal Info</TabsTrigger>
                            <TabsTrigger value="professional">Professional</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>
                        {/* Mobile Tabs */}
                        <TabsList className="w-full justify-start h-12 p-1 bg-muted rounded-md overflow-x-auto flex sm:hidden no-scrollbar">
                            <TabsTrigger value="personal" className="flex-shrink-0">Personal Info</TabsTrigger>
                            <TabsTrigger value="professional" className="flex-shrink-0">Professional</TabsTrigger>
                            <TabsTrigger value="documents" className="flex-shrink-0">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input id="age" type="number" value={formData.age} onChange={(e) => handleInputChange("age", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v as any)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea id="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="professional" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Occupation</Label>
                                    <Input id="occupation" value={formData.occupation} onChange={(e) => handleInputChange("occupation", e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Subjects You Can Teach</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {SUBJECT_OPTIONS.map(subject => (
                                            <Badge
                                                key={subject}
                                                variant={formData.skills.includes(subject) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 px-3 py-1 text-sm font-normal"
                                                onClick={() => toggleArrayItem('skills', subject)}
                                            >
                                                {subject}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Preferred Languages</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {LANGUAGE_OPTIONS.map(lang => (
                                            <Badge
                                                key={lang}
                                                variant={formData.preferred_languages.includes(lang) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 px-3 py-1 text-sm font-normal"
                                                onClick={() => toggleArrayItem('preferred_languages', lang)}
                                            >
                                                {lang}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="availability">Availability</Label>
                                    <Select value={formData.availability} onValueChange={(v) => handleInputChange("availability", v)}>
                                        <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Every Sunday">Every Sunday</SelectItem>
                                            <SelectItem value="Alternate Sundays">Alternate Sundays</SelectItem>
                                            <SelectItem value="Events Only">During Events Only</SelectItem>
                                            <SelectItem value="Flexible">Flexible / On Call</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                            <div className="p-2 bg-primary/10 rounded-md shrink-0">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            {editingDocIndex === idx ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Input
                                                        value={editingDocName}
                                                        onChange={(e) => setEditingDocName(e.target.value)}
                                                        className="h-8 text-sm"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && saveDocName()}
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={saveDocName}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditDoc}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="truncate">
                                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground uppercase">{doc.type}</p>
                                                </div>
                                            )}
                                        </div>
                                        {editingDocIndex !== idx && (
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => startEditingDoc(idx)} className="h-8 w-8">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => removeDocument(idx)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
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
                        {activeTab === "documents" ? (
                            <Button type="submit" disabled={isLoading || uploading}>
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {initialData?.id ? "Update" : "Add"} Volunteer
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleNext}>
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
