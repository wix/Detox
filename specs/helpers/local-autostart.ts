/**
 * Editable helper shim for spec 011.
 *
 * The product surface is still the `detox test` command. These helpers only
 * isolate the per-user helper state so acceptance tests never touch a
 * developer's real helper cookie, and provide typed setup for future
 * helper-owned states the CLI must observe.
 */
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { isPidAlive } from './project';

export const DETOX_LOCAL_HELPER_ROOT_ENV = 'DETOX_LOCAL_HELPER_ROOT';
export const DEFAULT_LOCAL_SERVER_URL = 'ws://127.0.0.1:8080';

export interface LocalHelperCookie {
  readonly kind: 'detox-local-helper';
  readonly pid: number;
  readonly url: string;
  readonly protocol: number;
  readonly token?: string;
  readonly serverVersion?: string;
  readonly startedAt: string;
}

export interface LocalHelperSandbox extends AsyncDisposable {
  readonly root: string;
  readonly cookiePath: string;
  readonly lockPath: string;
  env(): Readonly<Record<string, string>>;
  stop(): Promise<void>;
}

export async function createLocalHelperSandbox(): Promise<LocalHelperSandbox> {
  const root = await mkdtemp(path.join(tmpdir(), 'detox-local-helper-'));
  await mkdir(root, { recursive: true, mode: 0o700 });
  const cookiePath = path.join(root, 'server.json');
  const lockPath = path.join(root, 'server.lock');

  const stop = async (): Promise<void> => {
    if (!existsSync(cookiePath)) return;
    const cookie = await readLocalHelperCookie({ cookiePath });
    if (isPidAlive(cookie.pid)) {
      process.kill(cookie.pid, 'SIGTERM');
    }
  };

  return {
    root,
    cookiePath,
    lockPath,
    env: () => ({ [DETOX_LOCAL_HELPER_ROOT_ENV]: root }),
    stop,
    [Symbol.asyncDispose]: stop,
  };
}

export async function readLocalHelperCookie(
  source: Pick<LocalHelperSandbox, 'cookiePath'>,
): Promise<LocalHelperCookie> {
  return JSON.parse(await readFile(source.cookiePath, 'utf8')) as LocalHelperCookie;
}

export function assertNoLocalHelperCookie(
  source: Pick<LocalHelperSandbox, 'cookiePath'>,
): void {
  assert.equal(existsSync(source.cookiePath), false, 'the run must not create a local helper cookie');
}

export async function assertLocalHelperCookieIsPrivate(
  source: Pick<LocalHelperSandbox, 'cookiePath'>,
): Promise<void> {
  const mode = (await stat(source.cookiePath)).mode & 0o777;
  assert.equal(mode, 0o600, 'the local helper cookie is private to this user');
}

export async function writeDeadLocalHelperCookie(
  source: Pick<LocalHelperSandbox, 'cookiePath'>,
  fields: Partial<LocalHelperCookie> = {},
): Promise<LocalHelperCookie> {
  const cookie: LocalHelperCookie = {
    kind: 'detox-local-helper',
    pid: Number.MAX_SAFE_INTEGER,
    url: 'ws://127.0.0.1:9',
    protocol: 1,
    token: `dead-${randomUUID()}`,
    serverVersion: '0.0.0-dead',
    startedAt: new Date().toISOString(),
    ...fields,
  };
  await writeFile(source.cookiePath, JSON.stringify(cookie, null, 2), { mode: 0o600 });
  return cookie;
}

export interface IncompatibleLocalHelper extends AsyncDisposable {
  readonly pid: number;
  readonly url: string;
  stop(): Promise<void>;
}

export interface StartIncompatibleLocalHelperOptions {
  readonly activeSessions: number;
}

export function startIncompatibleLocalHelper(
  source: Pick<LocalHelperSandbox, 'cookiePath'>,
  options: StartIncompatibleLocalHelperOptions,
): Promise<IncompatibleLocalHelper> {
  const token = `fixture-${randomUUID()}`;
  const child = spawn(process.execPath, ['-e', INCOMPATIBLE_HELPER_SCRIPT], {
    env: {
      ...process.env,
      DETOX_INCOMPATIBLE_HELPER_TOKEN: token,
      DETOX_INCOMPATIBLE_HELPER_ACTIVE_SESSIONS: String(options.activeSessions),
    },
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });

  return waitForIncompatibleHelper(child).then(async (url) => {
    const helper: IncompatibleLocalHelper = {
      pid: child.pid ?? 0,
      url,
      stop: async (): Promise<void> => {
        if (!isPidAlive(child.pid ?? 0)) return;
        const { promise, resolve } = Promise.withResolvers<void>();
        child.once('exit', () => resolve());
        child.kill('SIGTERM');
        await promise;
      },
      [Symbol.asyncDispose]: async (): Promise<void> => {
        await helper.stop();
      },
    };
    const cookie: LocalHelperCookie = {
      kind: 'detox-local-helper',
      pid: helper.pid,
      url,
      protocol: 0,
      token,
      serverVersion: '0.0.0-incompatible',
      startedAt: new Date().toISOString(),
    };
    await writeFile(source.cookiePath, JSON.stringify(cookie, null, 2), { mode: 0o600 });
    return helper;
  });
}

function waitForIncompatibleHelper(child: ChildProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      child.kill('SIGKILL');
      reject(new Error('timed out waiting for incompatible helper fixture'));
    }, 5_000);
    const cleanup = (): void => {
      clearTimeout(timer);
      child.off('message', onMessage);
      child.off('exit', onExit);
      child.off('error', onError);
    };
    const onMessage = (message: unknown): void => {
      if (typeof message !== 'object' || message === null || Array.isArray(message)) return;
      const url = (message as Record<string, unknown>).url;
      if (typeof url !== 'string') return;
      cleanup();
      resolve(url);
    };
    const onExit = (code: number | null, signal: NodeJS.Signals | null): void => {
      cleanup();
      reject(new Error(`incompatible helper exited before readiness (code=${String(code)}, signal=${String(signal)})`));
    };
    const onError = (err: Error): void => {
      cleanup();
      reject(err);
    };
    child.once('message', onMessage);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

const INCOMPATIBLE_HELPER_SCRIPT = String.raw`
const http = require('node:http');
const { WebSocketServer } = require('ws');

const token = process.env.DETOX_INCOMPATIBLE_HELPER_TOKEN;
const activeSessions = Number(process.env.DETOX_INCOMPATIBLE_HELPER_ACTIVE_SESSIONS || 0);

function authorized(req) {
  return req.headers['x-detox-local-helper-token'] === token;
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/v1/local-helper/')) {
    if (!authorized(req)) {
      res.statusCode = 401;
      res.end('unauthorized');
      return;
    }
    if (req.method === 'GET' && req.url === '/v1/local-helper/status') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        kind: 'detox-local-helper',
        activeSessions,
        holders: activeSessions > 0 ? [{ id: 'fixture-session' }] : [],
      }));
      return;
    }
    if (req.method === 'POST' && req.url === '/v1/local-helper/retire') {
      if (activeSessions > 0) {
        res.statusCode = 409;
        res.end('busy');
        return;
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
      setImmediate(() => server.close(() => process.exit(0)));
      return;
    }
  }
  res.statusCode = 404;
  res.end('not found');
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: '$/serverInfo',
    params: { protocol: 0, server: '0.0.0-incompatible' },
  }));
});

server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  process.send({ url: 'ws://127.0.0.1:' + address.port });
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
`;
