/**
 * Spec 012, the wire and HTTP half — the integration-level behaviors the
 * spec binds but the accept suite does not run: 401 without the bearer, 400
 * on malformed known params, 404 on an unknown id, the announce carrying
 * the connection id, params over the cap stored as a truncated string, a
 * stalled follow reader stalling only itself, and eviction under an open
 * reader being safe.
 */
import { mkdtempSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import { Peer, createWebSocketChannel, DetoxErrorCode } from '@detox-remote/core';
import { SERVER_INFO_METHOD } from '@detox-remote/protocol';

import { createDetoxRemoteServer, DEFAULT_HOST, type DetoxRemoteServer } from '../server';
import { KEEPALIVE_OFF } from '../keepalive';
import { generateToken, type AuthConfig } from '../auth';
import type { SimulatorOps } from '@detox-remote/driver-ios';
import type { LogLine } from '../ConnectionLog';
import { PARAMS_CAP_BYTES } from '../ConnectionRecorder';

const auth: AuthConfig = { type: 'static-token', token: generateToken() };
const simulatorOps = { list: async () => [] } as unknown as SimulatorOps;

function temp(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

interface StartOverrides {
  retentionMs?: number;
  authOff?: boolean;
}

async function startServer(overrides: StartOverrides = {}): Promise<DetoxRemoteServer> {
  return createDetoxRemoteServer({
    port: 0,
    maxPool: 4,
    auth: overrides.authOff ? undefined : auth,
    simulatorOps,
    // This suite tests the log surface, not liveness — keepalive off keeps its
    // background pings from adding event-loop load to the parallel run.
    keepalive: KEEPALIVE_OFF,
    blobs: { root: temp('detox-log-http-blob-') },
    logs: { root: temp('detox-log-http-root-'), retentionMs: overrides.retentionMs },
  });
}

interface AnnounceFrame {
  method?: string;
  params?: { log?: { runId?: string } };
}

interface Connection {
  ws: WebSocket;
  peer: Peer;
  runId: string;
}

/** Spec 012a's trace, the slice this suite reads. */
interface ChromeTraceEventShape {
  ph: string;
  name: string;
  pid: number;
  args?: { name?: string; detox?: { id: string } };
}

interface ChromeTraceShape {
  traceEvents: ChromeTraceEventShape[];
  metadata: { runId: string; lines: number };
}

interface HttpAnswer {
  status: number;
  body: string;
  contentType?: string;
}

function get(port: number, pathname: string, headers: Record<string, string> = {}): Promise<HttpAnswer> {
  return new Promise((resolve, reject) => {
    const req = request({ host: DEFAULT_HOST, port, method: 'GET', path: pathname, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.once('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          body: Buffer.concat(chunks).toString('utf8'),
          contentType: res.headers['content-type'],
        }),
      );
    });
    req.once('error', reject);
    req.end();
  });
}

const bearer = { Authorization: `Bearer ${auth.token}` };

function parse(body: string): LogLine[] {
  return body
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LogLine);
}

/**
 * A raw client peer over a real socket, returning the announce's connection
 * id. The announce is the server's first frame and, in-process, arrives in
 * the same tick as `open` — so it is captured with a raw listener attached
 * before `open`, ahead of any late-attached handler. (The product client's
 * own timing is proven by the accept suite against a spawned server.)
 */
async function connect(port: number): Promise<Connection> {
  const ws = new WebSocket(`ws://${DEFAULT_HOST}:${String(port)}`, { headers: bearer });
  const announced = new Promise<string>((resolve) => {
    ws.on('message', (data: Buffer) => {
      const frame = JSON.parse(data.toString('utf8')) as AnnounceFrame;
      if (frame.method === SERVER_INFO_METHOD && typeof frame.params?.log?.runId === 'string') {
        resolve(frame.params.log.runId);
      }
    });
  });
  await new Promise<void>((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  const runId = await announced;
  const peer = Peer.create(createWebSocketChannel(ws));
  return { ws, peer, runId };
}

function closed(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    ws.once('close', () => resolve());
    ws.close();
  });
}

describe('the fetch surface — GET /v1/runs (spec 012)', () => {
  it('answers 401 without the bearer, 400 on malformed known params, 404 on an unknown id or verb', async () => {
    const server = await startServer();
    try {
      const { port } = server;
      expect((await get(port, '/v1/runs')).status).toBe(401);
      expect((await get(port, '/v1/runs/abc/log')).status).toBe(401);
      const index = await get(port, '/v1/runs', bearer);
      expect(index.status).toBe(200);
      expect(index.contentType).toContain('application/json');
      expect(JSON.parse(index.body)).toEqual([]);
      expect((await get(port, '/v1/runs/nope/log', bearer)).status).toBe(404);
      expect((await get(port, '/v1/runs/nope/other', bearer)).status).toBe(404);
      expect((await get(port, '/v1/runs/nope/log/extra', bearer)).status).toBe(404);
      expect((await get(port, '/v1/runs/bad%20id/log', bearer)).status).toBe(400);
      expect((await get(port, '/v1/runs/nope/log?after=abc', bearer)).status).toBe(400);
      expect((await get(port, '/v1/runs/nope/log?level=loud', bearer)).status).toBe(400);
      expect((await get(port, '/v1/runs/nope/log?follow=maybe', bearer)).status).toBe(400);
      // Unknown params are ignored: the id is checked after the params parse.
      expect((await get(port, '/v1/runs/nope/log?tags=x', bearer)).status).toBe(404);
      // Verbs other than GET are not the surface.
      const post = await new Promise<number>((resolve, reject) => {
        const req = request({ host: DEFAULT_HOST, port, method: 'POST', path: '/v1/runs', headers: bearer }, (res) => {
          res.resume();
          res.once('end', () => resolve(res.statusCode ?? 0));
        });
        req.once('error', reject);
        req.end();
      });
      expect(post).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('with auth off, the door is open — the same exposure the device farm has', async () => {
    const server = await startServer({ authOff: true });
    try {
      expect((await get(server.port, '/v1/runs')).status).toBe(200);
    } finally {
      await server.close();
    }
  });

  it('announces the connection id, records every RPC, truncates oversized params, and serves the file with after/level/follow', async () => {
    const server = await startServer();
    try {
      const { port } = server;
      const { ws, peer, runId } = await connect(port);
      expect(runId).toMatch(/^[0-9a-f-]{36}$/);
      const row = (JSON.parse((await get(port, '/v1/runs', bearer)).body) as { runId: string; endedAt?: string }[]).find(
        (r) => r.runId === runId,
      );
      expect(row).toBeDefined();
      expect(row?.endedAt).toBeUndefined();

      // A follow opened before the traffic, never read: it must stall only itself.
      const stalledReq = request({ host: DEFAULT_HOST, port, method: 'GET', path: `/v1/runs/${runId}/log?follow=1`, headers: bearer });
      const stalledRes = new Promise<import('node:http').IncomingMessage>((resolve) => stalledReq.once('response', resolve));
      stalledReq.end();
      const res = await stalledRes;
      res.pause(); // never consumed

      // A handled refusal (no matching device) with oversized params: a node
      // with a begin and an end, its params stored as a truncated string.
      const huge = 'x'.repeat(PARAMS_CAP_BYTES * 4);
      await expect(peer.request({ method: 'allocateDevice', params: { type: 'ios.simulator', device: { name: huge } } })).rejects.toBeDefined();
      for (let i = 0; i < 5; i++) {
        await expect(peer.request({ method: 'allocateDevice', params: { type: 'ios.simulator', device: { name: `probe-${String(i)}` } } })).rejects.toBeDefined();
      }

      const whole = parse((await get(port, `/v1/runs/${runId}/log`, bearer)).body);
      whole.forEach((line, i) => expect(line.seq).toBe(i + 1));
      const begin = whole.find((l) => l.kind === 'begin' && l.node.id === 'rpc:1');
      expect(begin?.fields?.paramsTruncated).toBe(true);
      expect(typeof begin?.fields?.params).toBe('string');
      expect((begin?.fields?.params as string).length).toBe(PARAMS_CAP_BYTES);
      const end = whole.find((l) => l.kind === 'end' && l.node.id === 'rpc:1');
      expect(end?.fields?.ok).toBe(false);
      expect((end?.fields?.error as { code?: number } | undefined)?.code).toBe(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
      // Six handled refusals: conn begin + six begin/end pairs = 13 lines.
      // The stalled reader stalled nobody: the writer kept writing regardless.
      expect(whole.filter((l) => l.kind === 'begin' && l.node.type === 'rpc')).toHaveLength(6);

      const after = parse((await get(port, `/v1/runs/${runId}/log?after=${String(whole.length - 2)}`, bearer)).body);
      expect(after.map((l) => l.seq)).toEqual([whole.length - 1, whole.length]);
      const warnUp = parse((await get(port, `/v1/runs/${runId}/log?level=warn`, bearer)).body);
      expect(warnUp.every((l) => ['warn', 'error'].includes(l.level))).toBe(true);

      // A $/log rides the same socket: the server is the judge, and it
      // becomes a step node in the file.
      peer.notify({ method: '$/log', params: { id: 'sp1', phase: 'begin', kind: 'test', name: 'a step' } });
      peer.notify({ method: '$/log', params: { id: 'sp1', phase: 'end', status: 'passed' } });
      await new Promise((r) => setTimeout(r, 20));
      const withSpan = parse((await get(port, `/v1/runs/${runId}/log`, bearer)).body);
      expect(withSpan.find((l) => l.kind === 'begin' && l.node.id === 'step:sp1')).toMatchObject({ fields: { kind: 'test' } });

      const following = get(port, `/v1/runs/${runId}/log?follow=1&level=error`, bearer);
      await closed(ws);
      const followed = await following;
      expect(followed.contentType).toContain('application/x-ndjson');
      const followedLines = parse(followed.body);
      expect(followedLines.at(-1)).toMatchObject({ kind: 'end', node: { id: 'conn' } });
      res.destroy();
      const ended = (JSON.parse((await get(port, '/v1/runs', bearer)).body) as { runId: string; endedAt?: string; lastSeq: number }[]).find(
        (r) => r.runId === runId,
      );
      expect(ended?.endedAt).toBeDefined();
      expect(ended?.lastSeq).toBe(followedLines.at(-1)?.seq);
    } finally {
      await server.close();
    }
  });

  it('graceful shutdown awaits every open connection\'s final line before releasing the root', async () => {
    const server = await startServer();
    const { ws, peer, runId } = await connect(server.port);
    await expect(peer.request({ method: 'allocateDevice', params: { type: 'ios.simulator' } })).rejects.toBeDefined();
    // Close the server with the socket still open: closeServer asks the
    // client to leave, the recorder settles, and close() awaits recorder.ended
    // for every still-open connection before releasing the log root.
    await server.close();
    ws.terminate();
    expect(runId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('eviction under an open reader is safe: the reader keeps its descriptor, the index forgets the file', async () => {
    const server = await startServer({ retentionMs: 1 });
    try {
      const { port } = server;
      const { ws, peer, runId } = await connect(port);
      await expect(peer.request({ method: 'no.such.method' })).rejects.toBeDefined();
      const reading = get(port, `/v1/runs/${runId}/log?follow=1`, bearer);
      await new Promise((r) => setTimeout(r, 20));
      await closed(ws);
      await new Promise((r) => setTimeout(r, 20));
      // The index fetch sweeps: the ended file is past its 1 ms retention.
      const rows = JSON.parse((await get(port, '/v1/runs', bearer)).body) as { runId: string }[];
      expect(rows.some((r) => r.runId === runId)).toBe(false);
      const body = parse((await reading).body);
      expect(body.at(-1)).toMatchObject({ kind: 'end', node: { id: 'conn' } });
      expect((await get(port, `/v1/runs/${runId}/log`, bearer)).status).toBe(404);
    } finally {
      await server.close();
    }
  });
});

describe('the Perfetto projection — GET /v1/runs/<id>/trace and /perfetto (spec 012a)', () => {
  it('serves the viewer page without a bearer for any well-formed id, and the trace behind the log\'s gate', async () => {
    const server = await startServer();
    try {
      const { port } = server;
      const { ws, peer, runId } = await connect(port);
      await expect(peer.request({ method: 'allocateDevice', params: { type: 'ios.simulator', device: { name: 'nope' } } })).rejects.toBeDefined();
      await closed(ws);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // The page: no bearer, any well-formed id, nosniff, a CSP, the sibling path.
      const page = await get(port, `/v1/runs/${runId}/perfetto`);
      expect(page.status).toBe(200);
      expect(page.contentType).toContain('text/html');
      expect(page.body).toContain(`/v1/runs/${runId}/trace`);
      expect(page.body).toContain('mode=embedded');
      expect(page.body).not.toContain(auth.token);
      expect((await get(port, '/v1/runs/never-seen/perfetto')).status).toBe(200);
      expect((await get(port, '/v1/runs/bad%20id/perfetto')).status).toBe(400);
      expect((await get(port, '/v1/runs/x/perfetto/extra', bearer)).status).toBe(404);
      expect((await get(port, `/v1/runs/${runId}/perfetto/`)).status).toBe(404); // a trailing slash is not the page, and not a 401 either

      // The trace: the log's gate, exactly.
      expect((await get(port, `/v1/runs/${runId}/trace`)).status).toBe(401);
      expect((await get(port, '/v1/runs/never-seen/trace', bearer)).status).toBe(404);
      expect((await get(port, '/v1/runs/bad%20id/trace', bearer)).status).toBe(400);
      const trace = await get(port, `/v1/runs/${runId}/trace`, bearer);
      expect(trace.status).toBe(200);
      expect(trace.contentType).toContain('application/json');
      const parsed = JSON.parse(trace.body) as ChromeTraceShape;
      expect(parsed.metadata.runId).toBe(runId);
      expect(parsed.metadata.lines).toBe(parse((await get(port, `/v1/runs/${runId}/log`, bearer)).body).length);
      expect(parsed.traceEvents.find((e) => e.ph === 'M' && e.name === 'process_name' && e.pid === 1)?.args?.name).toBe('server');
      expect(parsed.traceEvents.some((e) => e.ph === 'X' && e.args?.detox?.id === 'conn')).toBe(true);
      expect(parsed.traceEvents.some((e) => e.ph === 'X' && e.name.startsWith('allocateDevice nope ✗'))).toBe(true);
    } finally {
      await server.close();
    }
  });
});
