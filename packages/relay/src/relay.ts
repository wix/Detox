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
import { randomUUID } from 'node:crypto';
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
  LogStore,
  RELAY_LOCAL_NAME,
  assertUsableToken,
  createServerLogSink,
  handleBlobLaneRequest,
  handleConnectionLogRequest,
  isAuthorized,
  isBlobLaneRequest,
  isConnectionLogRequest,
  refuse,
  startKeepalive,
  type AuthConfig,
  type BlobStoreOptions,
  type KeepaliveConfig,
  type LogLevel,
  type LogStoreOptions,
} from '@detox-remote/server';

import { ensureBlobOnNode } from './blob-bridge';
import { createNodeLogDialer } from './log-bridge';
import { RELAY_LOG_PREFIX, relayError, relayLog } from './log';
import type { RelayNodeConfig } from './nodes';
import { RelayConnectionLog } from './relay-log';
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
  /** The relay's own store (`--blob-budget`; `DETOX_RELAY_BLOB_ROOT` test seam). */
  blobs?: BlobStoreOptions;
  /**
   * The relay's own connection log (spec 008): one JSONL per
   * client session, every node's own log crossing the hop live. `root` is
   * the `DETOX_RELAY_LOG_ROOT` @internal test seam — production uses
   * {@link DEFAULT_RELAY_LOG_ROOT}; `retentionMs` is `--log-retention`
   * (default {@link DEFAULT_RELAY_LOG_RETENTION_MS}), `budgetBytes` is
   * `--log-budget`.
   */
  logs?: LogStoreOptions;
  /** `--log-level`: the stdout threshold for the relay's own rare server-rank log lines. */
  logLevel?: LogLevel;
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
 * other's entries. `DETOX_RELAY_BLOB_ROOT` stays the test seam, same convention as
 * the server's.
 */
const RELAY_BLOB_ROOT = path.join(homedir(), 'Library', 'Caches', 'detox-relay', 'blobs');

/**
 * The relay's own fixed log root (spec 008) — separate from the
 * server's `detox-server` root for the same reason as the blob store above:
 * a relay and a node sharing one machine must not collide on retention or
 * the root lock.
 */
const DEFAULT_RELAY_LOG_ROOT = path.join(homedir(), 'Library', 'Logs', 'detox-relay');

/** A node forgets in minutes (CI collects right after the run); nobody collects for the relay's operator but them. */
const DEFAULT_RELAY_LOG_RETENTION_MS = 60 * 60 * 1000;

/** Ask clients to leave, then insist — `wss.close()` alone waits forever. */
const CLOSE_GRACE_MS = 1_000;

export async function createDetoxRelay({
  port,
  host = DEFAULT_HOST,
  auth,
  keepalive = DEFAULT_KEEPALIVE,
  nodes,
  blobs,
  logs,
  logLevel,
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

  // The log root likewise (spec 008): the lock is taken (or refused typed —
  // one relay per root), the previous life's files are trimmed and closed,
  // the first sweep runs — all before the first connection. The rare line
  // this sink carries (a budget eviction) is voiced `[relay]`, same as
  // everything else this process prints.
  const logSink = createServerLogSink((chunk) => {
    relayLog(chunk.replace(/\n$/, ''));
  });
  if (logLevel !== undefined) logSink.setLevel(logLevel);
  const logStore = await LogStore.open({
    root: logs?.root ?? DEFAULT_RELAY_LOG_ROOT,
    retentionMs: logs?.retentionMs ?? DEFAULT_RELAY_LOG_RETENTION_MS,
    budgetBytes: logs?.budgetBytes,
    sink: logSink,
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
      // Spec 008: the node's own token follows the log too — a fresh dialer
      // per node connection, since the id it follows is minted per node
      // connection.
      createLogDialer: (nodeRunId) => createNodeLogDialer(node.url, node.token, nodeRunId),
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
    if (isConnectionLogRequest(req)) {
      // Spec 012a: the same handler as the server's, one word apart — the relay is the local hop of its own trace.
      void handleConnectionLogRequest(req, res, { store: logStore, auth, localName: RELAY_LOCAL_NAME });
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
  // Every connection whose `conn` end is not yet on disk — graceful
  // shutdown awaits them all (spec 008, the server's own
  // `recorders` precedent).
  const relayLogs = new Set<RelayConnectionLog>();
  wss.on('connection', (ws, req) => {
    const channel = createWebSocketChannel(ws);
    // The connection's id is the relay's own log's id — relay-minted here,
    // announced on `$/serverInfo`, never a node's id (spec 008: a node's own
    // `log.runId` is consumed, never forwarded — see `session.ts`'s
    // `$/serverInfo` handling).
    const runId = randomUUID();
    // Named apart from the imported `relayLog` stdout voice above — a
    // per-connection recorder, not the process-wide log function. The
    // tester's address rides the conn begin so that "which client held that
    // device?" is answerable from the relay's own file alone.
    const connectionLog = new RelayConnectionLog(logStore.openConnection(runId, () => 0), { runId, remoteAddress: req.socket.remoteAddress });
    relayLogs.add(connectionLog);
    void connectionLog.ended.then(() => {
      logStore.endConnection(runId);
      relayLogs.delete(connectionLog);
    });
    // The relay's own $/serverInfo is the first frame to a client —
    // versions are hop-pairwise like auth. `log` says this endpoint
    // records too, exactly like a node's own announce (spec 012).
    channel.send({
      jsonrpc: '2.0',
      method: SERVER_INFO_METHOD,
      params: { protocol: PROTOCOL_VERSION, server: relayPackage.version, log: { runId } },
    });
    const session = new RelaySession({ client: channel, nodes: sessionNodes, relayLog: connectionLog });
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
        // Snapshotted before teardown starts (the server's own precedent):
        // these are the connections open at shutdown, whose `conn` end must
        // be on disk before the log root is released. Closing every
        // upstream socket below (via session.close()) is what lets each
        // node finish its own log gracefully and each follow end naturally
        // — a wedged node keeps this waiting, accepted, the spawner's
        // SIGKILL is the backstop, same as the server.
        const openAtShutdown = [...relayLogs];
        stopKeepalive();
        // Sessions close first so every upstream socket dies with the relay
        // and the nodes reclaim now, not at their own keepalive verdicts.
        for (const session of [...sessions]) session.close();
        sessions.clear();
        closing = closeListener(wss, httpServer)
          .then(() => Promise.all(openAtShutdown.map((log) => log.ended)))
          .then(() => logStore.close());
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
