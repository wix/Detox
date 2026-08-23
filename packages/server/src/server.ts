import { timingSafeEqual } from 'node:crypto';
import { createServer as createHttpServer, type IncomingMessage, type Server as HttpServer } from 'node:http';

import { WebSocketServer } from 'ws';
import { Peer } from '@detox-remote/core';
import { PROTOCOL_VERSION } from '@detox-remote/protocol';
import serverPackage from '../package.json';
import { SimulatorOps } from './SimulatorOps';
import { DevicePool } from './DevicePool';
import { DetoxServerPeer } from './DetoxServerPeer';
import { DetoxServerImpl } from './DetoxServerImpl';
import { AppGateway } from './AppGateway';
import { createWebSocketChannel } from '@detox-remote/core';
import { assertUsableToken, isAuthorized, type AuthConfig } from './auth';
import { startKeepalive, DEFAULT_KEEPALIVE, type KeepaliveConfig } from './keepalive';
import { BlobStore, type BlobStoreOptions } from './BlobStore';
import { handleBlobLaneRequest, isBlobLaneRequest, refuse } from './blob-http';

interface ServerPackageJson {
  version: string;
}

interface LocalHelperConfig {
  token: string;
}

interface LocalHelperCloseCell {
  request?: () => void;
}

const SERVER_VERSION = (serverPackage as ServerPackageJson).version;

export interface ServerDeps {
  port: number;
  maxPool: number;
  /**
   * Interface to bind. Loopback by default: the server runs `simctl` as its own
   * user, so listening on every interface is opt-in, never the default.
   */
  host?: string;
  /**
   * Absent → the door is open: auth is opt-in and off by default.
   * Present → the bearer check of spec 003.
   */
  auth?: AuthConfig;
  /**
   * Ping/pong policy for detecting half-open connections. A server without
   * keepalive leaks every device a vanished client held (keepalive is the
   * only implicit reclaim) — which is why turning it off
   * is not a missing option but an explicit one: `'off'` (
   * `--keepalive-window 0`) means no polls and no reclaim-on-silence, at the
   * operator's own risk.
   */
  keepalive?: KeepaliveConfig;
  /**
   * Test seam: lets a test observe device consequences without real simctl.
   * @internal
   */
  simulatorOps?: SimulatorOps;
  /**
   * Explicit Detox iOS framework binary for `launchApp` (spec 003) — the
   * `DETOX_IOS_FRAMEWORK_PATH` override. Absent, the newest build in v20's
   * per-user framework cache is injected instead; neither existing makes
   * `launchApp` a typed 2009 refusal, never an uninstrumented launch that
   * can only hang the ready handshake (see `framework-cache.ts`).
   */
  iosFrameworkPath?: string;
  /**
   * The blob lane's store (spec 007). `budgetBytes` is `--blob-budget`, the
   * lane's one operator knob; `root` is the `DETOX_BLOB_ROOT` @internal test
   * seam — production always uses the fixed per-user location.
   */
  blobs?: BlobStoreOptions;
  /**
   * Hidden local-helper admin surface (spec 011).
   * @issue DTX-6212: this token is separate from tester-facing WebSocket
   * auth — helper snapshots carry no token, but helper maintenance needs
   * ownership proof.
   */
  localHelper?: LocalHelperConfig;
}

export interface DetoxRemoteServer {
  readonly port: number;
  readonly host: string;
  close(): Promise<void>;
}

/** Default bind address — IPv4 loopback only. */
export const DEFAULT_HOST = '127.0.0.1';

/** @issue DTX-6213: how long a client gets to close politely before the socket is torn out from under it. */
const CLOSE_GRACE_MS = 1_000;

export async function createDetoxRemoteServer({
  port,
  maxPool,
  host = DEFAULT_HOST,
  auth,
  keepalive = DEFAULT_KEEPALIVE,
  simulatorOps = new SimulatorOps(),
  iosFrameworkPath,
  blobs,
  localHelper,
}: ServerDeps): Promise<DetoxRemoteServer> {
  // Before anything binds: a server that cannot actually turn anyone away must
  // not reach the point of listening.
  assertUsableToken(auth);

  // The blob store opens before anything binds too: an unusable root (no
  // permissions, a file where the directory should be) must fail startup
  // loudly, not the first install. Opening also runs the one startup sweep.
  const blobStore = await BlobStore.open(blobs);

  // No pre-marking of booted simulators as busy: the pool keeps released
  // devices warm, so a booted-but-unallocated device is free capacity, not
  // someone else's property.
  const devicePool = new DevicePool({ simulatorOps, maxPool });

  // The app-facing listener (spec 003). Always loopback, regardless of the
  // tester-facing bind: simulator apps are host processes, and with no tokens
  // on that port the bind is the whole boundary.
  const appGateway = await AppGateway.listen();

  // An explicit HTTP server under the WebSocket upgrade, because the port now
  // carries plain HTTP too: the blob lane (spec 007) lives on the same
  // host:port and token as the command channel — no new listener anywhere.
  // Everything that is neither the lane nor the upgrade answers 404.
  //
  // `requestTimeout: 0`: Node's default is a 300 s total cap per request,
  // which here would be a patience limit killing any healthy upload longer
  // than five minutes; the byte budget bounds the size instead.
  // `headersTimeout` keeps its default: a header-dribbling attacker is a
  // wedge, and that clock is a wedge detector.
  const activeConnections = new Map<string, { connectedAt: string; remoteAddress?: string }>();
  let nextConnectionId = 0;
  const closeFromAdmin: LocalHelperCloseCell = {};

  const httpServer = createHttpServer({ requestTimeout: 0 }, (req, res) => {
    if (localHelper !== undefined && isLocalHelperAdminRequest(req)) {
      if (!hasLocalHelperToken(req, localHelper.token)) {
        refuse(req, res, 401);
        return;
      }
      if (req.method === 'GET' && req.url === '/v1/local-helper/status') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            kind: 'detox-local-helper',
            activeSessions: activeConnections.size,
            holders: [...activeConnections.entries()].map(([id, holder]) => ({ id, ...holder })),
          }),
        );
        return;
      }
      if (req.method === 'POST' && req.url === '/v1/local-helper/retire') {
        if (activeConnections.size > 0) {
          res.statusCode = 409;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'helper is busy', activeSessions: activeConnections.size }));
          return;
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
        setImmediate(() => closeFromAdmin.request?.());
        return;
      }
      refuse(req, res, 404);
      return;
    }
    if (isBlobLaneRequest(req)) {
      void handleBlobLaneRequest(req, res, { store: blobStore, auth });
      return;
    }
    // Same drain manners as the blob lane.
    refuse(req, res, 404);
  });

  const wss = new WebSocketServer({
    server: httpServer,
    // Rejected at the handshake, before a socket exists: an unauthorized client
    // gets `401 Unauthorized` instead of an open channel to the device farm.
    verifyClient: ({ req }, done) => {
      if (isAuthorized(req, auth)) return done(true);
      console.error('[detox-remote] rejected an unauthorized connection');
      done(false, 401, 'Unauthorized');
    },
  });

  // Before the first connection, so no client is ever exempt. Termination on a
  // missed pong fires the same 'close' the channel already listens for — the
  // reclaim path below is shared with a clean disconnect, not a second one.
  let stopKeepalive: () => void;
  try {
    stopKeepalive = startKeepalive(wss, keepalive);
  } catch (err) {
    // @issue DTX-6214: invalid options must not leave the just-created
    // server bound forever.
    wss.close();
    try {
      await appGateway.close();
    } catch {
      // already failing — the original error is the story
    }
    throw err;
  }

  // The registry's single reconcile loop: one listing per tick for every
  // allocation's state push, the warm-pool bookkeeping, and the one startup
  // inventory line. Runs under the server's lifetime, stopped with it.
  devicePool.start();

  wss.on('connection', (ws, req) => {
    const connectionId = `session-${String(++nextConnectionId)}`;
    activeConnections.set(connectionId, {
      connectedAt: new Date().toISOString(),
      remoteAddress: req.socket.remoteAddress,
    });
    const channel = createWebSocketChannel(ws);
    const peer = Peer.create(channel);
    peer.onError((err) => console.error('[detox-remote] channel error:', err));
    const serverPeer = new DetoxServerPeer({ peer });
    // The version announce is the first frame of every connection,
    // additive: an old client ignores the unknown notification, and a newer
    // client refuses a mismatched protocol typed instead of guessing at a
    // stale server's undefined behavior.
    serverPeer.notifyServerInfo({ protocol: PROTOCOL_VERSION, server: SERVER_VERSION });
    const serverImpl = new DetoxServerImpl({
      serverPeer,
      devicePool,
      simulatorOps,
      appGateway,
      blobStore,
      config: { iosFrameworkPath },
    });

    // Additive, so this does not displace the listener `Peer.create` registered
    // — which is what aborts the requests still running on this connection.
    // Peer's runs first (registered first), so by the time we reclaim devices,
    // the in-flight handlers have already been told to clean up.
    channel.onClose(() => {
      activeConnections.delete(connectionId);
      serverImpl.release();
    });
  });

  try {
    await new Promise<void>((resolve, reject) => {
      // ws forwards the underlying HTTP server's 'listening' and 'error'
      // events onto `wss` — and an unhandled forwarded error would be an
      // uncaught exception, so the reject listener must live on `wss`, not
      // only on the HTTP server.
      wss.once('listening', resolve);
      wss.once('error', reject);
      httpServer.listen(port, host);
    });
  } catch (err) {
    // @issue DTX-6216: a failed bind must not strand the keepalive interval
    // or the reconcile loop.
    stopKeepalive();
    devicePool.stop();
    wss.close();
    // With a callback, so the "was never listening" complaint goes to it
    // instead of being re-emitted (and forwarded to `wss`) as an event
    // nobody handles.
    httpServer.close(() => undefined);
    try {
      await appGateway.close();
    } catch {
      // already failing — the original error is the story
    }
    throw err;
  }

  let closing: Promise<void> | undefined;

  const server: DetoxRemoteServer = {
    get port() {
      const addr = httpServer.address();
      return typeof addr === 'object' && addr ? addr.port : port;
    },
    get host() {
      return host;
    },
    close() {
      // Idempotent — a second close() must not error via wss.close() on an
      // already-stopped server.
      if (!closing) {
        stopKeepalive();
        devicePool.stop();
        closing = Promise.all([
          closeServer(wss, httpServer),
          appGateway.close(),
        ]).then(() => undefined);
      }
      return closing;
    },
  };
  closeFromAdmin.request = () => {
    void server.close();
  };
  return server;
}

function isLocalHelperAdminRequest(req: IncomingMessage): boolean {
  return req.url?.startsWith('/v1/local-helper/') === true;
}

function hasLocalHelperToken(req: IncomingMessage, expected: string): boolean {
  const presented = req.headers['x-detox-local-helper-token'];
  if (typeof presented !== 'string') return false;
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function closeServer(wss: WebSocketServer, httpServer: HttpServer): Promise<void> {
  const closed = new Promise<void>((resolve, reject) => {
    wss.close((err) => (err ? reject(err) : resolve()));
  });
  // The ws server rides the HTTP server now, so both must close: `wss.close`
  // stops the upgrade path, `httpServer.close` stops the listener itself.
  const httpClosed = new Promise<void>((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });

  // `wss.close` stops accepting new connections but waits for the existing ones
  // to go away on their own. Ask them to leave, then insist. Idle keep-alive
  // HTTP connections (blob-lane clients between requests) get the same
  // treatment, or `httpServer.close` waits on them forever.
  for (const client of wss.clients) {
    client.close(1001, 'Server shutting down');
  }
  httpServer.closeIdleConnections();
  const hardKill = setTimeout(() => {
    for (const client of wss.clients) client.terminate();
    httpServer.closeAllConnections();
  }, CLOSE_GRACE_MS);
  hardKill.unref();

  return Promise.all([closed, httpClosed])
    .then(() => undefined)
    .finally(() => {
      clearTimeout(hardKill);
    });
}
