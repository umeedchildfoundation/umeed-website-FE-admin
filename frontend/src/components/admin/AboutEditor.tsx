/**
 * About Page Editor Components
 * 
 * Editor components for Team Members and Values on the About page.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSiteContent } from "@/contexts/SiteContentContext";
import type { TeamMember, ValueCard } from "@/lib/contentService";

// Available icons for value cards
const availableIcons = [
    { value: 'Heart', label: 'Heart' },
    { value: 'Users', label: 'Users' },
    { value: 'Award', label: 'Award' },
    { value: 'Star', label: 'Star' },
    { value: 'Target', label: 'Target' },
    { value: 'Lightbulb', label: 'Lightbulb' },
    { value: 'BookOpen', label: 'Book' },
    { value: 'Globe', label: 'Globe' },
    { value: 'Sparkles', label: 'Sparkles' },
    { value: 'Shield', label: 'Shield' },
];

/**
 * Team Members Editor
 */
export function TeamMembersEditor() {
    const { getTeamMembers, setTeamMembers } = useSiteContent();
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getTeamMembers().then(setMembers).finally(() => setLoading(false));
    }, [getTeamMembers]);

    const addMember = () => {
        const newMember: TeamMember = {
            id: `team-${Date.now()}`,
            name: 'New Member',
            role: 'Role Title',
            initials: 'NM',
        };
        setMembers([...members, newMember]);
    };

    const updateMember = (index: number, field: keyof TeamMember, value: string) => {
        const updated = [...members];
        updated[index] = { ...updated[index], [field]: value };
        // Auto-generate initials from name
        if (field === 'name') {
            const parts = value.trim().split(' ');
            const initials = parts.map(p => p[0]?.toUpperCase() || '').join('').slice(0, 2);
            updated[index].initials = initials || 'XX';
        }
        setMembers(updated);
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setTeamMembers(members);
            toast({ title: "Team members saved successfully!" });
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
        return <div className="flex items-center justify-center h-32">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Edit the leadership team shown on the About page
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={addMember}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save All'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {members.map((member, index) => (
                    <Card key={member.id} className="relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                        <span className="text-sm font-semibold text-white">{member.initials}</span>
                                    </div>
                                    <CardTitle className="text-base">{member.name}</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeMember(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={member.name}
                                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Role</Label>
                                    <Input
                                        value={member.role}
                                        onChange={(e) => updateMember(index, 'role', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Initials</Label>
                                    <Input
                                        value={member.initials}
                                        onChange={(e) => updateMember(index, 'initials', e.target.value.toUpperCase().slice(0, 2))}
                                        maxLength={2}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {members.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No team members yet. Click "Add Member" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Values Editor
 */
export function ValuesEditor() {
    const { getValues, setValues } = useSiteContent();
    const { toast } = useToast();
    const [values, setValuesState] = useState<ValueCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getValues().then(setValuesState).finally(() => setLoading(false));
    }, [getValues]);

    const addValue = () => {
        const newValue: ValueCard = {
            id: `value-${Date.now()}`,
            icon: 'Star',
            title: 'New Value',
            description: 'Description of this value...',
        };
        setValuesState([...values, newValue]);
    };

    const updateValue = (index: number, field: keyof ValueCard, value: string) => {
        const updated = [...values];
        updated[index] = { ...updated[index], [field]: value };
        setValuesState(updated);
    };

    const removeValue = (index: number) => {
        setValuesState(values.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setValues(values);
            toast({ title: "Values saved successfully!" });
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
        return <div className="flex items-center justify-center h-32">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Core Values</h3>
                    <p className="text-sm text-muted-foreground">
                        Edit the values shown on the About page
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={addValue}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Value
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save All'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {values.map((value, index) => (
                    <Card key={value.id} className="relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    <CardTitle className="text-base">Value {index + 1}: {value.title}</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeValue(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Icon</Label>
                                    <Select
                                        value={value.icon}
                                        onValueChange={(v) => updateValue(index, 'icon', v)}
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableIcons.map((icon) => (
                                                <SelectItem key={icon.value} value={icon.value}>
                                                    {icon.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={value.title}
                                        onChange={(e) => updateValue(index, 'title', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={value.description}
                                    onChange={(e) => updateValue(index, 'description', e.target.value)}
                                    rows={2}
                                    className="mt-1.5"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {values.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No values yet. Click "Add Value" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Vision & Mission Editor (text fields)
 */
export function VisionMissionEditor() {
    const { getContent, setContent } = useSiteContent();
    const { toast } = useToast();
    const [vision, setVision] = useState('');
    const [mission, setMission] = useState('');
    const [story, setStory] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setVision(getContent('about', 'vision', 'A world where every child, regardless of their socioeconomic background, has equal access to quality education and the opportunity to fulfill their dreams.'));
        setMission(getContent('about', 'mission', 'To provide free, quality education to underprivileged children every Sunday through dedicated volunteers, fostering academic excellence, personal growth, and community development.'));
        setStory(getContent('about', 'story', 'In 2020, a group of five friends noticed children in their neighborhood who couldn\'t afford quality education. What started as informal weekend tutoring sessions in a small community hall quickly grew into something more.'));
    }, [getContent]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setContent('about', 'vision', vision);
            await setContent('about', 'mission', mission);
            await setContent('about', 'story', story);
            toast({ title: "Vision & Mission saved successfully!" });
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Vision, Mission & Story</h3>
                    <p className="text-sm text-muted-foreground">
                        Edit the main text content on the About page
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save All'}
                </Button>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Our Vision</Label>
                    <Textarea
                        value={vision}
                        onChange={(e) => setVision(e.target.value)}
                        rows={3}
                        className="mt-1.5"
                        placeholder="Our vision statement..."
                    />
                </div>
                <div>
                    <Label>Our Mission</Label>
                    <Textarea
                        value={mission}
                        onChange={(e) => setMission(e.target.value)}
                        rows={3}
                        className="mt-1.5"
                        placeholder="Our mission statement..."
                    />
                </div>
                <div>
                    <Label>Our Story</Label>
                    <Textarea
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                        rows={4}
                        className="mt-1.5"
                        placeholder="How it all began..."
                    />
                </div>
            </div>
        </div>
    );
}
