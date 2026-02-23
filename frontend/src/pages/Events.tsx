import { motion } from "framer-motion";
import { Calendar, MapPin, Image as ImageIcon } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";

type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date?: string;
  date?: string;
  location: string | null;
  tags: string[] | null;
  event_media?: { url: string; media_type: string }[];
};

const Events = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["events-public"],
    queryFn: async () => {
      const { data, error } = await api
        .from("events")
        .select("*, event_media(url, media_type)")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as PublicEvent[];
    },
  });
  const events = data || [];
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
              Events & Gallery
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Moments of Joy
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Explore our events and celebrations that bring our community together
              and create lasting memories for our students.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Events List */}
      <Section>
        <SectionHeader
          badge="Events"
          title="Upcoming & Past Events"
          description="From festive celebrations to educational workshops, every event is designed to inspire and educate."
        />
        <div className="grid md:grid-cols-2 gap-8">
          {isLoading ? (
            <div className="col-span-2 text-center text-muted-foreground">Loading events...</div>
          ) : events.length ? (
            events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card transition-shadow"
              >
                {/* Placeholder Image Area */}
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 relative flex items-center justify-center">
                  {event.event_media?.[0]?.url ? (
                    <img src={event.event_media[0].url} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ImageIcon className="w-8 h-8" />
                      <span className="font-medium">Gallery</span>
                    </div>
                  )}
                  {(() => {
                    const d = (event.event_date || event.date) as string;
                    const upcoming = d ? new Date(d) >= new Date() : false;
                    return upcoming ? (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary text-primary-foreground">Upcoming</Badge>
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(event.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{(() => {
                        const d = (event.event_date || event.date) as string;
                        return d ? format(new Date(d), "PPP") : "";
                      })()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location || ""}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center text-muted-foreground">No events yet</div>
          )}
        </div>
      </Section>

      {/* Gallery Preview */}
      <Section className="bg-muted">
        <SectionHeader
          badge="Gallery"
          title="Captured Memories"
          description="A glimpse into the joyful moments shared at UMEED."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["/gallery/memory1.jpg", "/gallery/memory2.jpg", "/gallery/memory3.jpg", "/gallery/memory4.jpg", "/gallery/memory5.jpg", "/gallery/memory6.jpg", "/gallery/memory7.jpg", "/gallery/memory8.jpg"].map((src, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
            >
              <img
                src={src}
                alt={`Captured Memory ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
};

export default Events;
