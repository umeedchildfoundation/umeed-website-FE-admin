import { motion } from "framer-motion";
import { BookOpen, Palette, Trophy, Users, Clock, MapPin } from "lucide-react";
import { Section, SectionHeader } from "../components/ui/section";

const programs = [
  {
    icon: BookOpen,
    title: "Sunday School Program",
    description:
      "Our flagship program where volunteers teach academic subjects to children every Sunday. Topics include Math, English, Science, and local language skills.",
    schedule: "Every Sunday, 10 AM - 1 PM",
    location: "Community Centers across the city",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Palette,
    title: "Creative Arts",
    description:
      "Monthly art and craft sessions to nurture creativity and self-expression. Children learn drawing, painting, and handicrafts.",
    schedule: "First Sunday of every month",
    location: "Various venues",
    color: "bg-umeed-yellow/20 text-umeed-orange",
  },
  {
    icon: Trophy,
    title: "Sports & Games",
    description:
      "Regular sports activities to promote physical fitness, teamwork, and healthy competition among our students.",
    schedule: "Quarterly sports days",
    location: "Local playgrounds",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Users,
    title: "Life Skills Workshops",
    description:
      "Sessions on communication, hygiene, financial literacy, and other essential life skills to prepare children for the future.",
    schedule: "Monthly workshops",
    location: "Community halls",
    color: "bg-umeed-sage/20 text-umeed-sage",
  },
];

const Programs = () => {
  return (
    <>
      {/* Hero */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-warm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
              Our Programs
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Education Beyond Books
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We offer comprehensive programs that nurture the mind, body, and
              spirit of every child in our care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Programs */}
      <Section>
        <div className="space-y-8">
          {programs.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 md:p-8 bg-card rounded-2xl border border-border hover:shadow-card transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div
                  className={`shrink-0 w-16 h-16 rounded-2xl ${program.color} flex items-center justify-center`}
                >
                  <program.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                    {program.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {program.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{program.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{program.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How It Works */}
      <Section className="bg-muted">
        <SectionHeader
          badge="How It Works"
          title="A Typical Sunday Session"
          description="Here's what a Sunday at UMEED looks like for our students and volunteers."
        />
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { time: "9:45 AM", title: "Arrival", desc: "Volunteers and students gather" },
            { time: "10:00 AM", title: "Opening", desc: "Prayers and announcements" },
            { time: "10:15 AM", title: "Learning", desc: "Academic sessions begin" },
            { time: "12:30 PM", title: "Closing", desc: "Review and farewell" },
          ].map((step, index) => (
            <motion.div
              key={step.time}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-6 bg-card rounded-2xl border border-border text-center"
            >
              {index < 3 && (
                <div className="hidden md:block absolute top-1/2 right-0 translate-x-1/2 w-6 h-0.5 bg-border" />
              )}
              <div className="text-sm font-medium text-primary mb-2">{step.time}</div>
              <h4 className="font-display text-lg font-semibold text-foreground mb-1">
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
};

export default Programs;
