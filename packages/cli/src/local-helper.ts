import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import WebSocket from 'ws';
import { PROTOCOL_VERSION, SERVER_INFO_METHOD, type ServerInfoNotification } from '@detox-remote/protocol';

import { SERVER_SETTINGS } from '@detox-remote/server';

import { UsageError } from './errors';

const HELPER_ROOT_ENV = 'DETOX_LOCAL_HELPER_ROOT';
const HELPER_TOKEN_ENV = 'DETOX_LOCAL_HELPER_TOKEN';
const COOKIE_FILE = 'server.json';
const LOCK_FILE = 'server.lock';
const ADMIN_STATUS_PATH = '/v1/local-helper/status';
const ADMIN_RETIRE_PATH = '/v1/local-helper/retire';
const LOCK_TIMEOUT_MS = 10_000;
const LOCK_STALE_MS = 30_000;
const POLL_MS = 50;
const PROBE_TIMEOUT_MS = 2_000;
const ADMIN_TIMEOUT_MS = 2_000;
const SPAWN_TIMEOUT_MS = 15_000;
const STOP_TIMEOUT_MS = 5_000;

interface LocalHelperCookie {
  kind: 'detox-local-helper';
  pid: number;
  url: string;
  protocol: number;
  token: string;
  serverVersion?: string;
  startedAt: string;
}

interface HelperStatus {
  kind: 'detox-local-helper';
  activeSessions: number;
  holders: unknown[];
}

interface ServerInfoProbe {
  protocol: number;
  server: string;
}

interface HelperPaths {
  root: string;
  cookiePath: string;
  lockPath: string;
}

interface NodeError {
  code?: unknown;
}

export async function ensureLocalHelper(signal?: AbortSignal): Promise<string> {
  return withHelperLock(signal, async (paths) => {
    const existing = await readCookie(paths.cookiePath);
    if (existing !== undefined && isPidAlive(existing.pid)) {
      const status = await fetchHelperStatus(existing, signal).catch(() => undefined);
      const info = await probeServerInfo(existing.url, signal).catch(() => undefined);
      if (info !== undefined) {
        if (info.protocol === PROTOCOL_VERSION) return existing.url;
        await retireIncompatibleHelper(existing, info, status, signal);
      } else if (status !== undefined) {
        await retireUnreachableOwnedHelper(existing, status, signal);
      } else {
        throw new UsageError(
          `detox test: local helper pid ${String(existing.pid)} is still alive, but ${existing.url} ` +
            'does not answer and its helper admin status could not be verified. ' +
            'Not starting a second default server; run `detox server --restart` when it is safe.',
        );
      }
    }

    const fresh = await spawnHelper(paths.cookiePath, signal);
    return fresh.url;
  });
}

/** What `detox logs` needs of the helper (spec 013): where it listens. The helper's tester door runs with auth off; the cookie's token is the admin token, never a bearer. */
export interface LocalHelperAddress {
  url: string;
}

/**
 * The detached helper's address, when one is alive (spec 013's `detox
 * logs`): the cookie read, nothing spawned, nothing locked — a reader must
 * never start a server. `undefined` when there is no cookie or its pid is
 * gone.
 */
export async function readLocalHelperAddress(): Promise<LocalHelperAddress | undefined> {
  const existing = await readCookie(helperPaths().cookiePath);
  if (existing === undefined || !isPidAlive(existing.pid)) return undefined;
  return { url: existing.url };
}

export async function restartLocalHelper(signal?: AbortSignal): Promise<{ url: string; replacedActiveSessions: number }> {
  return withHelperLock(signal, async (paths) => {
    let replacedActiveSessions = 0;
    const existing = await readCookie(paths.cookiePath);
    if (existing !== undefined && isPidAlive(existing.pid)) {
      const status = await fetchHelperStatus(existing, signal).catch(() => undefined);
      if (status === undefined) {
        throw new UsageError(
          `detox server --restart: helper cookie names live pid ${String(existing.pid)}, but helper admin ` +
            'status could not be verified. Refusing to kill an unproven process or start a second helper.',
        );
      }
      replacedActiveSessions = status.activeSessions;
      process.kill(existing.pid, 'SIGTERM');
      await waitForPidExit(existing.pid, signal);
    }
    await removeCookie(paths.cookiePath);
    const fresh = await spawnHelper(paths.cookiePath, signal);
    return { url: fresh.url, replacedActiveSessions };
  });
}

function helperRoot(): string {
  return process.env[HELPER_ROOT_ENV] || path.join(homedir(), 'Library', 'Caches', 'detox-server', 'local-helper');
}

function helperPaths(): HelperPaths {
  const root = helperRoot();
  return {
    root,
    cookiePath: path.join(root, COOKIE_FILE),
    lockPath: path.join(root, LOCK_FILE),
  };
}

async function withHelperLock<T>(
  signal: AbortSignal | undefined,
  fn: (paths: HelperPaths) => Promise<T>,
): Promise<T> {
  const paths = helperPaths();
  await mkdir(paths.root, { recursive: true, mode: 0o700 });
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    signal?.throwIfAborted();
    try {
      await mkdir(paths.lockPath, { mode: 0o700 });
      break;
    } catch (err) {
      if (!isCode(err, 'EEXIST')) throw err;
      await removeStaleLock(paths.lockPath);
      if (Date.now() >= deadline) {
        throw new UsageError(`detox local helper: timed out waiting for ${paths.lockPath}`);
      }
      await sleep(POLL_MS, signal);
    }
  }

  try {
    return await fn(paths);
  } finally {
    await rm(paths.lockPath, { recursive: true, force: true });
  }
}

async function removeStaleLock(lockPath: string): Promise<void> {
  try {
    const ageMs = Date.now() - (await stat(lockPath)).mtimeMs;
    if (ageMs > LOCK_STALE_MS) await rm(lockPath, { recursive: true, force: true });
  } catch (err) {
    if (!isCode(err, 'ENOENT')) throw err;
  }
}

async function readCookie(cookiePath: string): Promise<LocalHelperCookie | undefined> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(cookiePath, 'utf8'));
  } catch (err) {
    if (isCode(err, 'ENOENT')) return undefined;
    await removeCookie(cookiePath);
    return undefined;
  }
  if (!isCookie(parsed)) {
    await removeCookie(cookiePath);
    return undefined;
  }
  return parsed;
}

async function writeCookie(cookiePath: string, cookie: LocalHelperCookie): Promise<void> {
  const tmp = `${cookiePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(cookie, null, 2), { mode: 0o600 });
  await rename(tmp, cookiePath);
  await chmod(cookiePath, 0o600);
}

async function removeCookie(cookiePath: string): Promise<void> {
  await rm(cookiePath, { force: true });
}

function isCookie(value: unknown): value is LocalHelperCookie {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.kind === 'detox-local-helper' &&
    typeof record.pid === 'number' &&
    Number.isInteger(record.pid) &&
    record.pid > 0 &&
    typeof record.url === 'string' &&
    /^ws:\/\/127\.0\.0\.1:\d+$/i.test(record.url) &&
    typeof record.protocol === 'number' &&
    typeof record.token === 'string' &&
    record.token.length >= 16 &&
    typeof record.startedAt === 'string'
  );
}

async function retireUnreachableOwnedHelper(
  cookie: LocalHelperCookie,
  status: HelperStatus,
  signal: AbortSignal | undefined,
): Promise<void> {
  if (status.activeSessions > 0) {
    throw new UsageError(
      `detox test: local helper pid ${String(cookie.pid)} is alive but ${cookie.url} does not answer, ` +
        `and the helper reports ${String(status.activeSessions)} active session(s). ` +
        'Not starting a second default server; run `detox server --restart` when it is safe.',
    );
  }
  const retired = await postHelperRetire(cookie, signal).catch(() => false);
  if (!retired) {
    throw new UsageError(
      `detox test: local helper pid ${String(cookie.pid)} is alive but ${cookie.url} does not answer, ` +
        'and it could not be retired. Not starting a second default server.',
    );
  }
  await waitForPidExit(cookie.pid, signal);
}

async function retireIncompatibleHelper(
  cookie: LocalHelperCookie,
  info: ServerInfoProbe,
  status: HelperStatus | undefined,
  signal: AbortSignal | undefined,
): Promise<void> {
  if (status === undefined) {
    throw new UsageError(
      `detox test: local helper at ${cookie.url} speaks protocol ${String(info.protocol)} ` +
        `but this CLI speaks ${String(PROTOCOL_VERSION)}; restart your detox server helper`,
    );
  }
  if (status.activeSessions > 0) {
    throw new UsageError(
      `detox test: local helper at ${cookie.url} speaks protocol ${String(info.protocol)} ` +
        `but this CLI speaks ${String(PROTOCOL_VERSION)} and the helper is busy ` +
        `(${String(status.activeSessions)} active session(s)); run \`detox server --restart\` when it is safe`,
    );
  }
  const retired = await postHelperRetire(cookie, signal).catch(() => false);
  if (!retired) {
    throw new UsageError(
      `detox test: local helper at ${cookie.url} speaks protocol ${String(info.protocol)} ` +
        `but this CLI speaks ${String(PROTOCOL_VERSION)} and it could not be retired`,
    );
  }
  await waitForPidExit(cookie.pid, signal);
}

async function probeServerInfo(url: string, signal: AbortSignal | undefined): Promise<ServerInfoProbe> {
  return withTimeout(PROBE_TIMEOUT_MS, signal, async (combined) => {
    const socket = new WebSocket(url);
    return new Promise<ServerInfoProbe>((resolve, reject) => {
      const cleanup = (): void => {
        socket.off('message', onMessage);
        socket.off('error', onError);
        socket.off('unexpected-response', onUnexpectedResponse);
        socket.off('close', onClose);
        combined.removeEventListener('abort', onAbort);
        socket.on('error', () => {});
      };
      const finish = (err: Error | undefined, value?: ServerInfoProbe): void => {
        cleanup();
        socket.close();
        let settled = false;
        const settle = (): void => {
          if (settled) return;
          settled = true;
          if (err) reject(err);
          else resolve(value as ServerInfoProbe);
        };
        if (socket.readyState === WebSocket.CLOSED) {
          settle();
        } else {
          socket.once('close', settle);
          setTimeout(settle, 50);
        }
      };
      const onMessage = (data: Buffer | string): void => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(typeof data === 'string' ? data : data.toString('utf8'));
        } catch {
          finish(new Error('malformed serverInfo frame'));
          return;
        }
        const params = isServerInfoFrame(parsed) ? parsed.params : undefined;
        if (params === undefined) {
          finish(new Error('first frame was not serverInfo'));
          return;
        }
        finish(undefined, params);
      };
      const onError = (err: Error): void => finish(err);
      const onUnexpectedResponse = (): void => finish(new Error('unexpected HTTP response'));
      const onClose = (): void => finish(new Error('closed before serverInfo'));
      const onAbort = (): void => finish(new Error('aborted'));
      socket.once('message', onMessage);
      socket.once('error', onError);
      socket.once('unexpected-response', onUnexpectedResponse);
      socket.once('close', onClose);
      combined.addEventListener('abort', onAbort, { once: true });
    });
  });
}

function isServerInfoFrame(value: unknown): value is { method: typeof SERVER_INFO_METHOD; params: ServerInfoNotification } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const params = record.params;
  return (
    record.method === SERVER_INFO_METHOD &&
    typeof params === 'object' &&
    params !== null &&
    !Array.isArray(params) &&
    typeof (params as Record<string, unknown>).protocol === 'number' &&
    typeof (params as Record<string, unknown>).server === 'string'
  );
}

async function fetchHelperStatus(
  cookie: LocalHelperCookie,
  signal: AbortSignal | undefined,
): Promise<HelperStatus> {
  return withTimeout(ADMIN_TIMEOUT_MS, signal, async (combined) => {
    const response = await fetch(httpUrl(cookie.url, ADMIN_STATUS_PATH), {
      headers: { 'x-detox-local-helper-token': cookie.token },
      signal: combined,
    });
    if (!response.ok) throw new Error(`helper status failed: ${String(response.status)}`);
    const body: unknown = await response.json();
    if (!isHelperStatus(body)) throw new Error('helper status had the wrong shape');
    return body;
  });
}

async function postHelperRetire(cookie: LocalHelperCookie, signal: AbortSignal | undefined): Promise<boolean> {
  return withTimeout(ADMIN_TIMEOUT_MS, signal, async (combined) => {
    const response = await fetch(httpUrl(cookie.url, ADMIN_RETIRE_PATH), {
      method: 'POST',
      headers: { 'x-detox-local-helper-token': cookie.token },
      signal: combined,
    });
    return response.ok;
  });
}

function isHelperStatus(value: unknown): value is HelperStatus {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.kind === 'detox-local-helper' &&
    typeof record.activeSessions === 'number' &&
    Number.isInteger(record.activeSessions) &&
    record.activeSessions >= 0 &&
    Array.isArray(record.holders)
  );
}

async function spawnHelper(cookiePath: string, signal: AbortSignal | undefined): Promise<LocalHelperCookie> {
  signal?.throwIfAborted();
  const token = randomBytes(32).toString('hex');
  const child = spawn(process.execPath, [serverCliPath(), '--port', '0', '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    detached: true,
    env: helperEnv(token),
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });

  let committed = false;
  const killHalfStarted = (): void => {
    if (!committed && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
    }
  };
  signal?.addEventListener('abort', killHalfStarted, { once: true });
  process.once('exit', killHalfStarted);

  try {
    const ready = await waitForListening(child, signal);
    const cookie: LocalHelperCookie = {
      kind: 'detox-local-helper',
      pid: child.pid ?? 0,
      url: ready.url,
      protocol: PROTOCOL_VERSION,
      token,
      serverVersion: ready.serverVersion,
      startedAt: new Date().toISOString(),
    };
    await writeCookie(cookiePath, cookie);
    committed = true;
    child.disconnect();
    child.unref();
    return cookie;
  } catch (err) {
    killHalfStarted();
    throw err;
  } finally {
    signal?.removeEventListener('abort', killHalfStarted);
    process.removeListener('exit', killHalfStarted);
  }
}

function serverCliPath(): string {
  const candidates = [
    path.resolve(__dirname, '../server/cli.js'),
    path.resolve(__dirname, '../../../detox/dist/server/cli.js'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found === undefined) {
    throw new UsageError(`detox local helper: server CLI was not built at ${candidates[0]}`);
  }
  return found;
}

// The developer's own shell must not leak a setting into the helper's spawn.
const SERVER_ENV_VARS = SERVER_SETTINGS.map((d) => d.env).filter((e) => e !== undefined);

function helperEnv(token: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, [HELPER_TOKEN_ENV]: token };
  for (const key of SERVER_ENV_VARS) delete env[key];
  return env;
}

async function waitForListening(
  child: ChildProcess,
  signal: AbortSignal | undefined,
): Promise<{ url: string; serverVersion?: string }> {
  return withTimeout(SPAWN_TIMEOUT_MS, signal, async (combined) => {
    return new Promise((resolve, reject) => {
      const cleanup = (): void => {
        child.off('message', onMessage);
        child.off('exit', onExit);
        child.off('error', onError);
        combined.removeEventListener('abort', onAbort);
      };
      const onMessage = (message: unknown): void => {
        if (typeof message !== 'object' || message === null || Array.isArray(message)) return;
        const record = message as Record<string, unknown>;
        if (record.type !== 'listening' || typeof record.url !== 'string') return;
        cleanup();
        resolve({
          url: record.url,
          serverVersion: typeof record.serverVersion === 'string' ? record.serverVersion : undefined,
        });
      };
      const onExit = (code: number | null, exitSignal: NodeJS.Signals | null): void => {
        cleanup();
        reject(
          new UsageError(
            `detox local helper: server exited before readiness (code=${String(code)}, signal=${String(exitSignal)})`,
          ),
        );
      };
      const onError = (err: Error): void => {
        cleanup();
        reject(err);
      };
      const onAbort = (): void => {
        cleanup();
        reject(reasonAsError(combined.reason));
      };
      child.once('message', onMessage);
      child.once('exit', onExit);
      child.once('error', onError);
      combined.addEventListener('abort', onAbort, { once: true });
    });
  });
}

async function waitForPidExit(pid: number, signal: AbortSignal | undefined): Promise<void> {
  const deadline = Date.now() + STOP_TIMEOUT_MS;
  while (isPidAlive(pid)) {
    if (Date.now() >= deadline) {
      throw new UsageError(`detox local helper: helper pid ${String(pid)} did not exit`);
    }
    await sleep(POLL_MS, signal);
  }
}

function httpUrl(wsUrl: string, pathname: string): string {
  const url = new URL(wsUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function sleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  signal?.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(reasonAsError(signal?.reason));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
  signal?.throwIfAborted();
}

async function withTimeout<T>(
  ms: number,
  signal: AbortSignal | undefined,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`timed out after ${String(ms)}ms`)), ms);
  timer.unref();
  const onAbort = (): void => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

function isCode(err: unknown, code: string): boolean {
  return typeof err === 'object' && err !== null && (err as NodeError).code === code;
}

function reasonAsError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  if (typeof reason === 'string') return new Error(reason);
  if (reason === undefined || reason === null) return new Error('aborted');
  return new Error('aborted');
}
