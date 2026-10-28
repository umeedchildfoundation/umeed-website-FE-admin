import type {
  StudentCreateApiBody,
  StudentCreateInput,
  StudentDocument,
  StudentLocation,
  StudentUpdateInput,
} from "../types/student";

export function coerceString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Normalize API/form documents (array, JSON string, or object) for the UI. */
export function normalizeStudentDocuments(value: unknown): StudentDocument[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is StudentDocument =>
        !!item && typeof item === "object" && "url" in item,
    );
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return normalizeStudentDocuments(JSON.parse(trimmed) as unknown);
    } catch {
      return [];
    }
  }
  if (typeof value === "object") {
    return [value as StudentDocument];
  }
  return [];
}

/** Backend expects documents as a JSON string or object, not an array field type. */
export function documentsForApi(
  docs: StudentDocument[] | undefined,
): string | undefined {
  if (!docs || docs.length === 0) return undefined;
  return JSON.stringify(docs);
}

/**
 * Generates a student ID in format: UMS[SequentialNumber]
 * Starts at 1001.
 * @param existingMax - The current maximum sequential number
 * @returns The new student ID string
 */
export function generateStudentId(existingMax: number): string {
  const start = 1000;
  const nextNumber = (existingMax > start ? existingMax : start) + 1;
  return `UMS${nextNumber}`;
}

/**
 * Parsing logic for new Student ID
 */
export function getStudentIdSequentialNumber(
  id: string | null | undefined,
): number {
  if (!id) return 0;
  const match = id.match(/^UMS(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

export function getLocationLabel(
  code: string | undefined | null,
  locations: StudentLocation[],
): string {
  if (!code) return "—";
  return locations.find((loc) => loc.code === code)?.label ?? code;
}

/** Build create payload: required fields plus only non-empty optional values. */
export function buildStudentCreatePayload(
  input: StudentCreateInput,
): StudentCreateApiBody {
  const payload: StudentCreateApiBody = {
    full_name: input.full_name.trim(),
    gender: input.gender,
    location_code: input.location_code,
  };

  if (input.date_of_birth?.trim())
    payload.date_of_birth = input.date_of_birth.trim();
  if (input.school_name?.trim()) payload.school_name = input.school_name.trim();
  if (input.class_grade?.trim()) payload.class_grade = input.class_grade.trim();
  if (input.parent_guardian_name?.trim()) {
    payload.parent_guardian_name = input.parent_guardian_name.trim();
  }
  if (input.parent_contact_number?.trim()) {
    payload.parent_contact_number = input.parent_contact_number.trim();
  }
  if (input.address?.trim()) payload.address = input.address.trim();
  if (input.area_locality?.trim())
    payload.area_locality = input.area_locality.trim();
  if (input.notes?.trim()) payload.notes = input.notes.trim();
  if (input.image_url?.trim()) payload.image_url = input.image_url.trim();

  if (input.status && input.status !== "active") {
    payload.status = input.status;
  }

  const documents = documentsForApi(input.documents);
  if (documents !== undefined) {
    payload.documents = documents;
  }

  return payload;
}

export function buildStudentUpdatePayload(
  input: StudentCreateInput & {
    roll_number?: string;
    status?: string;
  },
  options: { includeLocation?: boolean } = {},
): StudentUpdateInput {
  const payload: StudentUpdateInput = {
    full_name: input.full_name.trim(),
    gender: input.gender,
    date_of_birth: coerceString(input.date_of_birth),
    school_name: coerceString(input.school_name),
    class_grade: coerceString(input.class_grade),
    parent_guardian_name: coerceString(input.parent_guardian_name),
    parent_contact_number: coerceString(input.parent_contact_number),
    address: coerceString(input.address),
    area_locality: coerceString(input.area_locality),
    notes: coerceString(input.notes),
    status: input.status?.trim() || "active",
    roll_number: coerceString(input.roll_number),
  };

  if (options.includeLocation && input.location_code?.trim()) {
    payload.location_code = input.location_code.trim();
  }

  if (input.image_url?.trim()) {
    payload.image_url = input.image_url.trim();
  }

  const documents = documentsForApi(input.documents);
  if (documents !== undefined) {
    payload.documents = documents;
  }

  return payload;
}
