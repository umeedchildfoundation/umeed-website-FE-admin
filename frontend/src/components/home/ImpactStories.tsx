import { motion } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteContent } from "@/contexts/SiteContentContext";
import { useEffect, useState } from "react";
import type { ImpactCard } from "@/lib/contentService";

const defaultStories: ImpactCard[] = [
    {
        id: 'impact-1',
        title: "Access to Education",
        description: "Your support builds outdoor classrooms where children can learn, grow, and dream of a brighter future. Every Sunday, we turn open spaces into centers of knowledge.",
        image: "/education_final.jpg",
    },
    {
        id: 'impact-2',
        title: "Nurturing Potential",
        description: "School supplies and books give every child the confidence to step into school ready to succeed. We ensure no child is left behind due to lack of resources.",
        image: "/nurturing_potential_final.jpg",
    },
    {
        id: 'impact-3',
        title: "Health & Happiness",
        description: "Nutritious meals ensure children stay healthy, full of energy, and ready to learn every single day. We believe a full stomach is the foundation for a focused mind.",
        image: "/health_happiness_final.jpg",
    },
];

export function ImpactStories() {
    const { getImpactCards } = useSiteContent();
    const [stories, setStories] = useState<ImpactCard[]>(defaultStories);

    useEffect(() => {
        getImpactCards().then(setStories).catch(() => setStories(defaultStories));
    }, [getImpactCards]);

    return (
        <Section className="bg-background">
            <SectionHeader
                badge="Real Stories"
                title="See the Difference You Make"
                description="See how your contributions are transforming lives, one child at a time."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stories.map((story, index) => (
                    <motion.div
                        key={story.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                    >
                        <Card className="h-full overflow-hidden hover:shadow-xl transition-shadow duration-300 border-none shadow-md">
                            <div className="h-48 overflow-hidden">
                                <img
                                    src={story.image}
                                    alt={story.title}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-foreground">{story.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">{story.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
