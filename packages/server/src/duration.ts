/**
 * `10m`, `2h`, `1d`, `90s`, `500ms`, or a bare number of seconds — the
 * shapes every CI system's retention setting accepts. `undefined` for
 * anything else, so the caller can refuse loudly.
 */
const DURATION_UNITS: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

export function parseDuration(text: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/.exec(text.trim());
  if (!match) return undefined;
  const value = Number(match[1]) * (DURATION_UNITS[match[2] ?? 's'] ?? 1000);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}
