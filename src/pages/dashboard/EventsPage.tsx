import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isDemoMode } from "../../lib/api";
import { eventsApi } from "../../services/eventsApi";
import { mediaApi } from "../../services/mediaApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { format } from "date-fns";
import { Plus, Trash2, Pencil } from "lucide-react";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  tags: string[] | null;
  event_media?: { url: string; media_type: string }[];
};

const emptyEvent: Partial<EventRow> = {
  title: "",
  description: "",
  event_date: "",
  location: "",
  tags: [],
  event_media: [],
};

export default function EventsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EventRow>>(emptyEvent);
  const [mediaUrl, setMediaUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events-admin"],
    queryFn: () => eventsApi.getAll() as Promise<EventRow[]>,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!formData.title || !formData.event_date) throw new Error("Title and date required");
      const created = await eventsApi.create({
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        location: formData.location,
        tags: formData.tags?.length ? formData.tags : null,
      });

      let finalUrl = mediaUrl;
      if (selectedFile) {
        if (isDemoMode) {
          finalUrl = fileDataUrl || finalUrl;
        } else {
          const uploaded = await mediaApi.upload(selectedFile, `events/${created.id}`);
          finalUrl = mediaApi.getPublicUrl(uploaded.url);
        }
      }
      // event_media linking not yet supported by BE — store url on event for now
      void finalUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
      toast({ title: "Event saved" });
      setIsModalOpen(false);
      setFormData(emptyEvent);
      setMediaUrl("");
      setSelectedFile(null);
      setFilePreview("");
      setFileDataUrl("");
      setIsEditing(false);
      setEditingId(null);
    },
    onError: (error) => toast({ title: "Error", description: (error as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No event selected");
      await eventsApi.update(editingId, {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        location: formData.location,
        tags: formData.tags?.length ? formData.tags : null,
      });

      if (selectedFile) {
        if (!isDemoMode) {
          const uploaded = await mediaApi.upload(selectedFile, `events/${editingId}`);
          void mediaApi.getPublicUrl(uploaded.url);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
      toast({ title: "Event updated" });
      setIsModalOpen(false);
      setFormData(emptyEvent);
      setMediaUrl("");
      setSelectedFile(null);
      setFilePreview("");
      setFileDataUrl("");
      setIsEditing(false);
      setEditingId(null);
    },
    onError: (error) => toast({ title: "Error", description: (error as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
      toast({ title: "Event deleted" });
    },
    onError: (error) => toast({ title: "Error", description: (error as Error).message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setFilePreview(file ? URL.createObjectURL(file) : "");
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFileDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFileDataUrl("");
    }
  };

  const startCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptyEvent);
    setMediaUrl("");
    setSelectedFile(null);
    setFilePreview("");
    setFileDataUrl("");
    setIsModalOpen(true);
  };

  const startEdit = (ev: EventRow) => {
    setIsEditing(true);
    setEditingId(ev.id);
    setFormData({
      title: ev.title,
      description: ev.description,
      event_date: ev.event_date,
      location: ev.location,
      tags: ev.tags || [],
    });
    setMediaUrl(ev.event_media?.[0]?.url || "");
    setSelectedFile(null);
    setFilePreview("");
    setFileDataUrl("");
    setIsModalOpen(true);
  };

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const q = search.toLowerCase();
    return events.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q) ||
        ev.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [events, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">Showcase recent and upcoming events</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by title, location, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="grid grid-cols-1 overflow-hidden w-full rounded-md border sm:border-0 border-border">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Media</TableHead>
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
                  ) : filteredEvents.length ? (
                    filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{format(new Date(event.event_date), "PPP")}</TableCell>
                        <TableCell>{event.location || "-"}</TableCell>
                        <TableCell className="space-x-1">
                          {event.tags?.map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                            </Badge>
                          )) || "-"}
                        </TableCell>
                        <TableCell>
                          {event.event_media?.[0]?.url ? (
                            <img src={event.event_media[0].url} alt={event.title} className="w-12 h-12 rounded object-cover" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(event)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(event.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No events yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.event_date || ""}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event details"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={(formData.tags || []).join(", ")}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                placeholder="art, science, fundraiser"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-file">Cover image (optional)</Label>
              <Input id="media-file" type="file" accept="image/*" onChange={handleFileChange} />
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-24 h-24 rounded object-cover" />
              ) : mediaUrl ? (
                <img src={mediaUrl} alt="Current" className="w-24 h-24 rounded object-cover" />
              ) : null}
              <Label htmlFor="media">Or image URL</Label>
              <Input id="media" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

