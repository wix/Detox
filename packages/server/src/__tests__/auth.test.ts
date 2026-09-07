import { describe, it, expect } from 'vitest';
import type { IncomingMessage } from 'node:http';

import { assertUsableToken, generateToken, isAuthorized, type AuthConfig } from '../auth';

function request(authorization?: string): IncomingMessage {
  return { headers: authorization ? { authorization } : {} } as IncomingMessage;
}

const auth: AuthConfig = { type: 'static-token', token: generateToken() };

describe('isAuthorized', () => {
  it('admits the configured token', () => {
    expect(isAuthorized(request(`Bearer ${auth.token}`), auth)).toBe(true);
  });

  /**
   * @issue DTX-6202
   * No config means auth is off — an open door by choice, not an accident.
   * Header or no header, everyone is welcome;
   * and an undefined config asserts nothing at startup.
   */
  it('admits everyone when auth is not configured — opt-in and off by default', () => {
    expect(isAuthorized(request(), undefined)).toBe(true);
    expect(isAuthorized(request('Bearer anything-at-all'), undefined)).toBe(true);
    expect(() => assertUsableToken(undefined)).not.toThrow();
  });

  it('is case-insensitive about the Bearer scheme', () => {
    expect(isAuthorized(request(`bearer ${auth.token}`), auth)).toBe(true);
  });

  /**
   * @issue DTX-6200
   * `tokensMatch` compares lengths before calling `timingSafeEqual`, which
   * throws on a length mismatch. A missing `Authorization` header presents
   * the empty string, whose length differs from the real token's.
   */
  it('turns away a missing, malformed, or wrong token', () => {
    expect(isAuthorized(request(), auth)).toBe(false);
    expect(isAuthorized(request(auth.token), auth)).toBe(false);
    expect(isAuthorized(request(`Basic ${auth.token}`), auth)).toBe(false);
    expect(isAuthorized(request(`Bearer ${generateToken()}`), auth)).toBe(false);
  });

  it('does not admit a prefix of the real token', () => {
    expect(isAuthorized(request(`Bearer ${auth.token.slice(0, -1)}`), auth)).toBe(false);
  });

  /**
   * A request with no `Authorization` header presents the empty string, and
   * two empty buffers compare equal — so an empty configured token would
   * otherwise admit every anonymous client. A declared-but-unset
   * `DETOX_SERVER_TOKEN=` is a realistic way to get here; `isAuthorized`'s
   * own length guard is what actually stops it (auth.ts's `MIN_TOKEN_LENGTH`
   * check), independent of `assertUsableToken`.
   */
  it('never matches an empty configured token, whatever is presented', () => {
    const open: AuthConfig = { type: 'static-token', token: '' };
    expect(isAuthorized(request(), open)).toBe(false);
    expect(isAuthorized(request('Bearer '), open)).toBe(false);
    expect(isAuthorized(request('Bearer anything'), open)).toBe(false);
  });
});

describe('assertUsableToken', () => {
  it('accepts a generated token', () => {
    expect(() => assertUsableToken(auth)).not.toThrow();
  });

  /**
   * @issue DTX-6201
   * The empty string is the dangerous one: two empty buffers are equal, and
   * a request with no `Authorization` header presents exactly that, so an
   * empty configured token would silently admit every anonymous client. A
   * blank environment variable (`DETOX_SERVER_TOKEN=` in a CI config) is a
   * realistic way to arrive here.
   */
  it('refuses a token that cannot protect anything', () => {
    for (const token of ['', ' ', 'short']) {
      expect(() => assertUsableToken({ type: 'static-token', token })).toThrow(
        /at least .* characters/,
      );
    }
  });
});

describe('generateToken', () => {
  it('produces a distinct 256-bit hex token each time', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()));
    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(token).toMatch(/^[0-9a-f]{64}$/);
  });
});
