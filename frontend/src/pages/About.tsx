import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Target, Eye, Heart, Users, Award, Calendar, Star, Lightbulb, BookOpen, Globe, Sparkles, Shield } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { useSiteContent } from "@/contexts/SiteContentContext";
import type { TeamMember, ValueCard } from "@/lib/contentService";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Users, Award, Star, Target, Lightbulb, BookOpen, Globe, Sparkles, Shield, Eye
};

const defaultValues: ValueCard[] = [
  { id: 'value-1', icon: 'Heart', title: 'Compassion', description: 'We approach every child with love, understanding, and patience.' },
  { id: 'value-2', icon: 'Users', title: 'Community', description: 'Together, volunteers and families create a supportive learning environment.' },
  { id: 'value-3', icon: 'Award', title: 'Excellence', description: 'We strive for quality education that empowers children to reach their potential.' },
];

const defaultTeam: TeamMember[] = [
  { id: 'team-1', name: 'Rahul Sharma', role: 'Founder & President', initials: 'RS' },
  { id: 'team-2', name: 'Priya Patel', role: 'Education Director', initials: 'PP' },
  { id: 'team-3', name: 'Amit Kumar', role: 'Volunteer Coordinator', initials: 'AK' },
  { id: 'team-4', name: 'Neha Gupta', role: 'Community Outreach', initials: 'NG' },
];

const About = () => {
  const { getContent, getTeamMembers, getValues } = useSiteContent();
  const [team, setTeam] = useState<TeamMember[]>(defaultTeam);
  const [values, setValuesState] = useState<ValueCard[]>(defaultValues);

  useEffect(() => {
    getTeamMembers().then(setTeam).catch(() => setTeam(defaultTeam));
    getValues().then(setValuesState).catch(() => setValuesState(defaultValues));
  }, [getTeamMembers, getValues]);

  // Dynamic text content
  const vision = getContent('about', 'vision',
    'A world where every child, regardless of their socioeconomic background, has equal access to quality education and the opportunity to fulfill their dreams.'
  );
  const mission = getContent('about', 'mission',
    'To provide free, quality education to underprivileged children every Sunday through dedicated volunteers, fostering academic excellence, personal growth, and community development.'
  );
  const story = getContent('about', 'story',
    'In 2020, a group of five friends noticed children in their neighborhood who couldn\'t afford quality education. What started as informal weekend tutoring sessions in a small community hall quickly grew into something more.'
  );

  return (
    <>
      {/* Hero Section */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-warm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
              About Us
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Our Story of Hope
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              UMEED Children Foundation was born from a simple belief: every child
              deserves access to quality education, regardless of their background.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <Calendar className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="font-display text-2xl font-semibold text-foreground">
                    Est. 2020
                  </p>
                  <p className="text-muted-foreground">Started with 5 volunteers</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-umeed-yellow/30 rounded-2xl -z-10" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
              How It All Began
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{story}</p>
              <p>
                Word spread, more volunteers joined, and more children came seeking
                knowledge. Today, UMEED has grown into a family of over 50 volunteers,
                teaching 200+ children every Sunday.
              </p>
              <p>
                The name "UMEED" means "hope" in Hindi—and that's exactly what we aim
                to give every child who walks through our doors.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Vision & Mission */}
      <Section className="bg-muted">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 bg-card rounded-2xl border border-border"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
              Our Vision
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {vision}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 bg-card rounded-2xl border border-border"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-xl mb-4">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-4">
              Our Mission
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {mission}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Values */}
      <Section>
        <SectionHeader
          badge="Our Values"
          title="What Guides Us"
          description="Our core values shape everything we do and how we serve our community."
        />
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const IconComponent = iconMap[value.icon] || Heart;
            return (
              <motion.div
                key={value.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                  <IconComponent className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Team */}
      <Section className="bg-muted">
        <SectionHeader
          badge="Our Team"
          title="Meet the Leaders"
          description="Dedicated individuals driving our mission forward."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-hero flex items-center justify-center mb-4 shadow-glow">
                <span className="font-display text-2xl font-semibold text-primary-foreground">
                  {member.initials}
                </span>
              </div>
              <h4 className="font-semibold text-foreground">{member.name}</h4>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
};

export default About;
