/**
 * The device lane's read-only half.
 *
 * Root-level `.test.mjs` because the subject is `scripts/`, not a package
 * source (same pattern as `tap-census.test.mjs`).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import net from 'node:net';

const require = createRequire(import.meta.url);
const { probeLane, humanAge } = require('./scripts/lib/device-lane.js');

/** A port nothing is listening on: bind one, learn its number, release it. */
const freePort = () =>
  new Promise((resolve) => {
    const probe = net.createServer();
    probe.listen({ host: '127.0.0.1', port: 0 }, () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

/** A peer on `port` that answers every connection with `line`. */
const peerSaying = (port, line) =>
  new Promise((resolve) => {
    const server = net.createServer((socket) => socket.end(line));
    server.listen({ host: '127.0.0.1', port }, () => resolve(server));
  });

const servers = [];
afterEach(() => {
  while (servers.length) servers.pop().close();
});

describe('probeLane', () => {
  /**
   * @issue DTX-8001
   * Free/held/stranger is decided by connecting, never binding: probing used
   * to bind the port to test it, so a plain `yarn lane` racing a starting
   * `yarn accept` could win the port for a few milliseconds and make the
   * accept run refuse with "held by something that does not speak the lane
   * banner". Asking must not take.
   */
  it('reports a free port as free, and leaves it free', async () => {
    const port = await freePort();
    expect(await probeLane(port)).toEqual({ state: 'free' });
    // Still bindable immediately afterwards: the question did not take the
    // lane even for the instant it was being asked.
    const taken = await peerSaying(port, 'later\n');
    servers.push(taken);
    expect(taken.listening).toBe(true);
  });

  it('reads the holder out of the banner', async () => {
    const port = await freePort();
    const banner = { what: 'accept 006', pid: 4242, since: Date.now(), cwd: '/tmp/x', argv: '006' };
    servers.push(await peerSaying(port, JSON.stringify(banner) + '\n'));
    const probe = await probeLane(port);
    expect(probe.state).toBe('held');
    expect(probe.holder.what).toBe('accept 006');
    expect(probe.holder.pid).toBe(4242);
  });

  it('calls a peer that does not speak the banner a stranger', async () => {
    const port = await freePort();
    servers.push(await peerSaying(port, 'HTTP/1.1 400 Bad Request\n'));
    expect(await probeLane(port)).toEqual({ state: 'stranger' });
  });
});

describe('humanAge', () => {
  it('reads a fresh timestamp in seconds and an old one in minutes', () => {
    expect(humanAge(Date.now() - 5_000)).toBe('5s');
    expect(humanAge(Date.now() - 600_000)).toBe('10m');
  });

  /**
   * @issue DTX-8002
   * A missing or NaN `since` must not render as "started NaNs ago" — the
   * age string is the only thing a blocked human reading the refusal
   * message has to go on.
   */
  it('never renders a missing timestamp as NaN: the message is all a blocked human has', () => {
    expect(humanAge(undefined)).toBe('an unknown time');
    expect(humanAge(Number.NaN)).toBe('an unknown time');
  });
});
