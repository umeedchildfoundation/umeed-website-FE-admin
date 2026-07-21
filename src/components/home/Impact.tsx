import { motion } from "framer-motion";
import { Users, GraduationCap, MapPin, Calendar } from "lucide-react";
import { Section, SectionHeader } from "../../components/ui/section";

const stats = [
  {
    icon: Users,
    value: "65+",
    label: "Children",
    description: "Empowered through education",
  },
  {
    icon: GraduationCap,
    value: "40+",
    label: "Volunteers",
    description: "Dedicated to making a difference",
  },
  {
    icon: MapPin,
    value: "2",
    label: "Locations",
    description: "Serving communities across the city",
  },
  {
    icon: Calendar,
    value: "52",
    label: "Sundays/Year",
    description: "Consistent weekly sessions",
  },
];

export function Impact() {
  return (
    <Section className="bg-secondary/10 text-foreground">
      <SectionHeader
        badge="Our Impact"
        title="Measurable Change, Real Lives"
        description="Numbers tell our story of dedication and transformation. Every statistic represents real children whose lives are being changed."
        className="text-foreground [&_p]:text-muted-foreground"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
            className="relative p-6 rounded-2xl bg-card border border-border overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/30 transition-colors" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-4">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="font-display text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground mb-1">
                {stat.label}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
