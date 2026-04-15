const DEFAULT_LATENCY_MS = 320;

export interface SimulatedFetchOptions {
  latencyMs?: number;
  shouldFail?: () => boolean;
  failureMessage?: string;
}

export async function simulateFetch<T>(
  producer: () => T,
  options: SimulatedFetchOptions = {},
): Promise<T> {
  const { latencyMs = DEFAULT_LATENCY_MS, shouldFail, failureMessage } = options;
  await new Promise((resolve) => setTimeout(resolve, latencyMs));
  if (shouldFail?.()) {
    throw new Error(failureMessage ?? "Simulated network failure");
  }
  return producer();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}
