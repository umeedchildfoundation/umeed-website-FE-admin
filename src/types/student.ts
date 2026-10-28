export interface StudentLocation {
  code: string;
  label: string;
}

export type StudentDocument = { name: string; url: string; type: string };

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
  location_code?: string;
}

/** Fields sent when creating a student; only name, gender, and location are required. */
export type StudentCreateInput = {
  full_name: string;
  gender: string;
  location_code: string;
  date_of_birth?: string;
  school_name?: string;
  class_grade?: string;
  parent_guardian_name?: string;
  parent_contact_number?: string;
  address?: string;
  area_locality?: string;
  status?: string;
  notes?: string;
  image_url?: string;
  documents?: StudentDocument[];
};

/** Request body for POST /students (documents as JSON string when present). */
export type StudentCreateApiBody = Omit<StudentCreateInput, "documents"> & {
  documents?: string;
};

/** PATCH body for updating a student (string fields always sent as strings). */
export type StudentUpdateInput = {
  full_name: string;
  gender: string;
  date_of_birth: string;
  school_name: string;
  class_grade: string;
  parent_guardian_name: string;
  parent_contact_number: string;
  address: string;
  area_locality: string;
  notes: string;
  status: string;
  roll_number: string;
  location_code?: string;
  image_url?: string;
  documents?: string;
};

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
