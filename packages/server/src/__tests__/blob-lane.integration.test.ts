/**
 * The blob lane's BINDING integration tests (spec 007, "The wire contract —
 * integration-gated"): a real listening Detox Server on a real loopback
 * socket, spoken to by a raw HTTP client — three behaviors that need a
 * real socket but no simulator, so they live at integration level rather
 * than in the accept suite:
 *
 *   - the wire fence: the status vocabulary end to end;
 *   - crash safety: a mid-body death stores nothing and never blocks the
 *     retry;
 *   - budget + LRU: eviction by byte budget at admission, LRU on last USE,
 *     exactly one victim, no timer.
 *
 * The raw client is PORTED from `specs/helpers/blob-lane.ts` (the reference
 * client — "port or import it"): same verbs, same one path shape, same
 * die-mid-body trick.
 */
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createDetoxRemoteServer, type DetoxRemoteServer } from '../server';
import { generateToken, type AuthConfig } from '../auth';
import type { SimulatorOps } from '../SimulatorOps';

const auth: AuthConfig = { type: 'static-token', token: generateToken() };

// Hermetic: no simctl. The lane never touches devices, but the server's
// reconcile loop starts with it and must not spawn real listings.
const simulatorOps = { list: async () => [] } as unknown as SimulatorOps;

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** The one path shape of the lane (verbatim). */
function blobPath(name: string): string {
  return `/v1/blobs/${name}`;
}

interface SendOptions {
  authorized?: boolean;
  /** Skip Content-Length (chunked transfer) — the 411 probe. */
  chunked?: boolean;
}

function send(
  port: number,
  method: 'HEAD' | 'PUT' | 'GET',
  name: string,
  body?: Buffer,
  options: SendOptions = {},
): Promise<number> {
  const headers: Record<string, string> = {};
  if (options.authorized !== false) headers.Authorization = `Bearer ${auth.token}`;
  if (body && !options.chunked) headers['Content-Length'] = String(body.length);
  return new Promise<number>((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method, path: blobPath(name), headers }, (res) => {
      res.resume(); // only the status is the contract here
      res.once('end', () => resolve(res.statusCode ?? 0));
    });
    req.once('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * A `PUT` that declares its full Content-Length, sends only `sendBytes` of
 * the body, then destroys its socket — a client dying mid-upload. There is
 * deliberately no status to return; the peer never finished the request.
 */
function putInterrupted(port: number, hex: string, body: Buffer, sendBytes: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const req = request({
      host: '127.0.0.1',
      port,
      method: 'PUT',
      path: blobPath(`sha256/${hex}`),
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Length': String(body.length),
      },
    });
    req.once('error', () => resolve());
    req.once('close', () => resolve());
    req.write(body.subarray(0, sendBytes), () => {
      // Flushed the partial body — now vanish without end(): the peer sees a
      // connection that promised more bytes and died.
      req.destroy();
    });
  });
}

async function startLaneServer(budgetBytes?: number): Promise<DetoxRemoteServer> {
  return createDetoxRemoteServer({
    port: 0,
    maxPool: 4,
    auth,
    simulatorOps,
    blobs: {
      root: mkdtempSync(path.join(tmpdir(), 'detox-blob-int-')),
      ...(budgetBytes === undefined ? {} : { budgetBytes }),
    },
  });
}

describe('the wire fence (spec 007)', () => {
  let server: DetoxRemoteServer;
  beforeAll(async () => {
    server = await startLaneServer();
  });
  afterAll(async () => {
    await server.close();
  });

  it('HEAD absent→404 / present→200; PUT verifies the digest; GET never serves', async () => {
    const bytes = randomBytes(64 * 1024);
    const hex = sha256Hex(bytes);
    const port = server.port;

    // Absent: nothing reveals anything.
    expect(await send(port, 'HEAD', `sha256/${hex}`)).toBe(404);

    // A lying digest is refused and stores NOTHING — the store can never
    // hold bytes whose name lies.
    const lyingName = sha256Hex(Buffer.from('something else'));
    expect(await send(port, 'PUT', `sha256/${lyingName}`, bytes)).toBe(400);
    expect(await send(port, 'HEAD', `sha256/${lyingName}`)).toBe(404);

    // Honest PUT stores fresh; the same PUT again is idempotent.
    expect(await send(port, 'PUT', `sha256/${hex}`, bytes)).toBe(201);
    expect(await send(port, 'HEAD', `sha256/${hex}`)).toBe(200);
    expect(await send(port, 'PUT', `sha256/${hex}`, bytes)).toBe(200);

    // A non-digest name is malformed, not "not found".
    expect(await send(port, 'HEAD', 'sha256/not-a-digest')).toBe(400);
    expect(await send(port, 'PUT', 'sha256/not-a-digest', bytes)).toBe(400);
    expect(await send(port, 'HEAD', `md5/${hex}`)).toBe(400);

    // @issue DTX-6203: without the token both verbs are turned away, and an
    // unauthorized PUT stores nothing.
    const freshBytes = randomBytes(1024);
    const freshHex = sha256Hex(freshBytes);
    expect(await send(port, 'HEAD', `sha256/${hex}`, undefined, { authorized: false })).toBe(401);
    expect(await send(port, 'PUT', `sha256/${freshHex}`, freshBytes, { authorized: false })).toBe(401);
    expect(await send(port, 'HEAD', `sha256/${freshHex}`)).toBe(404);

    // GET answers 404 even for a PRESENT blob: no download URL is ever
    // minted, and the negative space reveals nothing.
    expect(await send(port, 'GET', `sha256/${hex}`)).toBe(404);
  });

  it('a PUT with no Content-Length is refused — admission needs the size up front (411)', async () => {
    const bytes = randomBytes(1024);
    const hex = sha256Hex(bytes);
    expect(await send(server.port, 'PUT', `sha256/${hex}`, bytes, { chunked: true })).toBe(411);
    expect(await send(server.port, 'HEAD', `sha256/${hex}`)).toBe(404);
  });

  it('anything off the lane answers 404, tokened or not', async () => {
    // The port carries exactly two things: the ws upgrade and the lane.
    const probe = (p: string): Promise<number> =>
      new Promise((resolve, reject) => {
        const req = request(
          {
            host: '127.0.0.1',
            port: server.port,
            method: 'GET',
            path: p,
            headers: { Authorization: `Bearer ${auth.token}` },
          },
          (res) => {
            res.resume();
            res.once('end', () => resolve(res.statusCode ?? 0));
          },
        );
        req.once('error', reject);
        req.end();
      });
    expect(await probe('/')).toBe(404);
    expect(await probe('/v1/devices')).toBe(404);
  });
});

describe('crash safety (spec 007)', () => {
  it('a PUT that dies mid-body stores nothing, and the retry succeeds', async () => {
    const server = await startLaneServer();
    try {
      const bytes = randomBytes(256 * 1024);
      const hex = sha256Hex(bytes);
      const port = server.port;

      await putInterrupted(port, hex, bytes, 64 * 1024);
      expect(await send(port, 'HEAD', `sha256/${hex}`)).toBe(404);

      // The debris never blocks the retry.
      expect(await send(port, 'PUT', `sha256/${hex}`, bytes)).toBe(201);
      expect(await send(port, 'HEAD', `sha256/${hex}`)).toBe(200);
    } finally {
      await server.close();
    }
  });
});

describe('budget + LRU (spec 007)', () => {
  it('with a 2 MiB budget and three 700 KiB blobs, a HEAD touch decides the ONE victim', async () => {
    const server = await startLaneServer(2 * 1024 * 1024);
    try {
      const port = server.port;
      const first = randomBytes(700 * 1024);
      const second = randomBytes(700 * 1024);
      const third = randomBytes(700 * 1024);
      const firstHex = sha256Hex(first);
      const secondHex = sha256Hex(second);
      const thirdHex = sha256Hex(third);

      expect(await send(port, 'PUT', `sha256/${firstHex}`, first)).toBe(201);
      expect(await send(port, 'PUT', `sha256/${secondHex}`, second)).toBe(201);

      // @issue DTX-6204: a HEAD hit is a use — it makes the first blob
      // fresher than the second, so admission of the third evicts the
      // second, LRU on last use, never upload order.
      expect(await send(port, 'HEAD', `sha256/${firstHex}`)).toBe(200);
      expect(await send(port, 'PUT', `sha256/${thirdHex}`, third)).toBe(201);

      // Exactly one victim, and it is the least-recently-USED one.
      expect(await send(port, 'HEAD', `sha256/${secondHex}`)).toBe(404);
      expect(await send(port, 'HEAD', `sha256/${firstHex}`)).toBe(200);
      expect(await send(port, 'HEAD', `sha256/${thirdHex}`)).toBe(200);
    } finally {
      await server.close();
    }
  });

  it('a single blob larger than the whole budget can never be admitted (413)', async () => {
    const server = await startLaneServer(64 * 1024);
    try {
      const bytes = randomBytes(128 * 1024);
      const hex = sha256Hex(bytes);
      expect(await send(server.port, 'PUT', `sha256/${hex}`, bytes)).toBe(413);
      expect(await send(server.port, 'HEAD', `sha256/${hex}`)).toBe(404);
    } finally {
      await server.close();
    }
  });
});
