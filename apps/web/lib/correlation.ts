export function createCorrelationId(prefix = "cc"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
