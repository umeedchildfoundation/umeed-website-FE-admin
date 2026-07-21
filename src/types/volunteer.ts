export interface Volunteer {
  id: string;
  volunteer_id?: string | null;
  user_id: string | null;
  name: string;
  full_name: string;
  email: string;
  phone: string | null;
  age: string | number | null;
  gender: string | null;
  address: string | null;
  occupation: string | null;
  skills: string[] | null;
  preferred_languages: string[] | null;
  availability: string | null;
  status: "pending" | "approved" | "rejected" | "inactive";
  joined_at: string | null;
  attendance_count?: number;
  profile_picture?: string | null;
  documents: {
    name: string;
    type: string;
    url: string;
  }[];
}

export interface VolunteerAttendenceHistory {
  sessions: {
    session_date: string;
    location: string;
  };
  status: string;
  date: string;
  location: string;
}
