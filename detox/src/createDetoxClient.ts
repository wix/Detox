import { WebSocket } from 'ws';
import { Peer, createWebSocketChannel, type WebSocketChannel } from '@detox-remote/core';
import { DetoxClientPeer } from './DetoxClientPeer';

export interface CreateDetoxClientOptions {
  url: string;
}

export interface DetoxClient {
  client: DetoxClientPeer;
  close(): void;
}

/**
 * Connect to a Detox remote server and return a typed client peer and close handle.
 */
export async function createDetoxClient({ url }: CreateDetoxClientOptions): Promise<DetoxClient> {
  const ws = new WebSocket(url);
  // Before `open`, never after the await: a server that answers from its own
  // connection handler can have its first frame ride the same TCP segment as
  // the handshake response, and `ws` delivers those bytes on the nextTick
  // queue — ahead of the promise microtask below. A channel built after the
  // await has no listener attached yet and loses that frame outright.
  const channel: WebSocketChannel = createWebSocketChannel(ws);
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
  const peer = Peer.create(channel);
  const client = new DetoxClientPeer({ peer });
  return {
    client,
    close() {
      channel.close();
    },
  };
}
