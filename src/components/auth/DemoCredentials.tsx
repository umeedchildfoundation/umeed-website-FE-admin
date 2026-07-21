import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DemoCredentialsProps {
  onSelect: (email: string, password: string) => void;
}

const demoAccounts = [
  { role: "Super Admin", email: "preet@umeed.org", password: "admin2026", color: "bg-primary" },
  { role: "Admin", email: "admin@umeed.org", password: "admin2026", color: "bg-accent" },
  { role: "Volunteer", email: "volunteer@umeed.org", password: "volunteer2026", color: "bg-umeed-sage" },
];

export function DemoCredentials({ onSelect }: DemoCredentialsProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (email: string, password: string, index: number) => {
    await navigator.clipboard.writeText(`${email} / ${password}`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-4 mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Demo Accounts (Development Only)</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mt-3">
              {demoAccounts.map((account, index) => (
                <div
                  key={account.email}
                  className="flex items-center gap-3 p-2 bg-background rounded-md border border-border/50 hover:border-border transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${account.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{account.role}</p>
                    <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onSelect(account.email, account.password)}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => handleCopy(account.email, account.password, index)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Use" to autofill, or copy credentials.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
