import type { WebSocket } from 'ws';
import type { Channel, CloseInfo, MessageHandler, CloseHandler, ErrorHandler } from './channel';

export interface WebSocketChannel extends Channel {
  close(): void;
}

const OPEN = 1;
const CONNECTING = 0;

/**
 * The close reason is peer-supplied text headed for error messages and logs:
 * strip control and format characters (newlines, ANSI escapes) so a hostile
 * peer cannot forge log lines through it. WS caps the field at 123 bytes; the
 * slice is a belt for non-WS transports reusing the type.
 */
function sanitizeReason(text: string): string {
  return text.replace(/[\p{Cc}\p{Cf}]/gu, ' ').slice(0, 123).trim();
}

/**
 * Calls every message listener with the same message, isolating each from
 * the others' throws. Runs outside the `JSON.parse` try/catch it's called
 * from, so a throwing listener is never misreported as malformed JSON.
 */
function dispatchMessage(handlers: readonly MessageHandler[], msg: unknown): void {
  for (const handler of [...handlers]) {
    try {
      handler(msg);
    } catch (error) {
      console.error('[detox] a channel message listener threw; ignoring it:', error);
    }
  }
}

/**
 * A caller that dials asynchronously (`new Promise((resolve) => ws.once('open', () =>
 * resolve(createWebSocketChannel(ws))))`) cannot call `onMessage` until its dial promise
 * settles — at least one microtask after this channel exists. A peer that answers the instant
 * it accepts the connection can have its first frame arrive in the very same synchronous turn
 * as `open` (one TCP segment carrying both the handshake response and the first WS frame), which
 * is strictly before that microtask runs. Bounded so a channel nobody ever listens on cannot
 * grow this without limit; the window it actually covers is one peer's opening frames, not a
 * standing backlog.
 *
 * This buffer covers the gap from `createWebSocketChannel` to the first
 * `onMessage`, and nothing earlier. A dialer must therefore build the channel
 * BEFORE (or synchronously inside) `open` — never in the continuation of a
 * dial promise: `ws` unshifts a same-segment first frame and delivers it on
 * the nextTick queue, which drains ahead of promise microtasks, so a channel
 * built after the await never sees that frame and has nothing to buffer it
 * into. It is silently lost, and a peer waiting on an opening announce then
 * waits forever.
 *
 * The drain itself runs one microtask after that first `onMessage`, not
 * inside it. The first listener is normally a `Peer`, whose own consumer
 * registers its method handlers right after `Peer.create` returns, in the
 * same synchronous turn; a backlog handed over inside `onMessage` would
 * reach a peer with no handler for it yet, and a notification nobody
 * handles is dropped. Arrivals during that one microtask queue behind the
 * backlog, so delivery order is preserved.
 */
const PENDING_CAP = 16;

export function createWebSocketChannel(ws: WebSocket): WebSocketChannel {
  const messageHandlers: MessageHandler[] = [];
  const closeHandlers: CloseHandler[] = [];
  const errorHandlers: ErrorHandler[] = [];
  const pending: unknown[] = [];
  let draining = false;
  let closed = false;

  function fireClose(info?: CloseInfo): void {
    if (closed) return;
    closed = true;
    // A copy: a listener may unsubscribe others while we iterate.
    for (const handler of [...closeHandlers]) handler(info);
  }

  ws.on('message', (data: Buffer | string) => {
    if (closed) return;
    const raw = typeof data === 'string' ? data : data.toString('utf8');
    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      // Malformed JSON — drop silently
      return;
    }
    if (messageHandlers.length === 0 || draining) {
      pending.push(msg);
      if (pending.length > PENDING_CAP) pending.shift();
      return;
    }
    dispatchMessage(messageHandlers, msg);
  });

  // The close frame's reason is load-bearing: it is how a client that was
  // paused past the server's keepalive window learns, on resume, why its
  // session ended. `1005` means "no status present" — report nothing then.
  ws.on('close', (code: number, reason: Buffer) => {
    const text = sanitizeReason(reason.toString('utf8'));
    fireClose(code === 1005 && !text ? undefined : { code, reason: text });
  });
  // @issue DTX-1014: listener only, no fireClose — the close frame that follows settles it.
  ws.on('error', () => {});

  return {
    send(msg: unknown) {
      if (closed || ws.readyState !== OPEN) return;
      try {
        ws.send(JSON.stringify(msg));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        for (const handler of [...errorHandlers]) handler(error);
      }
    },
    onMessage(handler: MessageHandler) {
      const flush = messageHandlers.length === 0 && pending.length > 0;
      messageHandlers.push(handler);
      if (!flush) return;
      // The first handler ever attached gets whatever arrived before it
      // existed, in arrival order, ahead of any message that arrives from
      // here on — one microtask later, so the caller can finish registering
      // what it dispatches to (see `PENDING_CAP`).
      draining = true;
      queueMicrotask(() => {
        draining = false;
        for (const msg of pending.splice(0)) dispatchMessage(messageHandlers, msg);
      });
    },
    onClose(handler: CloseHandler) {
      closeHandlers.push(handler);
    },
    onError(handler: ErrorHandler) {
      errorHandlers.push(handler);
    },
    close() {
      if (closed) return;
      if (ws.readyState === CONNECTING || ws.readyState === OPEN) {
        ws.close();
      }
      // @issue DTX-1015: a local close fires onClose synchronously, with no close-frame info.
      fireClose();
    },
  };
}
