export interface Student {
  full_name: string;
  gender: string;
  date_of_birth: string;
  school_name: string;
  class_grade: string;
  parent_guardian_name: string;
  parent_contact_number: string;
  address: string;
  area_locality: string;
  status: string;
  notes: string;
  documents: { name: string; url: string; type: string }[];
  roll_number: string;
}

export interface StudentAttendenceHistory {
  session_id: string;
  sessions: {
    session_date: string;
    location: string;
  };
  status: string;
  date: string;
  location: string;
  assignedVolunteer: string;
}
