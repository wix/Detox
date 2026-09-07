/**
 * A fake `ws.WebSocket` plus a real `Peer` wired directly to it — the
 * in-memory stand-in `session.ts`'s tests drive instead of a real socket.
 *
 * `session.ts` only ever talks to what `createWebSocketChannel` needs from a
 * `ws.WebSocket` (`on`/`off`/`once`, `send`, `close`, `readyState`) plus the
 * bespoke `unexpected-response` event `connectWebSocket` listens for — so a
 * plain `EventEmitter` standing in for it is enough to drive every branch
 * without a real socket or port. On the far end sits a genuine `Peer` (from
 * `@detox-remote/core`, the same class `DetoxClientPeer` uses) so the
 * request/response/notification/progress semantics under test are the real
 * ones, not a hand-rolled approximation of them.
 */
import { EventEmitter } from 'node:events';
import { Peer } from '@detox-remote/core';
import { PROTOCOL_VERSION } from '@detox-remote/protocol';
import type { Channel, RequestHandler } from '@detox-remote/core';

type MessageHandler = (msg: unknown) => void;

export const READY_STATE = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 } as const;

export interface FakeWebSocketOptions {
  headers?: Record<string, string>;
}

/**
 * Stands in for `new WebSocket(url, opts)` from the `ws` package. Test code
 * drives its lifecycle explicitly (`open`/`failToConnect`/`refuseHandshake`)
 * instead of a real handshake ever happening.
 */
export class FakeWebSocket extends EventEmitter {
  /** Every instance constructed during the current test, in creation order. */
  static readonly created: FakeWebSocket[] = [];

  readyState: number = READY_STATE.CONNECTING;
  readonly url: string;
  readonly headers?: Record<string, string>;
  #onSend?: (data: string) => void;

  constructor(url: string, options?: FakeWebSocketOptions) {
    super();
    this.url = url;
    this.headers = options?.headers;
    FakeWebSocket.created.push(this);
  }

  /** Wired by {@link attachFakeServer}: what happens when `session.ts` sends. */
  bindSend(onSend: (data: string) => void): void {
    this.#onSend = onSend;
  }

  send(data: string): void {
    this.#onSend?.(data);
  }

  close(code: number = 1000, reason: string = ''): void {
    if (this.readyState === READY_STATE.CLOSED) return;
    this.readyState = READY_STATE.CLOSED;
    // Real `ws` reports a locally initiated close(code, reason) back through
    // the 'close' event too — the version-skew path (session.ts closing with
    // 4002) depends on exactly that echo.
    this.emit('close', code, Buffer.from(reason));
  }

  terminate(): void {
    this.close();
  }

  /**
   * Test control: the handshake succeeds. A real serving door announces
   * itself on its first frame, and since spec 012 `connect` waits for that
   * announce — so the fake delivers one (`log` included, so `log.begin`
   * has a connection id) unless a test wants to send its own first.
   */
  open(options: { announce?: boolean; runId?: string | null } = {}): void {
    this.readyState = READY_STATE.OPEN;
    this.emit('open');
    if (options.announce !== false) {
      // A macrotask, like the real socket's next data event: the session
      // attaches its listeners across several microtask hops after 'open'.
      setImmediate(() => this.deliver({
        jsonrpc: '2.0',
        method: '$/serverInfo',
        params: {
          protocol: PROTOCOL_VERSION,
          server: 'fake',
          ...(options.runId !== null ? { log: { runId: options.runId ?? 'fake-connection' } } : {}),
        },
      }));
    }
  }

  /** Test control: the underlying connect attempt fails outright. */
  failToConnect(error: Error): void {
    this.emit('error', error);
  }

  /** Test control: the server answers the handshake with a rejection. */
  refuseHandshake(statusCode: number): void {
    this.emit('unexpected-response', {}, { statusCode });
  }

  /** Test control: deliver a server→client frame straight onto the wire. */
  deliver(message: unknown): void {
    if (this.readyState !== READY_STATE.OPEN) return;
    queueMicrotask(() => this.emit('message', JSON.stringify(message)));
  }
}

/**
 * The server side of the wire: a `Channel` over a {@link FakeWebSocket},
 * mirroring what `createWebSocketChannel` gives the client side, so a real
 * `Peer.create(...)` can sit on top of it exactly as the real Detox Server's
 * does.
 */
export function attachFakeServer(socket: FakeWebSocket): Channel {
  const handlers: MessageHandler[] = [];
  socket.bindSend((data) => {
    let msg: unknown;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    queueMicrotask(() => {
      for (const handler of handlers) handler(msg);
    });
  });
  return {
    send(msg) {
      socket.deliver(msg);
    },
    onMessage(handler) {
      handlers.push(handler);
    },
    onClose() {
      // Nothing in these tests observes the server's own close channel.
    },
    onError() {
      // Fake transport never fails to serialize.
    },
  };
}

/** A thin, typed convenience over the server-side `Peer` for test bodies. */
export interface FakeServer {
  readonly peer: Peer;
  onRequest<P, R>(method: string, handler: RequestHandler<P, R>): void;
  notify(method: string, params: unknown): void;
}

export function createFakeServer(socket: FakeWebSocket): FakeServer {
  const peer = Peer.create(attachFakeServer(socket));
  return {
    peer,
    onRequest(method, handler) {
      peer.onRequest({ method, handler: handler as RequestHandler });
    },
    notify(method, params) {
      peer.notify({ method, params });
    },
  };
}

/** Opens the most recently constructed socket and returns a server over it. */
export function connectFakeServer(): FakeServer {
  const socket = FakeWebSocket.created.at(-1);
  if (!socket) throw new Error('no FakeWebSocket has been constructed yet');
  const server = createFakeServer(socket);
  socket.open();
  return server;
}
