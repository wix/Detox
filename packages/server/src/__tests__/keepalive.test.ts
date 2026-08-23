import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import type { Socket } from 'node:net';
import { Peer, createWebSocketChannel } from '@detox-remote/core';
import type { DeviceInfo } from '@detox-remote/protocol';

import { createDetoxRemoteServer, DEFAULT_HOST } from '../server';
import { generateToken, type AuthConfig } from '../auth';
import type { KeepaliveOptions } from '../keepalive';
import type { SimulatorOps } from '../SimulatorOps';

const auth: AuthConfig = { type: 'static-token', token: generateToken() };

async function startServer(keepalive: KeepaliveOptions, simulatorOps?: SimulatorOps) {
  return createDetoxRemoteServer({
    port: 0,
    maxPool: 4,
    auth,
    keepalive,
    simulatorOps,
    // Isolated: opening the store sweeps its tmp/, which must never point at
    // the machine's real per-user store from a unit test.
    blobs: { root: mkdtempSync(path.join(tmpdir(), 'detox-blob-test-')) },
  });
}

function connect(port: number): Promise<WebSocket> {
  const ws = new WebSocket(`ws://${DEFAULT_HOST}:${port}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

interface CloseEvent {
  code: number;
  reason: string;
}

/** Resolves when `ws` dies for any reason — 'close' alone can be preceded by an 'error' we must swallow. */
function closed(ws: WebSocket): Promise<CloseEvent> {
  return new Promise((resolve) => {
    ws.once('close', (code, reason) => resolve({ code, reason: reason.toString() }));
    ws.on('error', () => {});
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The raw TCP socket `ws` hides — private but stable across `ws` majors. */
interface HasRawSocket {
  _socket: Socket;
}

interface ShutdownArgs {
  udid: string;
}

describe('keepalive', () => {
  /**
   * A client that went silent without closing — slept laptop, dropped
   * wifi. Pausing the client's TCP socket keeps the connection open but
   * stops the `ws` receiver from ever seeing the server's pings, so it
   * never pongs back: a half-open connection the server would otherwise
   * hold devices against forever.
   */
  it('terminates a client that went silent without closing', async () => {
    const server = await startServer({ intervalMs: 50, maxMissedPongs: 2 });
    try {
      const client = await connect(server.port);
      const death = closed(client);

      // Pausing the raw socket is the closest a test gets to "the network
      // stopped delivering".
      const socket = (client as unknown as HasRawSocket)._socket;
      socket.pause();

      // 2 tolerated misses × 50ms + the terminating tick + slack. A paused
      // socket cannot even observe its own death, so resume before looking:
      // if the server did terminate, the buffered FIN surfaces as 'close'
      // immediately; if it did not, the buffered pings surface instead, the
      // client pongs them, the connection stays open, and the race times out.
      await sleep(600);
      socket.resume();
      const closeEvent = await Promise.race([
        death,
        sleep(2_000).then<CloseEvent>(() => {
          throw new Error('server never terminated the silent client');
        }),
      ]);

      // The close frame the server sent before terminating was buffered the
      // whole time — a developer resuming from a breakpoint must learn why the
      // session ended, not just that it did.
      expect(closeEvent.code).toBe(4001);
      expect(closeEvent.reason).toMatch(/keepalive: no pong within/);
    } finally {
      await server.close();
    }
  });

  /**
   * Keepalive termination must flow through the same path as a clean
   * close, end to end — Peer aborts the in-flight handler first, then
   * devices are reclaimed. A client that freezes mid-boot must cost the
   * pool nothing, and the compensating shutdown must run
   * even though nobody will ever read the response.
   */
  it('aborts an in-flight allocation and compensates when the client goes silent', async () => {
    const shutdownCalls: string[] = [];
    const fakeOps = {
      list: async (): Promise<DeviceInfo[]> => [
        { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } } as DeviceInfo,
      ],
      // Slower than the whole silence window: the client is long dead by the
      // time boot resolves, which is exactly the branch under test.
      boot: async () => {
        await sleep(400);
        return true;
      },
      shutdown: async ({ udid }: ShutdownArgs) => {
        shutdownCalls.push(udid);
        return true;
      },
      state: async () => 'Booted',
    } as unknown as SimulatorOps;

    const server = await startServer({ intervalMs: 50, maxMissedPongs: 1 }, fakeOps);
    try {
      const client = await connect(server.port);
      const peer = Peer.create(createWebSocketChannel(client));
      const allocation = peer.request({
        method: 'allocateDevice',
        params: { type: 'ios.simulator' },
      });
      // Let the request reach the server and start booting, then go silent.
      await sleep(100);
      const socket = (client as unknown as HasRawSocket)._socket;
      socket.pause();
      await sleep(600);
      socket.resume();

      // The in-flight promise settles with the keepalive verdict, not a
      // generic disconnect — threaded from the close frame through the Peer.
      await expect(allocation).rejects.toThrow(/keepalive: no pong within/);

      // Boot resolves at ~700ms into a released connection; the rollback then
      // shuts down what it booted and frees the slot.
      await expect
        .poll(() => shutdownCalls, { timeout: 2_000 })
        .toEqual(['udid-1']);
    } finally {
      await server.close();
    }
  });

  it('leaves a live client alone well past the silence window', async () => {
    // maxMissedPongs 3, not 1: with 1, a single 20ms tick where the loopback
    // round trip loses the scheduling race would kill the client and flake.
    const server = await startServer({ intervalMs: 20, maxMissedPongs: 3 });
    try {
      const client = await connect(server.port);
      let died = false;
      void closed(client).then(() => {
        died = true;
      });

      // ~10 windows: a responsive client auto-pongs from its event loop and
      // must never trip the counter.
      await sleep(400);
      expect(died).toBe(false);
      expect(client.readyState).toBe(WebSocket.OPEN);
      client.terminate();
    } finally {
      await server.close();
    }
  });
});
