import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useSiteContent } from "../../contexts/SiteContentContext";

export function Footer() {
  const { getContent } = useSiteContent();

  // Dynamic content
  const siteName = getContent('branding', 'site_name', 'UMEED');
  const logo = getContent('branding', 'logo', '/logo.png');
  const footerText = getContent('branding', 'footer_text', 'Empowering underprivileged children through education, one Sunday at a time.');

  const address = getContent('contact', 'address', 'Near NID, Paldi, Ahmedabad');
  const phone = getContent('contact', 'phone', '+91 98765 43210');
  const email = getContent('contact', 'email', 'hello@umeedfoundation.org');

  const facebookUrl = getContent('social', 'facebook', '');
  const instagramUrl = getContent('social', 'instagram', '');
  const twitterUrl = getContent('social', 'twitter', '');
  const youtubeUrl = getContent('social', 'youtube', '');

  const socialLinks = [
    { url: facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: twitterUrl, icon: Twitter, label: 'Twitter' },
    { url: youtubeUrl, icon: Youtube, label: 'Youtube' },
  ].filter(link => link.url); // Only show links that are configured

  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={logo}
                  alt={`${siteName} Logo`}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-display text-xl font-semibold">{siteName}</span>
            </Link>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
              {footerText}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {["About Us", "Our Programs", "Events & Gallery", "Notices", "Contact"].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                    className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Get Involved */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-display text-lg font-semibold mb-4">Get Involved</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/volunteer#application-form"
                  className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm"
                >
                  Become a Volunteer
                </Link>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm"
                >
                  Partner With Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm"
                >
                  Spread the Word
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-display text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-sidebar-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{phone}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{email}</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="border-t border-sidebar-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sidebar-foreground/60 text-sm">
            © {new Date().getFullYear()} OpenVoid Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-sidebar-foreground/60">
            <a href="#" className="hover:text-sidebar-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-sidebar-primary transition-colors">
              Terms of Service
            </a>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by{" "}
              <a
                href="https://instagram.com/openvoid.labs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sidebar-primary transition-colors font-medium"
              >
                OpenVoid Labs
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
