import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionDetailedRSVPs } from "@/hooks/useStats";
import { Mail, Phone, Loader2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface SessionRSVPDetailSheetProps {
    sessionId: string | null;
    sessionTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export function SessionRSVPDetailSheet({ sessionId, sessionTitle, isOpen, onClose }: SessionRSVPDetailSheetProps) {
    const { data: rsvps, isLoading } = useSessionDetailedRSVPs(sessionId);

    const getStatusList = (status: string) => {
        return rsvps?.filter((rsvp) => rsvp.status === status) || [];
    };

    const going = getStatusList("yes");
    const maybe = getStatusList("maybe");
    const notGoing = getStatusList("no");

    const VolunteerItem = ({ rsvp }: { rsvp: any }) => {
        const vol = rsvp.volunteers;
        if (!vol) return null;

        return (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors mb-2">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                        <AvatarImage src={vol.profile_picture} />
                        <AvatarFallback>{vol.name?.charAt(0) || "V"}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium leading-none">{vol.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="bg-primary/10 text-primary px-1 rounded text-[10px] font-mono">
                                {vol.volunteer_id}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Future: Add actions like email/message */}
                </div>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">Attendance: {sessionTitle}</SheetTitle>
                    <SheetDescription>
                        RSVP details for this session.
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="going" className="flex-1 flex flex-col h-full overflow-hidden">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="going" className="gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Going <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{going.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="maybe" className="gap-2">
                                <HelpCircle className="w-4 h-4 text-amber-500" />
                                Maybe <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{maybe.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="not-going" className="gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                Not Going <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{notGoing.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            <TabsContent value="going" className="mt-0 space-y-2">
                                {going.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">No one confirmed yet.</div>
                                ) : (
                                    going.map((item: any, i: number) => <VolunteerItem key={i} rsvp={item} />)
                                )}
                            </TabsContent>
                            <TabsContent value="maybe" className="mt-0 space-y-2">
                                {maybe.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">No 'Maybe' responses.</div>
                                ) : (
                                    maybe.map((item: any, i: number) => <VolunteerItem key={i} rsvp={item} />)
                                )}
                            </TabsContent>
                            <TabsContent value="not-going" className="mt-0 space-y-2">
                                {notGoing.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">No one declined yet.</div>
                                ) : (
                                    notGoing.map((item: any, i: number) => <VolunteerItem key={i} rsvp={item} />)
                                )}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                )}
            </SheetContent>
        </Sheet>
    );
}
