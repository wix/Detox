/**
 * The pending buffer is drained one microtask after the first `onMessage`,
 * never inside it. The first listener is normally a `Peer`, whose consumer
 * registers the handlers it dispatches to right after `Peer.create` returns,
 * in the same synchronous turn — a backlog handed over inside `onMessage`
 * would reach a dispatcher with nothing registered yet, and a notification
 * nobody handles is dropped. The server's `$/serverInfo` announce can ride
 * the same read as the handshake response, which puts it in this buffer.
 */
import { EventEmitter } from 'node:events';
import { describe, it, expect } from 'vitest';
import type { WebSocket } from 'ws';

import { createWebSocketChannel } from '../channel/ws-channel';

interface Tagged {
  method: string;
}

interface Openable {
  readyState: number;
}

function fakeSocket(): WebSocket & EventEmitter {
  const ws = new EventEmitter() as WebSocket & EventEmitter;
  (ws as Openable).readyState = 1;
  return ws;
}

describe('createWebSocketChannel — draining the backlog', () => {
  it('a dispatcher that fills its handler table right after attaching still receives the backlog', async () => {
    const ws = fakeSocket();
    const channel = createWebSocketChannel(ws);
    ws.emit('message', JSON.stringify({ method: '$/serverInfo' }));

    const handlers = new Map<string, (msg: Tagged) => void>();
    const seen: string[] = [];
    // The shape of `Peer.create` followed by `onNotify`: attach first, register after.
    channel.onMessage((msg) => handlers.get((msg as Tagged).method)?.(msg as Tagged));
    handlers.set('$/serverInfo', (msg) => seen.push(msg.method));

    expect(seen).toEqual([]);
    await Promise.resolve();
    expect(seen).toEqual(['$/serverInfo']);
  });

  it('a message arriving before the drain runs is delivered after the backlog, in order', async () => {
    const ws = fakeSocket();
    const channel = createWebSocketChannel(ws);
    ws.emit('message', JSON.stringify({ method: 'first' }));

    const seen: string[] = [];
    channel.onMessage((msg) => seen.push((msg as Tagged).method));
    ws.emit('message', JSON.stringify({ method: 'second' }));

    await Promise.resolve();
    expect(seen).toEqual(['first', 'second']);
  });

  it('with no backlog, a message after the first handler dispatches synchronously', () => {
    const ws = fakeSocket();
    const channel = createWebSocketChannel(ws);
    const seen: string[] = [];
    channel.onMessage((msg) => seen.push((msg as Tagged).method));
    ws.emit('message', JSON.stringify({ method: 'direct' }));
    expect(seen).toEqual(['direct']);
  });
});
