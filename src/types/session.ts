export interface Session {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
  rsvp_enabled: boolean;
  session_rsvps: { count: number }[];
}
