import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Section } from "../components/ui/section";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { contactApi } from "../services/contactApi";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await contactApi.send({ name: formData.name, email: formData.email, message: formData.message });

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Contact Us
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have questions or want to learn more about how you can help? We'd
              love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Contact Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Reach out to us through any of these channels. We typically
                respond within 24-48 hours.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Address</h4>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=National%20Institute%20of%20Design%2C%20Paldi%2C%20Ahmedabad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                  >
                    Near NID, Paldi
                    <br />
                    Ahmedabad
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Phone</h4>
                  <a
                    href="tel:+919876543210"
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-umeed-yellow/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-umeed-orange" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Email</h4>
                  <a
                    href="mailto:umeedchildfoundation@gmail.com"
                    className="text-muted-foreground text-sm hover:text-primary transition-colors break-all"
                  >
                    umeedchildfoundation@gmail.com
                  </a>
                </div>
              </div>


            </div>

            {/* Map */}
            <div className="aspect-video rounded-2xl bg-muted border border-border overflow-hidden relative">
              {/* <iframe
                width="100%"
                height="100%"
                title="Umeed Foundation Location"
                src="https://maps.google.com/maps?width=100%25&height=600&hl=en&q=National%20Institute%20of%20Design%2C%20Paldi%2C%20Ahmedabad&t=&z=15&ie=UTF8&iwloc=B&output=embed"
                className="absolute inset-0 border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              /> */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.2710669194917!2d72.56561257476996!3d23.01381741665611!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e85005c25ac85%3A0x89dfa58cfe2ec55f!2sUmeed%20child%20foundation!5e0!3m2!1sen!2sin!4v1795514092651!5m2!1sen!2sin" 
                width="100%"
                height="100%"
                title="Umeed Foundation Location"
                style={{border: 0}}
                className="absolute inset-0 border-0"
                allowFullScreen
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-8 bg-card rounded-2xl border border-border">
              <h3 className="font-display text-xl font-semibold text-foreground mb-6">
                Send us a Message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="How can we help you?"
                    rows={5}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  );
};

export default Contact;
