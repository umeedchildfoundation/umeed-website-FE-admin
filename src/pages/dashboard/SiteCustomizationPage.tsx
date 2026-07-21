/**
 * Site Customization Page
 * 
 * Admin dashboard page to edit website content without coding.
 * Accessible only by admins and super admins.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { useToast } from "../../hooks/use-toast";
import {
    Save,
    Image as ImageIcon,
    Type,
    BarChart3,
    Phone,
    Share2,
    Palette,
    RefreshCw,
    Upload,
    LayoutGrid,
    Camera,
    Users,
    ShieldAlert
} from "lucide-react";
import { mediaApi } from "../../services/mediaApi";
import { FeatureCardsEditor, ImpactCardsEditor } from "../../components/admin/CardEditor";
import { TeamMembersEditor, ValuesEditor, VisionMissionEditor } from "../../components/admin/AboutEditor";

interface ContentField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'number';
    placeholder?: string;
}

interface ContentSection {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    fields: ContentField[];
}

const sections: ContentSection[] = [
    {
        id: 'hero',
        title: 'Hero Section',
        description: 'Edit the main banner on the homepage',
        icon: ImageIcon,
        fields: [
            { key: 'tagline', label: 'Tagline Badge', type: 'text', placeholder: 'Every Sunday, We Light Up Futures' },
            { key: 'title', label: 'Main Title', type: 'text', placeholder: 'Turning Hope into' },
            { key: 'title_highlight', label: 'Highlighted Word', type: 'text', placeholder: 'Opportunity' },
            { key: 'description', label: 'Description', type: 'textarea', placeholder: 'UMEED Children Foundation empowers...' },
            { key: 'image_1', label: 'Hero Image 1', type: 'image' },
            { key: 'image_2', label: 'Hero Image 2', type: 'image' },
            { key: 'image_3', label: 'Hero Image 3', type: 'image' },
        ]
    },
    {
        id: 'stats',
        title: 'Statistics',
        description: 'Update the impact numbers shown on homepage',
        icon: BarChart3,
        fields: [
            { key: 'students_count', label: 'Students Count', type: 'text', placeholder: '200+' },
            { key: 'students_label', label: 'Students Label', type: 'text', placeholder: 'Students Taught' },
            { key: 'volunteers_count', label: 'Volunteers Count', type: 'text', placeholder: '50+' },
            { key: 'volunteers_label', label: 'Volunteers Label', type: 'text', placeholder: 'Volunteers' },
            { key: 'sessions_count', label: 'Sessions Count', type: 'text', placeholder: '100+' },
            { key: 'sessions_label', label: 'Sessions Label', type: 'text', placeholder: 'Sunday Sessions' },
        ]
    },
    {
        id: 'whatwedo',
        title: 'What We Do',
        description: 'Edit the features section content',
        icon: Type,
        fields: [
            { key: 'badge', label: 'Section Badge', type: 'text', placeholder: 'What We Do' },
            { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Education That Transforms Lives' },
            { key: 'description', label: 'Section Description', type: 'textarea', placeholder: 'Our volunteer-driven teaching program...' },
        ]
    },
    {
        id: 'contact',
        title: 'Contact Info',
        description: 'Update contact details shown in footer',
        icon: Phone,
        fields: [
            { key: 'address', label: 'Address', type: 'text', placeholder: 'Near NID, Paldi, Ahmedabad' },
            { key: 'phone', label: 'Phone Number', type: 'text', placeholder: '+91 98765 43210' },
            { key: 'email', label: 'Email Address', type: 'text', placeholder: 'hello@umeedfoundation.org' },
        ]
    },
    {
        id: 'social',
        title: 'Social Links',
        description: 'Add your social media URLs',
        icon: Share2,
        fields: [
            { key: 'facebook', label: 'Facebook URL', type: 'text', placeholder: 'https://facebook.com/...' },
            { key: 'instagram', label: 'Instagram URL', type: 'text', placeholder: 'https://instagram.com/...' },
            { key: 'twitter', label: 'Twitter/X URL', type: 'text', placeholder: 'https://twitter.com/...' },
            { key: 'youtube', label: 'YouTube URL', type: 'text', placeholder: 'https://youtube.com/...' },
        ]
    },
    {
        id: 'branding',
        title: 'Branding',
        description: 'Customize logo and site name',
        icon: Palette,
        fields: [
            { key: 'site_name', label: 'Site Name', type: 'text', placeholder: 'UMEED' },
            { key: 'logo', label: 'Logo Image', type: 'image' },
            { key: 'footer_text', label: 'Footer Description', type: 'textarea', placeholder: 'Empowering underprivileged children...' },
        ]
    },
];

export default function SiteCustomizationPage() {
    const { content, setContent, refreshContent, loading } = useSiteContent();
    const { isAdmin } = useAuth();
    const { toast } = useToast();
    const [localValues, setLocalValues] = useState<Record<string, Record<string, string>>>({});
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('hero');

    // Restrict access to admins and super admins only
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="p-4 rounded-full bg-destructive/10">
                    <ShieldAlert className="w-12 h-12 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Site Customization is only available to administrators and super administrators.
                </p>
                <Link to="/dashboard">
                    <Button variant="outline">Return to Dashboard</Button>
                </Link>
            </div>
        );
    }


    // Initialize local values from content
    useEffect(() => {
        const values: Record<string, Record<string, string>> = {};
        for (const section of sections) {
            values[section.id] = {};
            for (const field of section.fields) {
                values[section.id][field.key] = content[section.id]?.[field.key] || '';
            }
        }
        setLocalValues(values);
    }, [content]);

    const handleChange = (sectionId: string, key: string, value: string) => {
        setLocalValues(prev => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [key]: value
            }
        }));
    };

    const handleImageUpload = async (sectionId: string, key: string, file: File) => {
        try {
            const caption = `${sectionId}_${key}_${Date.now()}.${file.name.split('.').pop()}`;
            const uploaded = await mediaApi.upload(file, caption);
            handleChange(sectionId, key, mediaApi.getPublicUrl(uploaded.url));
            toast({ title: "Image uploaded successfully" });
        } catch (err) {
            toast({
                title: "Upload failed",
                description: (err as Error).message,
                variant: "destructive"
            });
        }
    };

    const handleSaveSection = async (sectionId: string) => {
        setSaving(true);
        try {
            const sectionValues = localValues[sectionId] || {};

            for (const [key, value] of Object.entries(sectionValues)) {
                await setContent(sectionId, key, value || null);
            }

            toast({ title: "Changes saved successfully!" });
        } catch (err) {
            toast({
                title: "Save failed",
                description: (err as Error).message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Site Customization</h1>
                    <p className="text-muted-foreground mt-1">
                        Edit website content, images, and settings without coding.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshContent}
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-muted/50 p-2">
                    {sections.map((section) => (
                        <TabsTrigger
                            key={section.id}
                            value={section.id}
                            className="flex items-center gap-2 data-[state=active]:bg-background"
                        >
                            <section.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{section.title}</span>
                        </TabsTrigger>
                    ))}
                    {/* Card editing tabs */}
                    <TabsTrigger
                        value="feature_cards"
                        className="flex items-center gap-2 data-[state=active]:bg-background"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">Feature Cards</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="impact_cards"
                        className="flex items-center gap-2 data-[state=active]:bg-background"
                    >
                        <Camera className="w-4 h-4" />
                        <span className="hidden sm:inline">Impact Cards</span>
                    </TabsTrigger>
                    {/* About page tab */}
                    <TabsTrigger
                        value="about_page"
                        className="flex items-center gap-2 data-[state=active]:bg-background"
                    >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">About Page</span>
                    </TabsTrigger>
                </TabsList>

                {sections.map((section) => (
                    <TabsContent key={section.id} value={section.id} className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <section.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>{section.title}</CardTitle>
                                        <CardDescription>{section.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    {section.fields.map((field) => (
                                        <div
                                            key={field.key}
                                            className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                                        >
                                            <Label htmlFor={`${section.id}-${field.key}`} className="text-sm font-medium">
                                                {field.label}
                                            </Label>

                                            {field.type === 'text' || field.type === 'number' ? (
                                                <Input
                                                    id={`${section.id}-${field.key}`}
                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                    value={localValues[section.id]?.[field.key] || ''}
                                                    onChange={(e) => handleChange(section.id, field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    className="mt-1.5"
                                                />
                                            ) : field.type === 'textarea' ? (
                                                <Textarea
                                                    id={`${section.id}-${field.key}`}
                                                    value={localValues[section.id]?.[field.key] || ''}
                                                    onChange={(e) => handleChange(section.id, field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    rows={3}
                                                    className="mt-1.5"
                                                />
                                            ) : field.type === 'image' ? (
                                                <div className="mt-1.5 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            id={`${section.id}-${field.key}`}
                                                            value={localValues[section.id]?.[field.key] || ''}
                                                            onChange={(e) => handleChange(section.id, field.key, e.target.value)}
                                                            placeholder="Image URL or upload below"
                                                            className="flex-1"
                                                        />
                                                        <label htmlFor={`${section.id}-${field.key}-upload`}>
                                                            <Button variant="outline" size="icon" asChild>
                                                                <span>
                                                                    <Upload className="w-4 h-4" />
                                                                </span>
                                                            </Button>
                                                        </label>
                                                        <input
                                                            id={`${section.id}-${field.key}-upload`}
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(section.id, field.key, file);
                                                            }}
                                                        />
                                                    </div>
                                                    {localValues[section.id]?.[field.key] && (
                                                        <div className="relative w-32 h-20 rounded-lg overflow-hidden border bg-muted">
                                                            <img
                                                                src={localValues[section.id][field.key]}
                                                                alt={field.label}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        onClick={() => handleSaveSection(section.id)}
                                        disabled={saving}
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}

                {/* Feature Cards Tab */}
                <TabsContent value="feature_cards" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <FeatureCardsEditor />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Impact Cards Tab */}
                <TabsContent value="impact_cards" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <ImpactCardsEditor />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* About Page Tab */}
                <TabsContent value="about_page" className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <VisionMissionEditor />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <ValuesEditor />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <TeamMembersEditor />
                        </CardContent>
                    </Card>
                </TabsContent>


            </Tabs>
        </div>
    );
}
