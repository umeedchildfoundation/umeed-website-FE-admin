import apiClient from "../lib/apiClient";
import { runInBatches } from "../lib/utils";

export interface AttendanceRecord {
  id: string;
  status: "present" | "absent" | "late" | "excused";
  marked_at: string;
  student_id?: string;
  volunteer_id?: string;
  session_id: string;
}

type MarkStudentPayload = {
  student_id: string;
  session_id: string;
  status: string;
};

type MarkVolunteerPayload = {
  volunteer_id: string;
  session_id: string;
  status: string;
};

/** Query params: send snake_case and camelCase aliases for BE compatibility. */
function withAttendanceQueryAliases(
  params?: Record<string, string | undefined>,
): Record<string, string> | undefined {
  if (!params) return undefined;

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    out[key] = value;

    if (key === "session_id") out.sessionId = value;
    if (key === "student_id") out.studentId = value;
    if (key === "volunteer_id") out.volunteerId = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function studentAttendanceBody(data: MarkStudentPayload) {
  return {
    student_id: data.student_id,
    session_id: data.session_id,
    status: data.status,
    studentId: data.student_id,
    sessionId: data.session_id,
  };
}

function volunteerAttendanceBody(data: MarkVolunteerPayload) {
  return {
    volunteer_id: data.volunteer_id,
    session_id: data.session_id,
    status: data.status,
    volunteerId: data.volunteer_id,
    sessionId: data.session_id,
  };
}

export const attendanceApi = {
  getStudentAttendance: (params?: Record<string, string | undefined>) =>
    apiClient
      .get<AttendanceRecord[]>("/student_attendance", {
        params: withAttendanceQueryAliases(params),
      })
      .then((r) => r.data),

  markStudentAttendance: (data: MarkStudentPayload) =>
    apiClient
      .post("/student_attendance", studentAttendanceBody(data))
      .then((r) => r.data),

  /** Upsert many student rows for one session (fewer round-trips on mobile). */
  markStudentAttendanceBulk: (
    session_id: string,
    records: { student_id: string; status: string }[],
  ) =>
    apiClient
      .post("/student_attendance/bulk", {
        session_id,
        sessionId: session_id,
        records: records.map((r) => ({
          student_id: r.student_id,
          studentId: r.student_id,
          status: r.status,
        })),
      })
      .then((r) => r.data),

  getVolunteerAttendance: (params?: Record<string, string | undefined>) =>
    apiClient
      .get<AttendanceRecord[]>("/volunteer_attendance", {
        params: withAttendanceQueryAliases(params),
      })
      .then((r) => r.data),

  markVolunteerAttendance: (data: MarkVolunteerPayload) =>
    apiClient
      .post("/volunteer_attendance", volunteerAttendanceBody(data))
      .then((r) => r.data),

  markVolunteerAttendanceBulk: (
    session_id: string,
    records: { volunteer_id: string; status: string }[],
  ) =>
    apiClient
      .post("/volunteer_attendance/bulk", {
        session_id,
        sessionId: session_id,
        records: records.map((r) => ({
          volunteer_id: r.volunteer_id,
          volunteerId: r.volunteer_id,
          status: r.status,
        })),
      })
      .then((r) => r.data),

  getAssignments: (sessionId: string) =>
    apiClient.get(`/attendance/assignments/${sessionId}`).then((r) => r.data),

  createAssignment: (data: { session_id: string; volunteer_id: string }) =>
    apiClient.post("/attendance/assignments", data).then((r) => r.data),

  deleteAssignment: (id: string) =>
    apiClient.delete(`/attendance/assignments/${id}`).then((r) => r.data),
};

async function saveWithBulkFallback<T extends { status: string }>(
  session_id: string,
  changes: T[],
  bulk: (sessionId: string, records: T[]) => Promise<unknown>,
  single: (record: T & { session_id: string }) => Promise<unknown>,
) {
  if (!changes.length) return;

  try {
    await bulk(session_id, changes);
    return;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    // Older API without /bulk — fall back to small batched single marks
    if (status !== 404 && status !== 405) throw error;
  }

  await runInBatches(changes, 6, (record) =>
    single({ ...record, session_id }),
  );
}

export async function saveStudentSessionAttendance(
  session_id: string,
  changes: { student_id: string; status: string }[],
) {
  return saveWithBulkFallback(
    session_id,
    changes,
    (sid, records) => attendanceApi.markStudentAttendanceBulk(sid, records),
    (record) =>
      attendanceApi.markStudentAttendance({
        student_id: record.student_id,
        session_id: record.session_id,
        status: record.status,
      }),
  );
}

export async function saveVolunteerSessionAttendance(
  session_id: string,
  changes: { volunteer_id: string; status: string }[],
) {
  return saveWithBulkFallback(
    session_id,
    changes,
    (sid, records) => attendanceApi.markVolunteerAttendanceBulk(sid, records),
    (record) =>
      attendanceApi.markVolunteerAttendance({
        volunteer_id: record.volunteer_id,
        session_id: record.session_id,
        status: record.status,
      }),
  );
}

/** Normalize attendance rows from API (snake_case or camelCase ids). */
export function attendanceRecordToMap(
  records: AttendanceRecord[] | undefined,
  personKey: "student_id" | "volunteer_id",
): Record<string, AttendanceRecord["status"]> {
  const map: Record<string, AttendanceRecord["status"]> = {};
  if (!records) return map;

  records.forEach((row) => {
    const raw = row as AttendanceRecord & {
      studentId?: string;
      volunteerId?: string;
    };
    const personId =
      raw[personKey] ??
      (personKey === "student_id" ? raw.studentId : raw.volunteerId);
    if (personId && raw.status) {
      map[personId] = raw.status;
    }
  });
  return map;
}
