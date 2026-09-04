import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { createDetoxRemoteServer, DEFAULT_HOST } from '../server';
import type { SimulatorOps } from '@detox-remote/driver-ios';

const simulatorOps = { list: async () => [] } as unknown as SimulatorOps;
const TOKEN = '0123456789abcdef';

describe('local helper admin surface', () => {
  /**
   * @issue DTX-6212
   * The helper admin token is separate from tester-facing WebSocket auth:
   * helper snapshots carry no token, but helper maintenance needs ownership
   * proof.
   */
  it('is token-guarded separately from the open helper WebSocket door', async () => {
    const server = await startHelperServer();
    try {
      expect(await fetch(statusUrl(server.port))).toMatchObject({ status: 401 });
      await expect(connect(`ws://${DEFAULT_HOST}:${String(server.port)}`)).resolves.toBeUndefined();
    } finally {
      await server.close();
    }
  });

  it('reports active WebSocket sessions and refuses idle-retire while busy', async () => {
    const server = await startHelperServer();
    const ws = new WebSocket(`ws://${DEFAULT_HOST}:${String(server.port)}`);
    try {
      await onceOpen(ws);
      const status = await fetchJson(statusUrl(server.port), 'GET');
      expect(status.activeSessions).toBe(1);
      const retired = await fetch(statusUrl(server.port, 'retire'), request('POST'));
      expect(retired.status).toBe(409);
    } finally {
      ws.terminate();
      await server.close();
    }
  });

  it('accepts idle retire and closes the helper server', async () => {
    const server = await startHelperServer();
    const retired = await fetch(statusUrl(server.port, 'retire'), request('POST'));
    expect(retired.status).toBe(200);
    await expect(server.close()).resolves.toBeUndefined();
  });
});

async function startHelperServer() {
  return createDetoxRemoteServer({
    port: 0,
    maxPool: 4,
    simulatorOps,
    blobs: { root: mkdtempSync(path.join(tmpdir(), 'detox-helper-admin-blob-')) },
    logs: { root: mkdtempSync(path.join(tmpdir(), 'detox-helper-admin-log-')) },
    localHelper: { token: TOKEN },
  });
}

function statusUrl(port: number, action = 'status'): string {
  return `http://${DEFAULT_HOST}:${String(port)}/v1/local-helper/${action}`;
}

function request(method: string): RequestInit {
  return { method, headers: { 'x-detox-local-helper-token': TOKEN } };
}

async function fetchJson(url: string, method: string): Promise<Record<string, unknown>> {
  const response = await fetch(url, request(method));
  return (await response.json()) as Record<string, unknown>;
}

function connect(url: string): Promise<void> {
  const ws = new WebSocket(url);
  return onceOpen(ws).finally(() => ws.close());
}

function onceOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
}
