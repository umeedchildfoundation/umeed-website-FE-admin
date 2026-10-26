import type { StudentCreateInput, StudentLocation } from "../types/student";

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
): StudentCreateInput {
  const payload: StudentCreateInput = {
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

  if (input.documents && input.documents.length > 0) {
    payload.documents = input.documents;
  }

  return payload;
}
