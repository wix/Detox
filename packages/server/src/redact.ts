/**
 * What of a URL may reach a log line, a wire error, or a stored argv:
 * origin + path for `http(s)` (callers paste presigned links — signature in
 * the query — and `user:pass@` links), origin only for `ws(s)` (a gateway
 * address carries nothing a log needs beyond its origin, and a relay's may
 * carry a token in its path). Raw strings that are not URLs pass through; a string
 * `URL` cannot parse becomes a fixed placeholder. One module, imported by
 * everything that writes (the recorder, the exec seam, the archive
 * fetcher), so no site redacts on its own terms.
 */

const HTTP_URL = /^https?:\/\//i;
const WS_URL = /^wss?:\/\//i;

/** `http(s)`: origin + path, credentials and query dropped. */
export function redactUrl(u: URL): string {
  return `${u.protocol}//${u.host}${u.pathname}`;
}

/** `ws(s)`: origin only — nothing on a websocket path belongs in a log. */
function redactWsUrl(u: URL): string {
  return u.pathname === '/' || u.pathname === '' ? `${u.protocol}//${u.host}` : `${u.protocol}//${u.host}/…`;
}

/** Log/echo-safe form of a raw install string; tolerant of an unparsable one. */
export function redactUrlForLog(raw: string): string {
  try {
    return redactUrl(new URL(raw));
  } catch {
    return '<malformed-url>';
  }
}

/** Structural redaction: every URL-shaped string, at any depth, goes through the rule for its scheme. */
export function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (HTTP_URL.test(value)) return redactUrlForLog(value);
    if (WS_URL.test(value)) {
      try {
        return redactWsUrl(new URL(value));
      } catch {
        return '<malformed-url>';
      }
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, redactValue(v)]));
  }
  return value;
}

/** A spawn's argv as the log may keep it: each token through {@link redactValue}. */
export function redactArgv(argv: readonly string[]): string[] {
  return argv.map((token) => redactValue(token) as string);
}
