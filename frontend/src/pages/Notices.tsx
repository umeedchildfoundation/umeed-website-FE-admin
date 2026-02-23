import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Calendar } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";

type PublicNotice = {
  id: string;
  title: string;
  description: string | null;
  published_date: string | null;
  visibility: "public" | "internal";
  attachment_url?: string | null;
};

const Notices = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["notices-public"],
    queryFn: async () => {
      const { data, error } = await api
        .from("notices")
        .select("*")
        .eq("visibility", "public")
        .order("published_date", { ascending: false });
      if (error) throw error;
      return data as PublicNotice[];
    },
  });
  const notices = data || [];
  const parsePoll = (n: PublicNotice) => {
    if (!n.attachment_url) return null;
    if (!n.attachment_url.startsWith("poll:")) return null;
    try {
      const json = n.attachment_url.slice(5);
      const parsed = JSON.parse(json);
      if (!parsed?.question || !Array.isArray(parsed?.options)) return null;
      return parsed as { question: string; options: string[] };
    } catch {
      return null;
    }
  };

  const NoticePoll = ({ poll, noticeId }: { poll: { question: string; options: string[] }; noticeId: string }) => {
    const storageKey = `umeed-poll-vote-${noticeId}`;
    const [selected, setSelected] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    useEffect(() => {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        setSelected(existing);
        setHasVoted(true);
      }
    }, [storageKey]);
    const onChoose = (opt: string) => {
      setSelected(opt);
      setHasVoted(true);
      try {
        localStorage.setItem(storageKey, opt);
      } catch { }
    };
    return (
      <div className="ml-auto shrink-0 flex flex-col items-end gap-2">
        <div className="text-xs text-muted-foreground">{poll.question}</div>
        <div className="grid grid-cols-2 gap-2">
          {poll.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onChoose(opt)}
              className={`px-3 py-2 rounded-full border transition-colors ${selected === opt ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 hover:bg-secondary"
                }`}
              aria-pressed={selected === opt}
            >
              {opt}
            </button>
          ))}
        </div>
        {hasVoted ? <div className="text-xs text-muted-foreground">Thanks for voting</div> : null}
      </div>
    );
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
              Notices
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Stay Updated
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Important announcements and updates from UMEED Children Foundation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Notices List */}
      <Section>
        <div className="max-w-3xl mx-auto space-y-6">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading notices...</div>
          ) : notices.length ? (
            notices.map((notice, index) => (
              <motion.article
                key={notice.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-card rounded-2xl border border-border hover:shadow-card transition-shadow"
              >
                {(() => {
                  const poll = parsePoll(notice);
                  return (
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const d = notice.published_date;
                            const isNew = d ? new Date(d) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false;
                            return isNew ? (
                              <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>
                            ) : null;
                          })()}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{notice.published_date ? format(new Date(notice.published_date), "PPP") : ""}</span>
                          </div>
                        </div>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                          {notice.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {notice.description}
                        </p>
                      </div>
                      {poll ? <NoticePoll poll={poll} noticeId={notice.id} /> : null}
                    </div>
                  );
                })()}
              </motion.article>
            ))
          ) : (
            <div className="text-center text-muted-foreground">No notices yet</div>
          )}
        </div>
      </Section>
    </>
  );
};

export default Notices;
