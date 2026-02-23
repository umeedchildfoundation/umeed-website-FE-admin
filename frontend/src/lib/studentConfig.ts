// Student Configuration

export const LOCATIONS = [
    { code: "01", name: "Location A" },
    { code: "02", name: "Location B" },
] as const;

export type LocationCode = (typeof LOCATIONS)[number]["code"];

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
export function getStudentIdSequentialNumber(id: string | null | undefined): number {
    if (!id) return 0;
    const match = id.match(/^UMS(\d+)$/);
    if (!match) return 0;
    return parseInt(match[1], 10);
}

// Deprecated or Legacy support if needed, but we are switching fully.
// Removing old functions to force compilation errors so I find all usages.

