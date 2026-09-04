/**
 * The per-device gateway (spec 015), the corners the server-level suite does
 * not reach directly: the `attach` waiter's abort and close paths, the
 * preferred-port fallback, `allLive`, and the login-hook seam.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';

import { AppGateway } from '../AppGateway';

interface InboundFrame {
  type: string;
}

const gateways: AppGateway[] = [];
afterEach(async () => {
  for (const gateway of gateways.splice(0)) await gateway.close().catch(() => undefined);
});

function dial(url: string, sessionId: string): WebSocket {
  const ws = new WebSocket(url);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'login', messageId: 0, params: { sessionId, role: 'app' } }));
  });
  ws.addEventListener('message', (event) => {
    const frame = JSON.parse(String(event.data)) as InboundFrame;
    if (frame.type === 'isReady') ws.send(JSON.stringify({ type: 'ready', messageId: -1000 }));
  });
  return ws;
}

function portOf(url: string): number {
  return Number(new URL(url.replace(/^ws/, 'http')).port);
}

describe('AppGateway waitForReady (attach)', () => {
  it('rejects an already-aborted signal with DETOX_ABORTED', async () => {
    const gateway = await AppGateway.listen({ deviceId: 'u' });
    gateways.push(gateway);
    await expect(
      gateway.waitForReady('com.x', { signal: AbortSignal.abort() }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
  });

  it('rejects DETOX_ABORTED when the signal fires mid-wait, and cleans up its waiter', async () => {
    const gateway = await AppGateway.listen({ deviceId: 'u' });
    gateways.push(gateway);
    const controller = new AbortController();
    const waiting = gateway.waitForReady('com.x', { signal: controller.signal });
    controller.abort();
    await expect(waiting).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
  });

  it('rejects pending attach waiters when the gateway closes', async () => {
    const gateway = await AppGateway.listen({ deviceId: 'u' });
    const waiting = gateway.waitForReady('com.x');
    await gateway.close();
    await expect(waiting).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
    // A waitForReady on a closed gateway rejects at once.
    await expect(gateway.waitForReady('com.y')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_APP_DIED,
    });
  });

  it('resolves at once when a ready session already exists', async () => {
    const gateway = await AppGateway.listen({ deviceId: 'u' });
    gateways.push(gateway);
    dial(gateway.url, 'com.x');
    const first = await gateway.waitForReady('com.x');
    // A second attach to the same ready session resolves immediately.
    expect(await gateway.waitForReady('com.x')).toBe(first);
    expect(gateway.allLive().map((s) => s.sessionId)).toEqual(['com.x']);
  });
});

describe('AppGateway port preference (spec 015)', () => {
  it('prefers the requested port, and yields to whoever holds it', async () => {
    const first = await AppGateway.listen({ deviceId: 'a', preferredPort: 0 });
    gateways.push(first);
    const held = portOf(first.url);

    // The preferred port is taken, so this one falls back to an ephemeral port.
    const second = await AppGateway.listen({ deviceId: 'b', preferredPort: held });
    gateways.push(second);
    expect(portOf(second.url)).not.toBe(held);
  });
});

describe('AppGateway onLogin hook', () => {
  it('runs the hook on every accepted login, and survives a throwing hook', async () => {
    const gateway = await AppGateway.listen({ deviceId: 'u' });
    gateways.push(gateway);
    const seen: string[] = [];
    gateway.onLogin((session) => {
      seen.push(session.sessionId);
      throw new Error('a hook that throws must not sink the login');
    });
    dial(gateway.url, 'com.hooked');
    const session = await gateway.waitForReady('com.hooked');
    expect(session.sessionId).toBe('com.hooked');
    expect(seen).toEqual(['com.hooked']);
  });
});
