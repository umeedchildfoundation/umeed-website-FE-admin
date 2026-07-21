import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noticesApi } from "../../services/noticesApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthContext";

type Notice = {
  id: string;
  title: string;
  description: string | null;
  published_date: string | null;
  visibility: "public" | "internal";
};

const emptyNotice: Partial<Notice> = {
  title: "",
  description: "",
  published_date: "",
  visibility: "public",
};

export default function NoticesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Notice>>(emptyNotice);
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>([""]);
  const [search, setSearch] = useState("");

  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => noticesApi.getAll() as Promise<Notice[]>,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Notice>) => {
      if (!payload.title) throw new Error("Title is required");

      const pollData = hasPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2
        ? { question: pollQuestion.trim(), options: pollOptions.filter((o) => o.trim()) }
        : null;

      const attachment = pollData ? `poll:${JSON.stringify(pollData)}` : null;

      const noticeData = {
        title: payload.title,
        description: payload.description,
        published_date: payload.published_date || new Date().toISOString().split("T")[0],
        visibility: payload.visibility || "public",
        attachment_url: attachment,
      };

      await (payload.id
        ? noticesApi.update(payload.id, noticeData)
        : noticesApi.create(noticeData));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast({ title: formData.id ? "Notice updated" : "Notice published" });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => toast({ title: "Error", description: (error as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await noticesApi.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast({ title: "Notice removed" });
    },
    onError: (error) => toast({ title: "Error", description: (error as Error).message, variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData(emptyNotice);
    setHasPoll(false);
    setPollQuestion("");
    setPollOptions([""]);
  };

  const handleEdit = (notice: Notice) => {
    setFormData(notice);
    setIsModalOpen(true);
  };

  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    const q = search.toLowerCase();
    return notices.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q)
    );
  }, [notices, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notices</h1>
          <p className="text-muted-foreground">Manage and publish announcements</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Notice
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm bg-background border rounded-lg px-3 py-1 focus-within:ring-1 focus-within:ring-ring">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 h-9"
        />
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-medium">All Notices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="px-6 py-3 text-xs uppercase font-semibold text-muted-foreground">Title</TableHead>
                    <TableHead className="px-6 py-3 text-xs uppercase font-semibold text-muted-foreground">Date</TableHead>
                    <TableHead className="px-6 py-3 text-xs uppercase font-semibold text-muted-foreground">Visibility</TableHead>
                    {isAdmin && (
                      <TableHead className="px-6 py-3 text-xs uppercase font-semibold text-muted-foreground text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredNotices.length ? (
                    filteredNotices.map((notice) => (
                      <TableRow key={notice.id} className="group hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 pointer-events-none sm:pointer-events-auto">
                        <TableCell className="px-6 py-4 font-medium text-foreground">{notice.title}</TableCell>
                        <TableCell className="px-6 py-4 text-muted-foreground">
                          {notice.published_date ? format(new Date(notice.published_date), "PPP") : "—"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={`capitalize font-normal ${notice.visibility === 'public' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground'}`}
                          >
                            {notice.visibility}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEdit(notice)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMutation.mutate(notice.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Search className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <p>No notices found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit Notice" : "Publish Notice"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What's new?"
                className="bg-muted/50 min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.published_date || ""}
                  onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility || "public"}
                  onValueChange={(v) => setFormData({ ...formData, visibility: v as Notice["visibility"] })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!formData.id && ( // Only allow adding polls on creation for now to avoid complexity
              <div className="space-y-2">
                <Label htmlFor="hasPoll">Add Poll</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="hasPoll"
                    type="checkbox"
                    checked={hasPoll}
                    onChange={(e) => setHasPoll(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-muted-foreground">Include a poll with this notice</span>
                </div>
              </div>
            )}

            {hasPoll && !formData.id && (
              <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="pollQuestion">Poll question</Label>
                  <Input id="pollQuestion" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const next = [...pollOptions];
                            next[idx] = e.target.value;
                            setPollOptions(next);
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          disabled={pollOptions.length <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      disabled={pollOptions.length >= 5}
                    >
                      Add Option
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {formData.id ? "Update" : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
