import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

/**
 * How the server decides who may connect.
 *
 * A discriminated union with exactly one member today: the next scheme
 * (per-user tokens, mTLS, an OIDC introspection endpoint) is a new `type`,
 * not a rewrite of every call site.
 */
export interface StaticTokenAuth {
  type: 'static-token';
  token: string;
}

export type AuthConfig = StaticTokenAuth;

/** Bytes of entropy in a generated token. 32 bytes = 256 bits, hex-encoded. */
const TOKEN_BYTES = 32;

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

function presentedToken(req: IncomingMessage): string {
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : '';
}

/** @issue DTX-6200: the lengths are compared first, so a mismatch never reaches `timingSafeEqual`, which throws on one. */
function tokensMatch(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Rejects a token that cannot protect anything.
 *
 * @issue DTX-6201: an empty token is refused at startup — a missing
 * Authorization header presents the same empty string.
 * @issue DTX-6202: undefined is different — no config means auth is off by
 * default, not asserted.
 */
export function assertUsableToken(config: AuthConfig | undefined): void {
  if (config === undefined) return;
  if (config.token.length < MIN_TOKEN_LENGTH) {
    throw new Error(
      `Refusing to start: the ${config.type} auth token must be at least ` +
        `${MIN_TOKEN_LENGTH} characters (got ${config.token.length}). ` +
        'Pass --token, set DETOX_SERVER_TOKEN, or omit both to run with auth off.',
    );
  }
}

/** Short enough to admit a hand-typed token, long enough to exclude '' and '1'. */
const MIN_TOKEN_LENGTH = 8;

export function isAuthorized(req: IncomingMessage, config: AuthConfig | undefined): boolean {
  // Auth off: every caller is welcome, header or none.
  if (config === undefined) return true;
  // An expected token this short must never be a thing that can match.
  if (config.token.length < MIN_TOKEN_LENGTH) return false;
  return tokensMatch(presentedToken(req), config.token);
}
