/**
 * The relay process over real sockets (spec 008 integration-gated items):
 * auth on both hops (and the proof the client's Authorization never
 * crosses), the relay's own blob lane, close propagation with no grace
 * timer, the keepalive verdict's 4001 on the client hop, startup failures,
 * and the CLI's IPC announce.
 */
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import type { Socket } from 'node:net';
import type { IncomingMessage } from 'node:http';

import { describe, it, expect } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';

import { generateToken, type AuthConfig } from '@detox-remote/server';

import { createDetoxRelay, type DetoxRelay } from '../relay';
import type { RelayNodeConfig } from '../nodes';

const CLIENT_TOKEN = generateToken();
const NODE_TOKEN = generateToken();
const auth: AuthConfig = { type: 'static-token', token: CLIENT_TOKEN };

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface FakeNode {
  config: RelayNodeConfig;
  /** Authorization header of every upstream handshake, in arrival order. */
  authHeaders: (string | undefined)[];
  /** Frames each upstream connection delivered. */
  frames: Record<string, unknown>[];
  connectionCount: () => number;
  closedCount: () => number;
  close(): Promise<void>;
}

/** A scripted node: refuses every allocation with 2001, records everything. */
function fakeNode(name: string): Promise<FakeNode> {
  const authHeaders: (string | undefined)[] = [];
  const frames: Record<string, unknown>[] = [];
  let connections = 0;
  let closes = 0;
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  wss.on('connection', (ws, req: IncomingMessage) => {
    connections += 1;
    authHeaders.push(req.headers.authorization);
    ws.on('close', () => {
      closes += 1;
    });
    ws.on('message', (data: Buffer) => {
      const frame = JSON.parse(data.toString()) as Record<string, unknown>;
      frames.push(frame);
      if (frame.method === 'allocateDevice') {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: frame.id,
            error: { code: 2001, message: 'full', data: { holders: [] } },
          }),
        );
      }
    });
  });
  return new Promise((resolve) => {
    wss.once('listening', () => {
      const addr = wss.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        config: { name, url: `ws://127.0.0.1:${String(port)}`, token: NODE_TOKEN },
        authHeaders,
        frames,
        connectionCount: () => connections,
        closedCount: () => closes,
        close: () =>
          new Promise((done) => {
            for (const ws of wss.clients) ws.terminate();
            wss.close(() => done());
          }),
      });
    });
  });
}

interface KeepaliveTuning {
  intervalMs: number;
  maxMissedPongs: number;
}

/** The slices of wire frames these tests read. */
interface WireErrorSlice {
  code: number;
}

interface ErrorResponseSlice {
  error?: WireErrorSlice;
}

interface AllocResultSlice {
  allocationId?: string;
}

interface AllocResponseSlice {
  result?: AllocResultSlice;
}

/** The raw TCP socket `ws` hides — private but stable across `ws` majors. */
interface HasRawSocket {
  _socket: Socket;
}

interface IpcMessageSlice {
  type?: string;
  url?: string;
}

function startRelay(nodes: RelayNodeConfig[], keepalive?: KeepaliveTuning): Promise<DetoxRelay> {
  return createDetoxRelay({
    port: 0,
    auth,
    nodes,
    keepalive,
    blobs: { root: mkdtempSync(path.join(tmpdir(), 'relay-test-blobs-')) },
  });
}

function connectClient(port: number, token = CLIENT_TOKEN): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${String(port)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
    ws.once('unexpected-response', (_req, res) =>
      reject(new Error(`handshake refused: HTTP ${String(res.statusCode)}`)),
    );
  });
}

function httpStatus(
  port: number,
  method: string,
  urlPath: string,
  options: { token?: string; body?: Buffer } = {},
): Promise<number> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.body) headers['Content-Length'] = String(options.body.length);
    const req = request({ host: '127.0.0.1', port, method, path: urlPath, headers }, (res) => {
      res.resume();
      res.once('end', () => resolve(res.statusCode ?? 0));
    });
    req.once('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

describe('createDetoxRelay', () => {
  it('refuses to start over zero nodes or an unusable token', async () => {
    await expect(startRelay([])).rejects.toThrow(/zero nodes/);
    await expect(
      createDetoxRelay({ port: 0, auth: { type: 'static-token', token: 'x' }, nodes: [{ name: 'a', url: 'ws://127.0.0.1:1', token: 't' }] }),
    ).rejects.toThrow(/token/);
  });

  it('rejects a wrong client token with 401 at the handshake', async () => {
    const node = await fakeNode('mac-a');
    const relay = await startRelay([node.config]);
    try {
      await expect(connectClient(relay.port, 'wrong-token')).rejects.toThrow(/401/);
    } finally {
      await relay.close();
      await node.close();
    }
  });

  /**
   * @issue DTX-7033
   * Each node dials upstream with its own token: this map never
   * reads the client's `Authorization` header at all, so there is no path
   * for a client's token to reach a node it never provisioned.
   */
  it('never forwards the client\'s Authorization upstream — the node sees only ITS token', async () => {
    const node = await fakeNode('mac-a');
    const relay = await startRelay([node.config]);
    const client = await connectClient(relay.port);
    try {
      const answered = new Promise<Record<string, unknown>>((resolve) => {
        client.once('message', (data: Buffer) => resolve(JSON.parse(data.toString()) as Record<string, unknown>));
      });
      client.send(JSON.stringify({ jsonrpc: '2.0', id: '1', method: 'allocateDevice', params: {} }));
      const response = (await answered) as ErrorResponseSlice;
      expect(response.error?.code).toBe(2001);

      expect(node.authHeaders).toEqual([`Bearer ${NODE_TOKEN}`]);
      expect(node.authHeaders[0]).not.toContain(CLIENT_TOKEN);
    } finally {
      client.close();
      await relay.close();
      await node.close();
    }
  });

  /**
   * @issue DTX-7037
   * A session closes every upstream socket at once, immediately and
   * unconditionally, on any client close — a goodbye or the keepalive
   * verdict. Closing the socket is what fires each node's own reclaim:
   * client⇄relay is the lease here, the same as client⇄server without one.
   */
  it('propagates a client goodbye to every upstream socket at once — no grace timer anywhere', async () => {
    const node = await fakeNode('mac-a');
    const relay = await startRelay([node.config]);
    const client = await connectClient(relay.port);
    try {
      const answered = new Promise<void>((resolve) => {
        client.once('message', () => resolve());
      });
      client.send(JSON.stringify({ jsonrpc: '2.0', id: '1', method: 'allocateDevice', params: {} }));
      await answered; // the upstream socket exists now
      expect(node.connectionCount()).toBe(1);
      expect(node.closedCount()).toBe(0);

      client.close();
      const deadline = Date.now() + 2_000;
      while (node.closedCount() === 0 && Date.now() < deadline) await sleep(10);
      expect(node.closedCount()).toBe(1);
    } finally {
      await relay.close();
      await node.close();
    }
  });

  it('serves its OWN blob lane under its OWN token: PUT→HEAD hit, GET 404, off-lane 404, 401 unauthorized', async () => {
    const node = await fakeNode('mac-a');
    const relay = await startRelay([node.config]);
    try {
      const bytes = randomBytes(64);
      const hex = createHash('sha256').update(bytes).digest('hex');
      const lanePath = `/v1/blobs/sha256/${hex}`;
      expect(await httpStatus(relay.port, 'HEAD', lanePath, { token: CLIENT_TOKEN })).toBe(404);
      expect(await httpStatus(relay.port, 'PUT', lanePath, { token: CLIENT_TOKEN, body: bytes })).toBe(201);
      expect(await httpStatus(relay.port, 'HEAD', lanePath, { token: CLIENT_TOKEN })).toBe(200);
      expect(await httpStatus(relay.port, 'GET', lanePath, { token: CLIENT_TOKEN })).toBe(404);
      expect(await httpStatus(relay.port, 'HEAD', lanePath)).toBe(401);
      expect(await httpStatus(relay.port, 'GET', '/anything/else', { token: CLIENT_TOKEN })).toBe(404);
    } finally {
      await relay.close();
      await node.close();
    }
  });

  it('reports its bind host, and refuses a port already in use instead of half-starting', async () => {
    const node = await fakeNode('mac-a');
    const relay = await startRelay([node.config]);
    try {
      expect(relay.host).toBe('127.0.0.1');
      await expect(
        createDetoxRelay({
          port: relay.port,
          auth,
          nodes: [node.config],
          blobs: { root: mkdtempSync(path.join(tmpdir(), 'relay-test-blobs-')) },
        }),
      ).rejects.toMatchObject({ code: 'EADDRINUSE' });
    } finally {
      await relay.close();
      await node.close();
    }
  });

  it('routes installApp {blob} through the bridge — a node with no lane yields a typed 2016', async () => {
    // The fake node speaks only ws: its HTTP side answers the bridge's HEAD
    // with an upgrade refusal, so staging fails typed — which proves the
    // production wiring (BlobLaneClient with the node's token + the relay's
    // own store) is what the session calls.
    const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    wss.on('connection', (ws) => {
      ws.on('message', (data: Buffer) => {
        const frame = JSON.parse(data.toString()) as Record<string, unknown>;
        if (frame.method === 'allocateDevice') {
          ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: frame.id,
              result: { allocationId: 'alloc-1', device: { udid: 'u-1' }, name: 'iPhone', os: 'iOS', state: 'booted' },
            }),
          );
        }
      });
    });
    await new Promise<void>((resolve) => wss.once('listening', resolve));
    const addr = wss.address();
    const nodePort = typeof addr === 'object' && addr ? addr.port : 0;
    const relay = await startRelay([
      { name: 'mac-a', url: `ws://127.0.0.1:${String(nodePort)}`, token: NODE_TOKEN },
    ]);
    const client = await connectClient(relay.port);
    try {
      const responses: Record<string, unknown>[] = [];
      client.on('message', (data: Buffer) => {
        const frame = JSON.parse(data.toString()) as Record<string, unknown>;
        // Answers only: the relay's own $/serverInfo announce and
        // any other notification would otherwise shift responses[0].
        if ('id' in frame) responses.push(frame);
      });
      client.send(JSON.stringify({ jsonrpc: '2.0', id: '1', method: 'allocateDevice', params: {} }));
      const deadline = Date.now() + 5_000;
      while (responses.length < 1 && Date.now() < deadline) await sleep(10);
      const allocationId = (responses[0] as AllocResponseSlice).result?.allocationId;
      expect(allocationId).toBeDefined();

      const hex = createHash('sha256').update(randomBytes(8)).digest('hex');
      client.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: '2',
          method: 'installApp',
          params: { allocationId, blob: { algo: 'sha256', hex } },
        }),
      );
      while (responses.length < 2 && Date.now() < deadline) await sleep(10);
      const install = responses[1] as ErrorResponseSlice;
      expect(install.error?.code).toBe(2016);
    } finally {
      client.close();
      await relay.close();
      await new Promise<void>((resolve) => {
        for (const ws of wss.clients) ws.terminate();
        wss.close(() => resolve());
      });
    }
  });

  it('close() insists after the grace: a client ignoring the goodbye is terminated, not waited on', async () => {
    const node = await fakeNode('mac-a');
    const relay = await startRelay([node.config]);
    const client = await connectClient(relay.port);
    const died = new Promise<void>((resolve) => {
      client.once('close', () => resolve());
      client.on('error', () => {});
    });
    // Pause the raw socket: the polite close frame can never be answered, so
    // only the hard-kill arm of the choreography can finish the close.
    (client as unknown as HasRawSocket)._socket.pause();
    const closed = relay.close();
    await Promise.race([
      closed,
      sleep(5_000).then(() => {
        throw new Error('relay.close() hung on an unresponsive client');
      }),
    ]);
    (client as unknown as HasRawSocket)._socket.resume();
    await died;
    await node.close();
  });

  it('runs the keepalive verdict on the client hop: silent client → 4001 with a cause-naming reason', async () => {
    const node = await fakeNode('mac-a');
    const relay = await startRelay([node.config], { intervalMs: 50, maxMissedPongs: 2 });
    const client = await connectClient(relay.port);
    try {
      const death = new Promise<{ code: number; reason: string }>((resolve) => {
        client.once('close', (code, reason) => resolve({ code, reason: reason.toString() }));
        client.on('error', () => {});
      });
      const socket = (client as unknown as HasRawSocket)._socket;
      socket.pause();
      await sleep(600);
      socket.resume();
      const closeEvent = await Promise.race([
        death,
        sleep(2_000).then(() => {
          throw new Error('relay never terminated the silent client');
        }),
      ]);
      expect(closeEvent.code).toBe(4001);
      expect(closeEvent.reason).toMatch(/keepalive/);
    } finally {
      await relay.close();
      await node.close();
    }
  });
});

describe('detox-relay CLI (spawned)', () => {
  const CLI = path.resolve(process.cwd(), 'packages', 'relay', 'src', 'cli.ts');

  interface CliRun {
    exitCode: number | null;
    stderr: string;
    listening?: { type: string; url: string };
  }

  function runCli(args: string[], env: Record<string, string> = {}, killAfterListening = false): Promise<CliRun> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', CLI, ...args], {
        cwd: process.cwd(),
        env: { ...process.env, ...env },
        stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
      });
      let stderr = '';
      let listening: CliRun['listening'];
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('message', (message) => {
        const msg = message as IpcMessageSlice;
        if (msg.type === 'listening' && typeof msg.url === 'string') {
          listening = { type: msg.type, url: msg.url };
          if (killAfterListening) child.kill('SIGKILL');
        }
      });
      child.once('exit', (code) => resolve({ exitCode: code, stderr, listening }));
      child.once('error', reject);
      setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`CLI run timed out; stderr so far: ${stderr}`));
      }, 30_000).unref();
    });
  }

  it('startup failures exit non-zero: missing --nodes, zero nodes, unreadable file — tokens never echoed', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'relay-cli-test-'));
    const empty = path.join(dir, 'empty.json');
    writeFileSync(empty, '[]');
    const env = { DETOX_RELAY_TOKEN: CLIENT_TOKEN };

    const missing = await runCli([], env);
    expect(missing.exitCode).toBe(1);
    expect(missing.stderr).toMatch(/--nodes/);

    const zero = await runCli(['--nodes', empty], env);
    expect(zero.exitCode).toBe(1);
    expect(zero.stderr).toMatch(/zero nodes/);

    const unreadable = await runCli(['--nodes', path.join(dir, 'absent.json')], env);
    expect(unreadable.exitCode).toBe(1);
    expect(unreadable.stderr).toMatch(/Could not read/);

    for (const run of [missing, zero, unreadable]) {
      expect(run.stderr).not.toContain(CLIENT_TOKEN);
    }
  }, 90_000);

  it('announces {type:"listening", url} over IPC once bound — nodes are dialed lazily, so none need be up', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'relay-cli-ok-'));
    const nodesFile = path.join(dir, 'nodes.json');
    writeFileSync(
      nodesFile,
      JSON.stringify([{ name: 'mac-a', url: 'ws://127.0.0.1:1', token: 'node-token' }]),
    );
    const run = await runCli(
      ['--nodes', nodesFile, '--port', '0'],
      { DETOX_RELAY_TOKEN: CLIENT_TOKEN, DETOX_BLOB_ROOT: mkdtempSync(path.join(tmpdir(), 'relay-cli-blobs-')) },
      true,
    );
    expect(run.listening?.type).toBe('listening');
    expect(run.listening?.url).toMatch(/^ws:\/\/127\.0\.0\.1:\d+$/);
  }, 90_000);
});

describe('the version announce', () => {
  /**
   * @issue DTX-2005
   * Version identity is hop-pairwise, like auth: the relay announces
   * its own versions to its clients rather than a node's, so a client is
   * never shown a version it isn't actually talking to.
   */
  it("the relay's first frame to a client is ITS OWN $/serverInfo — hop-pairwise like auth", async () => {
    const relay = await startRelay([{ name: 'mac-a', url: 'ws://127.0.0.1:1', token: 'x' }]);
    try {
      const ws = new WebSocket(`ws://127.0.0.1:${String(relay.port)}`, {
        headers: { Authorization: `Bearer ${CLIENT_TOKEN}` },
      });
      const first = await new Promise<Record<string, unknown>>((resolve, reject) => {
        ws.once('message', (data: Buffer) => resolve(JSON.parse(data.toString('utf8')) as Record<string, unknown>));
        ws.once('error', reject);
      });
      expect(first).toMatchObject({
        method: '$/serverInfo',
        params: { protocol: 1 },
      });
      ws.close();
    } finally {
      await relay.close();
    }
  });
});
