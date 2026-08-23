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

export function createWebSocketChannel(ws: WebSocket): WebSocketChannel {
  const messageHandlers: MessageHandler[] = [];
  const closeHandlers: CloseHandler[] = [];
  const errorHandlers: ErrorHandler[] = [];
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
      messageHandlers.push(handler);
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
