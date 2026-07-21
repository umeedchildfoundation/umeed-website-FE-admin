/**
 * Generates a volunteer ID in format: UMV[SequentialNumber]
 * Starts at 1001.
 * @param existingMax - The current maximum sequential number (default 1000 if 0)
 * @returns The new volunteer ID string
 */
export function generateVolunteerId(existingMax: number): string {
  const start = 1000;
  const nextNumber = (existingMax > start ? existingMax : start) + 1;
  return `UMV${nextNumber}`;
}

/**
 * Parses a volunteer ID to extract the sequential number
 * @param id - The volunteer ID string (e.g., "UMV1001")
 * @returns The sequential number, or 0 if invalid
 */
export function getVolunteerSequentialNumber(
  id: string | null | undefined,
): number {
  if (!id) return 0;
  const match = id.match(/^UMV(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}
