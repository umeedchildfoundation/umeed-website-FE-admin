/**
 * Card Editor Component
 * 
 * Reusable component for editing feature cards and impact cards in site customization.
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
import { Plus, Trash2, Save, GripVertical, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSiteContent } from "@/contexts/SiteContentContext";
import type { FeatureCard, ImpactCard } from "@/lib/contentService";
import { storageService } from "@/lib/storageService";

// Available icons for feature cards
const availableIcons = [
    { value: 'BookOpen', label: 'Book Open' },
    { value: 'Users', label: 'Users' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Lightbulb', label: 'Lightbulb' },
    { value: 'Star', label: 'Star' },
    { value: 'Target', label: 'Target' },
    { value: 'Sparkles', label: 'Sparkles' },
    { value: 'GraduationCap', label: 'Graduation Cap' },
    { value: 'HandHeart', label: 'Hand Heart' },
    { value: 'Globe', label: 'Globe' },
];

// Available color schemes
const availableColors = [
    { value: 'bg-primary/10 text-primary', label: 'Primary Blue' },
    { value: 'bg-accent/10 text-accent', label: 'Accent' },
    { value: 'bg-umeed-yellow/20 text-umeed-orange', label: 'Yellow/Orange' },
    { value: 'bg-umeed-sage/20 text-umeed-sage', label: 'Sage Green' },
    { value: 'bg-red-100 text-red-600', label: 'Red' },
    { value: 'bg-purple-100 text-purple-600', label: 'Purple' },
    { value: 'bg-emerald-100 text-emerald-600', label: 'Emerald' },
];

/**
 * Feature Cards Editor
 */
export function FeatureCardsEditor() {
    const { getFeatureCards, setFeatureCards } = useSiteContent();
    const { toast } = useToast();
    const [cards, setCards] = useState<FeatureCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getFeatureCards().then(setCards).finally(() => setLoading(false));
    }, [getFeatureCards]);

    const addCard = () => {
        const newCard: FeatureCard = {
            id: `feature-${Date.now()}`,
            icon: 'Star',
            title: 'New Feature',
            description: 'Description of this feature...',
            color: 'bg-primary/10 text-primary',
        };
        setCards([...cards, newCard]);
    };

    const updateCard = (index: number, field: keyof FeatureCard, value: string) => {
        const updated = [...cards];
        updated[index] = { ...updated[index], [field]: value };
        setCards(updated);
    };

    const removeCard = (index: number) => {
        setCards(cards.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setFeatureCards(cards);
            toast({ title: "Feature cards saved successfully!" });
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
                    <h3 className="text-lg font-semibold">Feature Cards</h3>
                    <p className="text-sm text-muted-foreground">
                        Edit the "What We Do" section cards on the homepage
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={addCard}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Card
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save All'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {cards.map((card, index) => (
                    <Card key={card.id} className="relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    <CardTitle className="text-base">Card {index + 1}</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeCard(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Icon</Label>
                                    <Select
                                        value={card.icon}
                                        onValueChange={(v) => updateCard(index, 'icon', v)}
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
                                    <Label>Color Scheme</Label>
                                    <Select
                                        value={card.color}
                                        onValueChange={(v) => updateCard(index, 'color', v)}
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableColors.map((color) => (
                                                <SelectItem key={color.value} value={color.value}>
                                                    {color.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={card.title}
                                        onChange={(e) => updateCard(index, 'title', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={card.description}
                                    onChange={(e) => updateCard(index, 'description', e.target.value)}
                                    rows={2}
                                    className="mt-1.5"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {cards.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No feature cards yet. Click "Add Card" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Impact Cards Editor
 */
export function ImpactCardsEditor() {
    const { getImpactCards, setImpactCards } = useSiteContent();
    const { toast } = useToast();
    const [cards, setCards] = useState<ImpactCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getImpactCards().then(setCards).finally(() => setLoading(false));
    }, [getImpactCards]);

    const addCard = () => {
        const newCard: ImpactCard = {
            id: `impact-${Date.now()}`,
            title: 'New Impact Story',
            description: 'Describe the impact...',
            image: '/placeholder.svg',
        };
        setCards([...cards, newCard]);
    };

    const updateCard = (index: number, field: keyof ImpactCard, value: string) => {
        const updated = [...cards];
        updated[index] = { ...updated[index], [field]: value };
        setCards(updated);
    };

    const removeCard = (index: number) => {
        setCards(cards.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (index: number, file: File) => {
        try {
            const fileName = `impact_${Date.now()}.${file.name.split('.').pop()}`;
            const { data, error } = await storageService.from('site-images').upload(fileName, file);

            if (error) throw new Error(error.message);

            const { data: urlData } = storageService.from('site-images').getPublicUrl(data?.path || fileName);
            updateCard(index, 'image', urlData.publicUrl);

            toast({ title: "Image uploaded successfully" });
        } catch (err) {
            toast({
                title: "Upload failed",
                description: (err as Error).message,
                variant: "destructive"
            });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setImpactCards(cards);
            toast({ title: "Impact cards saved successfully!" });
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
                    <h3 className="text-lg font-semibold">Impact Stories Cards</h3>
                    <p className="text-sm text-muted-foreground">
                        Edit the "See the Difference You Make" section cards
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={addCard}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Card
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save All'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {cards.map((card, index) => (
                    <Card key={card.id} className="relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    <CardTitle className="text-base">Card {index + 1}</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeCard(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={card.title}
                                        onChange={(e) => updateCard(index, 'title', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Image</Label>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Input
                                            value={card.image}
                                            onChange={(e) => updateCard(index, 'image', e.target.value)}
                                            placeholder="Image URL"
                                            className="flex-1"
                                        />
                                        <label htmlFor={`impact-img-${index}`}>
                                            <Button variant="outline" size="icon" asChild>
                                                <span><Upload className="w-4 h-4" /></span>
                                            </Button>
                                        </label>
                                        <input
                                            id={`impact-img-${index}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(index, file);
                                            }}
                                        />
                                    </div>
                                    {card.image && card.image !== '/placeholder.svg' && (
                                        <div className="mt-2 w-24 h-16 rounded-lg overflow-hidden border">
                                            <img
                                                src={card.image}
                                                alt={card.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={card.description}
                                    onChange={(e) => updateCard(index, 'description', e.target.value)}
                                    rows={3}
                                    className="mt-1.5"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {cards.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No impact cards yet. Click "Add Card" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
