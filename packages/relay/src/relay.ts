/**
 * The relay process (spec 008): one address for a fleet of Detox Servers.
 *
 * The client-facing hop copies the server's own listener in structure: an
 * explicit HTTP server carrying the relay's own blob lane under the ws
 * upgrade, `verifyClient` answering 401 at the handshake when auth is on,
 * the server's `startKeepalive` reused verbatim (2 min default,
 * `0` legal = off, same 4001 close + cause-naming reason so the client's
 * `DETOX_SESSION_EXPIRED` mapping works unchanged), and the ask-then-insist
 * close choreography that cures SIGTERM hangs.
 *
 * The relay never dials a node's app gateway and never sees the frozen
 * `{type, messageId, params}` dialect: apps dial their own node. Only
 * the client dialect is relayed.
 */
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { homedir } from 'node:os';
import * as path from 'node:path';

import { WebSocketServer } from 'ws';
import { BlobLaneClient, createWebSocketChannel } from '@detox-remote/core';
import { PROTOCOL_VERSION, SERVER_INFO_METHOD } from '@detox-remote/protocol';
import relayPackage from '../package.json';
import {
  BlobStore,
  DEFAULT_KEEPALIVE,
  assertUsableToken,
  handleBlobLaneRequest,
  isAuthorized,
  isBlobLaneRequest,
  refuse,
  startKeepalive,
  type AuthConfig,
  type BlobStoreOptions,
  type KeepaliveConfig,
} from '@detox-remote/server';

import { ensureBlobOnNode } from './blob-bridge';
import { RELAY_LOG_PREFIX, relayError } from './log';
import type { RelayNodeConfig } from './nodes';
import { RelaySession, type SessionNode } from './session';
import { dialNodeChannel } from './upstream';

export interface RelayDeps {
  port: number;
  /** Loopback by default — an operator opts into the LAN. */
  host?: string;
  /** Absent → open door — auth is opt-in and off by default. */
  auth?: AuthConfig;
  keepalive?: KeepaliveConfig;
  nodes: readonly RelayNodeConfig[];
  /** The relay's own store (`--blob-budget`; `DETOX_BLOB_ROOT` test seam). */
  blobs?: BlobStoreOptions;
}

export interface DetoxRelay {
  readonly port: number;
  readonly host: string;
  close(): Promise<void>;
}

export const DEFAULT_HOST = '127.0.0.1';

/**
 * The relay's own fixed store location, not the server's `detox-server/blobs`:
 * a relay and a node on one Mac each keep an in-memory index, budget, and
 * pin count, and two processes sharing one directory would cross-evict each
 * other's entries. `DETOX_BLOB_ROOT` stays the test seam, same convention as
 * the server's.
 */
const RELAY_BLOB_ROOT = path.join(homedir(), 'Library', 'Caches', 'detox-relay', 'blobs');

/** Ask clients to leave, then insist — `wss.close()` alone waits forever. */
const CLOSE_GRACE_MS = 1_000;

export async function createDetoxRelay({
  port,
  host = DEFAULT_HOST,
  auth,
  keepalive = DEFAULT_KEEPALIVE,
  nodes,
  blobs,
}: RelayDeps): Promise<DetoxRelay> {
  // A relay that cannot turn anyone away must not reach the point of
  // listening — a relay over nothing is a misconfiguration, not a fleet.
  assertUsableToken(auth);
  if (nodes.length === 0) {
    throw new Error('Refusing to start: the relay has zero nodes configured (--nodes)');
  }

  // The relay's own store, opened before anything binds (an unusable root
  // fails startup loudly, not the first install), talking in its own voice.
  const blobStore = await BlobStore.open({
    root: blobs?.root ?? RELAY_BLOB_ROOT,
    budgetBytes: blobs?.budgetBytes,
    logPrefix: RELAY_LOG_PREFIX,
  });

  // @issue DTX-7033: each node dials with its own token — the client's header is never read here.
  const sessionNodes: SessionNode[] = nodes.map((node) => {
    const lane = new BlobLaneClient({
      url: node.url,
      ...(node.token !== undefined
        ? { headers: { Authorization: `Bearer ${node.token}` } }
        : {}),
    });
    return {
      name: node.name,
      connect: () => dialNodeChannel(node),
      ensureBlob: (hex) => ensureBlobOnNode({ lane, store: blobStore }, hex),
    };
  });

  // Same port carries plain HTTP for the relay's blob lane and nothing
  // else — everything else answers 404.
  // `requestTimeout: 0` for the same reason as the server's: Node's default
  // 300 s total cap is a patience limit on healthy uploads, not a wedge
  // detector; a slow PUT's death is observable through its socket.
  const httpServer = createHttpServer({ requestTimeout: 0 }, (req, res) => {
    if (isBlobLaneRequest(req)) {
      void handleBlobLaneRequest(req, res, { store: blobStore, auth });
      return;
    }
    refuse(req, res, 404);
  });

  const wss = new WebSocketServer({
    server: httpServer,
    // 401 at the handshake, before a socket exists — the client hop
    // rejects exactly as the server does.
    verifyClient: ({ req }, done) => {
      if (isAuthorized(req, auth)) return done(true);
      relayError('rejected an unauthorized connection');
      done(false, 401, 'Unauthorized');
    },
  });

  let stopKeepalive: () => void;
  try {
    stopKeepalive = startKeepalive(wss, keepalive, RELAY_LOG_PREFIX);
  } catch (err) {
    wss.close();
    throw err;
  }

  const sessions = new Set<RelaySession>();
  wss.on('connection', (ws) => {
    const channel = createWebSocketChannel(ws);
    // The relay's own $/serverInfo is the first frame to a client —
    // versions are hop-pairwise like auth.
    channel.send({
      jsonrpc: '2.0',
      method: SERVER_INFO_METHOD,
      params: { protocol: PROTOCOL_VERSION, server: relayPackage.version },
    });
    const session = new RelaySession({ client: channel, nodes: sessionNodes });
    sessions.add(session);
    // @issue DTX-7037: any client close ends the session, closing every upstream socket of it at once.
    channel.onClose(() => {
      sessions.delete(session);
    });
  });

  try {
    await new Promise<void>((resolve, reject) => {
      // ws forwards the HTTP server's 'listening'/'error' onto `wss`, so a
      // bind failure rejects startup instead of half-starting.
      wss.once('listening', resolve);
      wss.once('error', reject);
      httpServer.listen(port, host);
    });
  } catch (err) {
    stopKeepalive();
    wss.close();
    httpServer.close(() => undefined);
    throw err;
  }

  let closing: Promise<void> | undefined;

  return {
    get port() {
      const addr = httpServer.address();
      return typeof addr === 'object' && addr ? addr.port : port;
    },
    get host() {
      return host;
    },
    close() {
      if (!closing) {
        stopKeepalive();
        // Sessions close first so every upstream socket dies with the relay
        // and the nodes reclaim now, not at their own keepalive verdicts.
        for (const session of [...sessions]) session.close();
        sessions.clear();
        closing = closeListener(wss, httpServer);
      }
      return closing;
    },
  };
}

function closeListener(wss: WebSocketServer, httpServer: HttpServer): Promise<void> {
  const wsClosed = new Promise<void>((resolve, reject) => {
    wss.close((err) => (err ? reject(err) : resolve()));
  });
  const httpClosed = new Promise<void>((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });

  for (const client of wss.clients) {
    client.close(1001, 'Relay shutting down');
  }
  httpServer.closeIdleConnections();
  const hardKill = setTimeout(() => {
    for (const client of wss.clients) client.terminate();
    httpServer.closeAllConnections();
  }, CLOSE_GRACE_MS);
  hardKill.unref();

  return Promise.all([wsClosed, httpClosed])
    .then(() => undefined)
    .finally(() => {
      clearTimeout(hardKill);
    });
}
