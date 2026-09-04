/**
 * The server answers `$/serverInfo` from its own connection handler, so the
 * announce can arrive in the very same read as the handshake response. `ws`
 * hands those bytes over on the nextTick queue, ahead of the promise chain
 * that builds the session — `connect` must still resolve. A raw upgrade
 * server that writes both in one call makes that timing deterministic; with
 * the real server it is a matter of scheduling and shows up as
 * `DETOX_SERVER_DID_NOT_ANNOUNCE` on a loaded machine.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Duplex } from 'node:stream';
import { createHash } from 'node:crypto';
import { describe, it, expect, afterEach } from 'vitest';

import { PROTOCOL_VERSION, SERVER_INFO_METHOD } from '@detox-remote/protocol';

import { connect } from '../../client';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/** One unmasked text frame, server to client. */
function textFrame(json: string): Buffer {
  const payload = Buffer.from(json, 'utf8');
  const head =
    payload.length < 126
      ? Buffer.from([0x81, payload.length])
      : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 0xff]);
  return Buffer.concat([head, payload]);
}

const servers: http.Server[] = [];
/** The raw server never answers a close frame, so teardown ends its sockets itself. */
const sockets = new Set<Duplex>();

async function serverAnnouncingInTheHandshakeWrite(runId: string): Promise<string> {
  const announce = JSON.stringify({
    jsonrpc: '2.0',
    method: SERVER_INFO_METHOD,
    params: { protocol: PROTOCOL_VERSION, server: 'test', log: { runId } },
  });
  const server = http.createServer((_req, res) => {
    res.statusCode = 404;
    res.end();
  });
  server.on('upgrade', (req, socket) => {
    const accept = createHash('sha1').update(String(req.headers['sec-websocket-key']) + WS_GUID).digest('base64');
    const response = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '',
      '',
    ].join('\r\n');
    sockets.add(socket);
    socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket));
    socket.write(Buffer.concat([Buffer.from(response), textFrame(announce)]));
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `ws://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  for (const socket of sockets) socket.destroy();
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((resolve) => s.close(() => resolve()))));
});

describe('connect — the announce in the same read as the handshake response', () => {
  it('resolves, with the announced runId, instead of running into the announce ceiling', async () => {
    const url = await serverAnnouncingInTheHandshakeWrite('run-same-read');
    const detox = await connect({ server: url, ...({ announceTimeoutMs: 2_000 } as object) });
    try {
      expect(detox.runId).toBe('run-same-read');
    } finally {
      await detox.disconnect();
    }
  });
});
