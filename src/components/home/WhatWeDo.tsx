import { motion } from "framer-motion";
import { BookOpen, Heart, Users, Lightbulb, Star, Target, Sparkles, GraduationCap, HandHeart, Globe } from "lucide-react";
import { Section, SectionHeader } from "../../components/ui/section";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { useEffect, useState } from "react";
import type { FeatureCard } from "../../lib/contentService";

// Icon mapping from string names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Heart,
  Users,
  Lightbulb,
  Star,
  Target,
  Sparkles,
  GraduationCap,
  HandHeart,
  Globe,
};

const defaultFeatures: FeatureCard[] = [
  {
    id: 'feature-1',
    icon: 'BookOpen',
    title: "Sunday Classes",
    description: "Every Sunday, our volunteers teach children from underprivileged backgrounds, covering academics and life skills.",
    color: "bg-primary/10 text-primary",
  },
  {
    id: 'feature-2',
    icon: 'Users',
    title: "Personalized Attention",
    description: "Each volunteer is paired with a small group of students, ensuring focused, one-on-one learning.",
    color: "bg-accent/10 text-accent",
  },
  {
    id: 'feature-3',
    icon: 'Heart',
    title: "Holistic Development",
    description: "Beyond academics, we nurture creativity, confidence, and character through activities and mentorship.",
    color: "bg-umeed-yellow/20 text-umeed-orange",
  },
  {
    id: 'feature-4',
    icon: 'Lightbulb',
    title: "Community Impact",
    description: "We create lasting change by empowering children to dream big and break the cycle of poverty.",
    color: "bg-umeed-sage/20 text-umeed-sage",
  },
];

export function WhatWeDo() {
  const { getContent, getFeatureCards } = useSiteContent();
  const [features, setFeatures] = useState<FeatureCard[]>(defaultFeatures);

  useEffect(() => {
    getFeatureCards().then(setFeatures).catch(() => setFeatures(defaultFeatures));
  }, [getFeatureCards]);

  // Dynamic content with fallbacks
  const badge = getContent('whatwedo', 'badge', 'What We Do');
  const title = getContent('whatwedo', 'title', 'Education That Transforms Lives');
  const description = getContent('whatwedo', 'description',
    'Our volunteer-driven teaching program provides free quality education to underprivileged children every Sunday, creating pathways to a brighter future.'
  );

  return (
    <Section className="bg-background">
      <SectionHeader
        badge={badge}
        title={title}
        description={description}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const IconComponent = iconMap[feature.icon] || BookOpen;
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
              className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} mb-4`}
              >
                <IconComponent className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
