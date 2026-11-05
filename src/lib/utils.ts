import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Case-insensitive A→Z name comparison for lists and tables. */
export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sortByName<T>(
  items: T[],
  getName: (item: T) => string | undefined | null,
): T[] {
  return [...items].sort((a, b) =>
    compareNames((getName(a) ?? "").trim(), (getName(b) ?? "").trim()),
  );
}

/** Run async work in small batches (avoids mobile/browser connection limits). */
export async function runInBatches<T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((item) => worker(item)));
    const failure = results.find((r) => r.status === "rejected");
    if (failure?.status === "rejected") {
      throw failure.reason;
    }
  }
}

export function isAxiosNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; response?: unknown };
  return !err.response && (err.code === "ERR_NETWORK" || err.message === "Network Error");
}
