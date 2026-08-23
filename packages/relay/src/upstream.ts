/**
 * Dialing a node: the relay is a client of the node exactly as `detox` is a
 * client of the server. The handshake presents the node's
 * own bearer token from the relay's config, never the client's
 * (hop-pairwise), and failures come back as the same typed family the client
 * uses, because the fan-out classifies attempts by these codes.
 *
 * The `ws` library answers a node's protocol pings from its own event loop
 * automatically, so this socket satisfies a node's keepalive with no code
 * of its own — the per-hop keepalive story relies on it.
 */
import WebSocket from 'ws';
import {
  DetoxConnectionError,
  DetoxErrorCode,
  createWebSocketChannel,
  type WebSocketChannel,
} from '@detox-remote/core';

import type { RelayNodeConfig } from './nodes';

/** The refused handshake's HTTP response — only the status is read. */
interface HandshakeResponse {
  statusCode?: number;
}

/**
 * A wedge detector, not a patience limit: a peer that completes the
 * TCP handshake from its listen backlog and never answers the upgrade is a
 * wedged process whose death is unobservable — the socket would otherwise
 * wait forever (`ws` has no default). A live handshake is milliseconds;
 * a dead host fails fast through the socket; only the wedged-alive case
 * needs this clock. Matches the fan-out's stall window so an abandoned
 * attempt's socket dies with the attempt.
 */
const HANDSHAKE_WEDGE_MS = 30_000;

/**
 * Opens the command channel to a node. Rejects typed: anything but a 401 is
 * `DETOX_SERVER_UNREACHABLE`.
 *
 * @issue DTX-7045: a 401 at the handshake rejects DETOX_UNAUTHORIZED.
 */
export function dialNodeChannel(node: RelayNodeConfig): Promise<WebSocketChannel> {
  const socket = new WebSocket(node.url, {
    // No header at all for a tokenless entry — an empty bearer would
    // present the one string an auth-on node's empty-token guard refuses.
    ...(node.token !== undefined
      ? { headers: { Authorization: `Bearer ${node.token}` } }
      : {}),
    handshakeTimeout: HANDSHAKE_WEDGE_MS,
  });
  return new Promise<WebSocketChannel>((resolve, reject) => {
    const onOpen = (): void => {
      cleanup();
      resolve(createWebSocketChannel(socket));
    };
    const onError = (error: Error): void => {
      cleanup();
      socket.terminate();
      reject(
        new DetoxConnectionError(`could not connect to node "${node.name}" at ${node.url}`, {
          code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
          details: { node: node.name, url: node.url },
          cause: error,
        }),
      );
    };
    const onUnexpectedResponse = (_req: unknown, res: HandshakeResponse): void => {
      cleanup();
      socket.terminate();
      const status = res.statusCode ?? 0;
      reject(
        status === 401
          ? new DetoxConnectionError(
              `node "${node.name}" rejected the RELAY's credentials (401) — check its token in --nodes`,
              {
                code: DetoxErrorCode.DETOX_UNAUTHORIZED,
                details: { node: node.name, status },
              },
            )
          : new DetoxConnectionError(
              `node "${node.name}" refused the handshake (HTTP ${String(status)})`,
              {
                code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
                details: { node: node.name, url: node.url, status },
              },
            ),
      );
    };
    const cleanup = (): void => {
      socket.off('open', onOpen);
      socket.off('error', onError);
      socket.off('unexpected-response', onUnexpectedResponse);
      // `terminate()` above can surface an async "closed before the
      // connection was established" error nobody listens for any more —
      // without a sink it becomes an uncaught exception.
      socket.on('error', () => {});
    };
    socket.once('open', onOpen);
    socket.once('error', onError);
    socket.once('unexpected-response', onUnexpectedResponse);
  });
}
