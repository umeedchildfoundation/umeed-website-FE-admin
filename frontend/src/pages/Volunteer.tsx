import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Clock, Users, BookOpen, CheckCircle } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const benefits = [
  {
    icon: Heart,
    title: "Make a Difference",
    description: "Directly impact children's lives and their future prospects.",
  },
  {
    icon: Clock,
    title: "Flexible Commitment",
    description: "Just a few hours every Sunday fits into any schedule.",
  },
  {
    icon: Users,
    title: "Join a Community",
    description: "Connect with like-minded individuals passionate about education.",
  },
  {
    icon: BookOpen,
    title: "Develop Skills",
    description: "Enhance your communication, leadership, and teaching abilities.",
  },
];

const subjects = [
  "Mathematics",
  "English",
  "Science",
  "Hindi",
  "Social Studies",
  "Computer Basics",
  "Art & Craft",
  "General Knowledge",
];

const languageOptions = ["English", "Gujarati", "Hindi", "Others"];

const Volunteer = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
    occupation: "",
    skills: [] as string[],
    languages: [] as string[],
    availability: "",
    motivation: "",
  });

  // Scroll to hash section on page load
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        // Delay to allow page to render before scrolling
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const skills_subjects = formData.skills;
      const preferred_languages = formData.languages;

      const { error } = await api.from("volunteer_applications").insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        address: formData.address,
        occupation: formData.occupation || null,
        availability: formData.availability || null,
        motivation: formData.motivation || null,
        skills_subjects: skills_subjects.length ? skills_subjects : null,
        preferred_languages: preferred_languages.length ? preferred_languages : null,
        status: "pending",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  if (submitted) {
    return (
      <Section className="min-h-[70vh] flex items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="w-20 h-20 rounded-full bg-umeed-sage/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-umeed-sage" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Thank You for Applying!
          </h2>
          <p className="text-muted-foreground mb-6">
            We've received your volunteer application. Our team will review it
            and get back to you within 3-5 business days.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Submit Another Application
          </Button>
        </motion.div>
      </Section>
    );
  }

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
              Join Our Team
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Become a Volunteer
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Share your knowledge and make a lasting impact on underprivileged
              children's lives. No prior teaching experience required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <Section className="bg-background">
        <SectionHeader
          badge="Why Volunteer"
          title="What You'll Gain"
          description="Volunteering with UMEED is a rewarding experience that enriches both the giver and receiver."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-card rounded-2xl border border-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Application Form */}
      <Section id="application-form" className="bg-muted scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 bg-card rounded-2xl border border-border"
          >
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Volunteer Application Form
            </h2>
            <p className="text-muted-foreground mb-8">
              Fill out the form below and we'll get in touch with you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="16"
                    max="80"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    placeholder="25"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address / City *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Your area and city"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) =>
                      setFormData({ ...formData, occupation: e.target.value })
                    }
                    placeholder="e.g., Student, IT Professional"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Preferred Languages</Label>
                  <div className="flex flex-wrap gap-3">
                    {languageOptions.map((lang) => {
                      const isSelected = formData.languages.includes(lang);
                      return (
                        <div
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 select-none border shadow-sm
                            ${isSelected
                              ? "bg-umeed-yellow text-slate-900 border-umeed-yellow shadow-md transform scale-105"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }
                          `}
                        >
                          {lang}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <Label>Subjects You Can Teach</Label>
                <div className="flex flex-wrap gap-3">
                  {subjects.map((subject) => {
                    const isSelected = formData.skills.includes(subject);
                    return (
                      <div
                        key={subject}
                        onClick={() => toggleSkill(subject)}
                        className={`
                          px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 select-none border shadow-sm
                          ${isSelected
                            ? "bg-umeed-yellow text-slate-900 border-umeed-yellow shadow-md transform scale-105"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }
                        `}
                      >
                        {subject}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label>Availability *</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) =>
                    setFormData({ ...formData, availability: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every-sunday">Every Sunday</SelectItem>
                    <SelectItem value="alternate-sundays">
                      Alternate Sundays
                    </SelectItem>
                    <SelectItem value="once-month">Once a month</SelectItem>
                    <SelectItem value="special-events">
                      Special events only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Motivation */}
              <div className="space-y-2">
                <Label htmlFor="motivation">
                  Why do you want to volunteer? *
                </Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) =>
                    setFormData({ ...formData, motivation: e.target.value })
                  }
                  placeholder="Share your motivation for joining UMEED..."
                  rows={4}
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </motion.div>
        </div>
      </Section>
    </>
  );
};

export default Volunteer;
