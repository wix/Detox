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
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
  const channel: WebSocketChannel = createWebSocketChannel(ws);
  const peer = Peer.create(channel);
  const client = new DetoxClientPeer({ peer });
  return {
    client,
    close() {
      channel.close();
    },
  };
}
