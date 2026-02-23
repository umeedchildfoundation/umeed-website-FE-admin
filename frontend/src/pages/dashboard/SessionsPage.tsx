import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, isDemoMode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarPlus, Trash2, Edit } from "lucide-react";

type Session = {
  id: string;
  title: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  rsvp_enabled: boolean;
};

const emptySession: Partial<Session> = {
  title: "",
  session_date: "",
  start_time: "",
  end_time: "",
  location: "",
  notes: "",
  rsvp_enabled: false,
};

export default function SessionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Session>>(emptySession);
  const [search, setSearch] = useState("");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await api
        .from("sessions")
        .select("*, session_rsvps(count)") // Optimistically trying to fetch count if relation exists via foreign key
        .order("session_date", { ascending: true });

      // If the relation query fails (because I didn't set up the FK name explicitly effectively for Postgrest logic sometimes), 
      // we might fallback or just standard select. 
      // Given the SQL I wrote: "volunteer_id REFERENCES volunteers(id)" and "session_id REFERENCES sessions(id)" matches standard conventions.
      // Postgrest should pick up `session_rsvps`.

      if (error) throw error;
      return data as any[]; // leveraging any to handle the extra 'session_rsvps' count array/obj
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Session>) => {
      if (!payload.session_date) throw new Error("Date is required");

      const sessionData = {
        title: payload.title || "Untitled Session",
        session_date: payload.session_date,
        start_time: payload.start_time || null,
        end_time: payload.end_time || null,
        location: payload.location || null,
        notes: payload.notes || null,
        rsvp_enabled: payload.rsvp_enabled || false,
      };

      const { data, error } = await api
        .from("sessions")
        .upsert(
          payload.id
            ? { ...sessionData, id: payload.id }
            : sessionData
        )
        .select()
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: formData.id ? "Session updated" : "Session created" });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => toast({ title: "Error saving session", description: (error as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "Session deleted" });
    },
    onError: (error) => toast({ title: "Error deleting session", description: (error as Error).message, variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData(emptySession);
  };

  const handleEdit = (session: any) => {
    setFormData({
      id: session.id,
      title: session.title,
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      location: session.location,
      notes: session.notes,
      rsvp_enabled: session.rsvp_enabled,
    });
    setIsModalOpen(true);
  };

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.session_date.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q)
    );
  }, [sessions, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground">Plan and manage learning sessions</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <CalendarPlus className="w-4 h-4 mr-2" />
          Create Session
        </Button>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by title, date, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 overflow-hidden w-full rounded-md border border-border">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>RSVPs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredSessions.length ? (
                    filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.title || "Untitled"}</TableCell>
                        <TableCell>{format(new Date(session.session_date), "PPP")}</TableCell>
                        <TableCell>
                          {session.start_time ? `${session.start_time} - ${session.end_time || "TBD"}` : "TBD"}
                        </TableCell>
                        <TableCell>{session.location || "-"}</TableCell>
                        <TableCell>
                          {session.rsvp_enabled ? (
                            <div className="flex gap-2">
                              <span className="text-green-600 font-medium">{session.session_rsvps?.[0]?.count || 0} Yes</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Disabled</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(session)}
                            >
                              <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(session.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No sessions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {
            isDemoMode && (
              <p className="text-xs text-muted-foreground mt-3">Demo mode data is stored locally.</p>
            )
          }
        </CardContent >
      </Card >

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsModalOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit Session" : "Create Session"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Weekly Math Session"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between border p-3 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="rsvp">Enable Attendance Poll</Label>
                  <p className="text-xs text-muted-foreground">Volunteers can RSVP "Yes/No/Maybe"</p>
                </div>
                <Switch
                  id="rsvp"
                  checked={formData.rsvp_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, rsvp_enabled: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.session_date || ""}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={formData.start_time || ""}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="time"
                  value={formData.end_time || ""}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Community Centre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Agenda or materials"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {formData.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div >
  );
}

