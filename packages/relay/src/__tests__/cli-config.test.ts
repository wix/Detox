/**
 * CLI resolution units (spec 008): the flags, the server's keepalive
 * semantics verbatim (2-minute default, `0` legal = off, empty env falls to the
 * default never to off, 7-day ceiling), and the `||`-not-`??` token trap.
 */
import { describe, it, expect } from 'vitest';

import { KEEPALIVE_OFF } from '@detox-remote/server';

import { dialableUrl, resolveRelayCli, RelayCliError } from '../cli-config';
import { RELAY_LOG_PREFIX, relayError, relayLog } from '../log';

const NODES = ['--nodes', '/tmp/nodes.json'];

function resolve(argv: string[], env: Record<string, string | undefined> = {}) {
  return resolveRelayCli({ argv, env });
}

describe('resolveRelayCli', () => {
  it('defaults: OS-picked port, loopback host, auth OFF, 2-minute keepalive window', () => {
    const config = resolve(NODES);
    expect(config.port).toBe(0);
    expect(config.host).toBe('127.0.0.1');
    expect(config.auth).toBeUndefined();
    expect(config.keepalive).toEqual({ intervalMs: 40_000, maxMissedPongs: 3 });
  });

  it('requires --nodes (or DETOX_RELAY_NODES) — a relay needs its fleet', () => {
    expect(() => resolve([])).toThrow(RelayCliError);
    expect(resolve([], { DETOX_RELAY_NODES: '/etc/nodes.json' }).nodesFile).toBe('/etc/nodes.json');
  });

  it('--keepalive-window 0 is LEGAL and means OFF', () => {
    expect(resolve([...NODES, '--keepalive-window', '0']).keepalive).toBe(KEEPALIVE_OFF);
  });

  it('an EMPTY env window falls to the default, never to off (||, not ??)', () => {
    const config = resolve(NODES, { DETOX_RELAY_KEEPALIVE_WINDOW: '' });
    expect(config.keepalive).toEqual({ intervalMs: 40_000, maxMissedPongs: 3 });
  });

  it('rejects a window past the 7-day ceiling (the 32-bit timer ping storm)', () => {
    expect(() => resolve([...NODES, '--keepalive-window', '604801'])).toThrow(RelayCliError);
    expect(() => resolve([...NODES, '--keepalive-window', 'soon'])).toThrow(RelayCliError);
  });

  it('rejects a malformed port or blob budget', () => {
    expect(() => resolve([...NODES, '--port', '70000'])).toThrow(RelayCliError);
    expect(() => resolve([...NODES, '--port', 'eighty'])).toThrow(RelayCliError);
    expect(() => resolve([...NODES, '--blob-budget', '-5'])).toThrow(RelayCliError);
    expect(() => resolve([...NODES, '--blob-budget', 'lots'])).toThrow(RelayCliError);
  });

  /**
   * @issue DTX-7041
   * A declared-but-empty token — `DETOX_RELAY_TOKEN=` — reads as an unset
   * CI secret, not a real value or a deliberate "no auth": accepting it
   * would silently open the door for an operator who meant to guard it, so
   * it is refused loudly instead.
   */
  it('a token from --token or DETOX_RELAY_TOKEN turns auth ON; a declared-but-empty one refuses', () => {
    expect(resolve([...NODES, '--token', 'operator-set']).auth).toEqual({
      type: 'static-token',
      token: 'operator-set',
    });
    const fromEnv = resolve(NODES, { DETOX_RELAY_TOKEN: 'env-set' });
    expect(fromEnv.auth?.token).toBe('env-set');
    expect(() => resolve(NODES, { DETOX_RELAY_TOKEN: '' })).toThrow(RelayCliError);
  });

  it('passes the blob seam and budget through', () => {
    const config = resolve([...NODES, '--blob-budget', '1024'], { DETOX_RELAY_BLOB_ROOT: '/tmp/blobs' });
    expect(config.blobBudget).toBe(1024);
    expect(config.blobRoot).toBe('/tmp/blobs');
  });
});

describe('dialableUrl', () => {
  it('announces a concrete host as itself', () => {
    expect(dialableUrl('127.0.0.1', 1234)).toBe('ws://127.0.0.1:1234');
  });

  it('never announces a wildcard bind — those are bind addresses, not destinations', () => {
    const url = dialableUrl('0.0.0.0', 1234);
    expect(url).not.toContain('0.0.0.0');
    expect(url).toMatch(/^ws:\/\/.+:1234$/);
  });

  it('brackets an IPv6 literal', () => {
    const url = dialableUrl('::1', 9);
    expect(url).toBe('ws://[::1]:9');
  });
});

describe('the relay log voice', () => {
  it('speaks with the [relay] prefix on both streams', () => {
    const lines: string[] = [];
    const log = console.log.bind(console);
    const error = console.error.bind(console);
    console.log = (line: string) => lines.push(line);
    console.error = (line: string) => lines.push(line);
    try {
      relayLog('hello');
      relayError('world');
    } finally {
      console.log = log;
      console.error = error;
    }
    expect(lines).toEqual([`${RELAY_LOG_PREFIX} hello`, `${RELAY_LOG_PREFIX} world`]);
  });
});
