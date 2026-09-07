import type { Channel, MessageHandler, CloseHandler } from './channel';

export interface MemoryChannel extends Channel {
  close(): void;
}

/** @issue DTX-1018: isolates message listeners from each other's throws, and from the sender's own `send()` call. */
function dispatchMessage(handlers: readonly MessageHandler[], msg: unknown): void {
  for (const handler of [...handlers]) {
    try {
      handler(msg);
    } catch (error) {
      console.error('[detox] a channel message listener threw; ignoring it:', error);
    }
  }
}

export function memoryChannel(): [MemoryChannel, MemoryChannel] {
  const aMessageHandlers: MessageHandler[] = [];
  const bMessageHandlers: MessageHandler[] = [];
  const aCloseHandlers: CloseHandler[] = [];
  const bCloseHandlers: CloseHandler[] = [];
  let closed = false;

  function closeBoth() {
    if (closed) return;
    closed = true;
    // A copy: a listener may unsubscribe others while we iterate.
    for (const handler of [...aCloseHandlers]) handler();
    for (const handler of [...bCloseHandlers]) handler();
  }

  const a: MemoryChannel = {
    send(msg: unknown) {
      if (closed) return;
      dispatchMessage(bMessageHandlers, msg);
    },
    onMessage(handler) {
      aMessageHandlers.push(handler);
    },
    onClose(handler) {
      aCloseHandlers.push(handler);
    },
    onError() {
      // Messages pass through as live references, never JSON — nothing to fail.
    },
    close: closeBoth,
  };

  const b: MemoryChannel = {
    send(msg: unknown) {
      if (closed) return;
      dispatchMessage(aMessageHandlers, msg);
    },
    onMessage(handler) {
      bMessageHandlers.push(handler);
    },
    onClose(handler) {
      bCloseHandlers.push(handler);
    },
    onError() {
      // Messages pass through as live references, never JSON — nothing to fail.
    },
    close: closeBoth,
  };

  return [a, b];
}
