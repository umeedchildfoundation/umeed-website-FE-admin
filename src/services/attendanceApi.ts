import apiClient from "../lib/apiClient";

export interface AttendanceRecord {
  id: string;
  status: "present" | "absent" | "late" | "excused";
  marked_at: string;
  student_id?: string;
  volunteer_id?: string;
  session_id: string;
}

export const attendanceApi = {
  // Student attendance (uses alias route)
  getStudentAttendance: (params?: Record<string, string | undefined>) =>
    apiClient
      .get<AttendanceRecord[]>("/student_attendance", { params })
      .then((r) => r.data),

  markStudentAttendance: (data: {
    student_id: string;
    session_id: string;
    status: string;
  }) => apiClient.post("/student_attendance", data).then((r) => r.data),

  // Volunteer attendance (uses alias route)
  getVolunteerAttendance: (params?: Record<string, string | undefined>) =>
    apiClient
      .get<AttendanceRecord[]>("/volunteer_attendance", { params })
      .then((r) => r.data),

  markVolunteerAttendance: (data: {
    volunteer_id: string;
    session_id: string;
    status: string;
  }) => apiClient.post("/volunteer_attendance", data).then((r) => r.data),

  // Session assignments (via attendance module)
  getAssignments: (sessionId: string) =>
    apiClient.get(`/attendance/assignments/${sessionId}`).then((r) => r.data),

  createAssignment: (data: { session_id: string; volunteer_id: string }) =>
    apiClient.post("/attendance/assignments", data).then((r) => r.data),

  deleteAssignment: (id: string) =>
    apiClient.delete(`/attendance/assignments/${id}`).then((r) => r.data),
};
