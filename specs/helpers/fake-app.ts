/**
 * A protocol-faithful fake testee — the ground-truth side of spec 003.
 *
 * The native app side is frozen and lives in Detox 20; this repo has no
 * instrumented app to launch (and building one drags in a full RN toolchain).
 * So the accept suite launches a real stub process on the simulator (the
 * server must really `simctl launch` something) and plays the app's wire role
 * from the host with this fake, speaking the frozen native dialect
 * `{type, messageId, params}` as `detox/ios/Detox` does.
 *
 * The fake is stricter than a polite client, because the real native side is
 * strict in the deadliest way:
 *  - a server→app message without a numeric `messageId` crashes the app
 *    (force-unwrap, Detox 20 `WebSocket.swift:112`) — here it throws;
 *  - an action `type` outside the closed set the native switch knows is a
 *    `fatalError` (Detox 20 `DetoxManager.swift:419-421`) — here it throws.
 * A gateway that passes this fake would not have crashed a real app.
 *
 * Faithful behaviours mirrored from the native side:
 *  - `login` is sent on connect with hardcoded `messageId: 0`
 *    (`WebSocket.swift:122-124`), role `'app'`;
 *  - `ready` is pushed with the frozen sentinel `messageId: -1000`
 *    (`DetoxManager.swift:111-113`);
 *  - an inbound `isReady` is answered with `ready` iff ready, and silently
 *    ignored otherwise (`DetoxManager.swift:285-289`);
 *  - frames are sent as binary websocket messages, because that is what the
 *    native side sends (`WebSocket.swift:43-56`) — a gateway that only
 *    accepts text frames cannot talk to a real app;
 *  - inbound JSON is parsed leniently enough for Detox 20's trailing `'\n '`
 *    framing quirk (`DetoxConnection.js:47`), without requiring it.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { waitUntil } from './simctl';

const run = promisify(execFile);

/** One frame of the frozen native dialect. */
export interface FrozenMessage {
  readonly type: string;
  readonly messageId: number;
  readonly params?: Record<string, unknown>;
}

/**
 * Every action type the frozen native switch accepts that this suite may
 * legitimately see. Anything else would have `fatalError`ed a real app, so
 * the fake fails the test instead. Extending this set requires a citation of
 * the native switch (Detox 20 `DetoxManager.swift`, `webSocket(_:didReceiveAction:...)`).
 */
const KNOWN_APP_BOUND_TYPES = new Set([
  'loginSuccess',
  'isReady',
  'invoke',
  'cleanup',
  'deliverPayload',
  'currentStatus',
  'setSyncSettings',
  'setOrientation',
  'shake',
  'testerDisconnected',
  // Spec 006 — the app-state waits (DetoxManager.swift:246-251 answers them
  // with waitForActiveDone / waitForBackgroundDone).
  'waitForActive',
  'waitForBackground',
]);

/** The frozen ready/isReady sentinel (`actions.js:56`, `DetoxManager.swift:112`). */
const READY_SENTINEL_MESSAGE_ID = -1000;
/** The native's hardcoded login messageId (`WebSocket.swift:122-124`). */
const LOGIN_MESSAGE_ID = 0;

const DEFAULT_WAIT_MS = 30_000;

interface RawMessageEvent {
  readonly data: unknown;
}

interface RawCloseEvent {
  readonly code: number;
  readonly reason: string;
}

/** The minimal WHATWG-WebSocket surface used, so no DOM lib is required. */
interface RawWebSocket {
  binaryType: string;
  send(data: Uint8Array | string): void;
  close(code?: number): void;
  addEventListener(type: 'open', listener: () => void): void;
  addEventListener(type: 'message', listener: (event: RawMessageEvent) => void): void;
  addEventListener(type: 'close', listener: (event: RawCloseEvent) => void): void;
  addEventListener(type: 'error', listener: (event: unknown) => void): void;
}

type RawWebSocketConstructor = new (url: string) => RawWebSocket;

/** `globalThis` narrowed to the one global this helper needs (Node >= 22). */
interface GlobalWithWebSocket {
  WebSocket?: RawWebSocketConstructor;
}

export interface FakeAppOptions {
  /** The `-detoxServer` URL, dialed verbatim — no headers added: the real app cannot send any either. */
  readonly url: string;
  /** The `-detoxSessionId` value to log in with. */
  readonly sessionId: string;
  readonly signal?: AbortSignal;
}

export interface NextMessageOptions {
  readonly timeoutMs?: number;
}

/** How the socket ended, whoever ended it. */
export interface SocketClosure {
  readonly code: number;
}

export interface FakeAppTestee extends AsyncDisposable {
  /** Append-only log of every validated inbound frame, in arrival order. */
  readonly received: readonly FrozenMessage[];
  /** The gateway's reply to this fake's `login` — already validated. */
  readonly loginReply: FrozenMessage;
  /**
   * The native readiness choreography in one call: waits for the gateway's
   * `isReady` probe (frozen sentinel), then pushes `ready`. After it, a
   * pending `launchApp` may resolve.
   */
  handshake(): Promise<void>;
  /**
   * Waits for (and consumes) the first not-yet-consumed inbound frame
   * matching `predicate` (default: any frame). Frames that never match stay
   * consumable by later calls.
   */
  nextMessage(
    predicate?: (message: FrozenMessage) => boolean,
    options?: NextMessageOptions,
  ): Promise<FrozenMessage>;
  /** Sends a raw frozen-dialect frame, as a binary websocket message. */
  send(message: FrozenMessage): void;
  /** Marks the app ready and pushes the frozen `ready` sentinel frame. */
  markReady(): void;
  close(code?: number): void;
  /** Settles when the socket closes — whoever closed it. */
  readonly closed: Promise<SocketClosure>;
}

const decodeFrame = (data: unknown): string => {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    );
  }
  throw new Error(`fake app: unsupported websocket frame payload (${typeof data})`);
};

/**
 * Validates one inbound frame the way the frozen native side would react to
 * it — throwing where the native would crash.
 */
const validateFrame = (raw: string): FrozenMessage => {
  // JSON.parse tolerates trailing whitespace (RFC 8259), which covers Detox
  // 20's `'\n '` suffix without demanding it.
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`fake app: non-object frame: ${raw}`);
  }
  const frame = parsed as Partial<FrozenMessage> & Record<string, unknown>;
  if (typeof frame.type !== 'string' || frame.type.length === 0) {
    throw new Error(`fake app: frame without a string "type": ${raw}`);
  }
  if (typeof frame.messageId !== 'number') {
    throw new Error(
      `fake app: "${frame.type}" frame without a numeric messageId — ` +
        `this crashes a real app (WebSocket.swift force-unwrap): ${raw}`,
    );
  }
  if (!KNOWN_APP_BOUND_TYPES.has(frame.type)) {
    throw new Error(
      `fake app: unknown action type "${frame.type}" — this fatalErrors a ` +
        `real app (DetoxManager.swift default case): ${raw}`,
    );
  }
  return frame as unknown as FrozenMessage;
};

/**
 * Dials the gateway and completes the app-side login handshake. Resolves
 * once `loginSuccess` arrives (validated, `messageId` echoing the login's).
 */
export async function connectFakeApp(options: FakeAppOptions): Promise<FakeAppTestee> {
  const WebSocketCtor = (globalThis as GlobalWithWebSocket).WebSocket;
  if (!WebSocketCtor) throw new Error('fake app: global WebSocket missing (Node >= 22 required)');

  const { url, sessionId, signal } = options;
  const ws = new WebSocketCtor(url);
  ws.binaryType = 'arraybuffer';

  const received: FrozenMessage[] = [];
  const unconsumed: FrozenMessage[] = [];
  const waiters: Array<{
    predicate: (message: FrozenMessage) => boolean;
    resolve: (message: FrozenMessage) => void;
    reject: (error: Error) => void;
  }> = [];
  let ready = false;
  let dead: Error | null = null;
  const closed = Promise.withResolvers<SocketClosure>();

  const failEveryone = (error: Error): void => {
    dead = dead ?? error;
    for (const waiter of waiters.splice(0)) waiter.reject(error);
  };

  const send = (message: FrozenMessage): void => {
    // Binary, as the native side sends its frames.
    ws.send(new TextEncoder().encode(JSON.stringify(message)));
  };

  const dispatch = (frame: FrozenMessage): void => {
    received.push(frame);
    // Native parity: answer isReady iff ready, silently ignore otherwise —
    // but the frame still lands in the log and the consumable queue.
    if (frame.type === 'isReady' && ready) {
      send({ type: 'ready', messageId: READY_SENTINEL_MESSAGE_ID });
    }
    const index = waiters.findIndex((waiter) => waiter.predicate(frame));
    if (index >= 0) {
      const [waiter] = waiters.splice(index, 1);
      waiter.resolve(frame);
    } else {
      unconsumed.push(frame);
    }
  };

  ws.addEventListener('message', (event) => {
    try {
      dispatch(validateFrame(decodeFrame(event.data)));
    } catch (error) {
      failEveryone(error instanceof Error ? error : new Error(String(error)));
      ws.close();
    }
  });
  ws.addEventListener('close', (event) => {
    closed.resolve({ code: event.code });
    failEveryone(dead ?? new Error('fake app: socket closed while a message was awaited'));
  });
  ws.addEventListener('error', () => {
    // The paired 'close' event carries the observable outcome.
  });
  signal?.addEventListener('abort', () => ws.close(), { once: true });

  const nextMessage = (
    predicate: (message: FrozenMessage) => boolean = () => true,
    { timeoutMs = DEFAULT_WAIT_MS }: NextMessageOptions = {},
  ): Promise<FrozenMessage> => {
    const index = unconsumed.findIndex((message) => predicate(message));
    if (index >= 0) return Promise.resolve(unconsumed.splice(index, 1)[0]);
    if (dead) return Promise.reject(dead);
    const { promise, resolve, reject } = Promise.withResolvers<FrozenMessage>();
    const waiter = { predicate, resolve, reject };
    waiters.push(waiter);
    const timer = setTimeout(() => {
      const at = waiters.indexOf(waiter);
      if (at >= 0) waiters.splice(at, 1);
      reject(new Error(`fake app: no matching message within ${String(timeoutMs)}ms`));
    }, timeoutMs);
    timer.unref();
    return promise.finally(() => clearTimeout(timer));
  };

  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('close', (event) =>
      reject(dead ?? new Error(`fake app: socket closed before open (code ${String(event.code)})`)),
    );
  });
  // Native parity: login goes out with hardcoded messageId 0, role 'app'.
  send({
    type: 'login',
    messageId: LOGIN_MESSAGE_ID,
    params: { sessionId, role: 'app' },
  });
  const loginReply = await nextMessage((message) => message.type === 'loginSuccess');

  const close = (code?: number): void => ws.close(code);

  const markReady = (): void => {
    ready = true;
    send({ type: 'ready', messageId: READY_SENTINEL_MESSAGE_ID });
  };

  return {
    received,
    loginReply,
    nextMessage,
    send,
    markReady,
    handshake: async (): Promise<void> => {
      await nextMessage((message) => message.type === 'isReady');
      markReady();
    },
    close,
    closed: closed.promise,
    [Symbol.asyncDispose]: (): Promise<void> => {
      close();
      return Promise.resolve();
    },
  };
}

/** A simulator-side process launched with Detox launch arguments. */
export interface DiscoveredDetoxApp {
  readonly pid: number;
  readonly command: string;
  readonly detoxServer?: string;
  readonly detoxSessionId?: string;
}

/** A discovered process whose Detox launch args are confirmed present. */
export interface LaunchedDetoxProcess extends DiscoveredDetoxApp {
  readonly detoxServer: string;
  readonly detoxSessionId: string;
}

/** A fake testee standing in for one concrete launched process. */
export interface ImpersonatedApp extends FakeAppTestee {
  /** The real OS process this fake impersonates — argv is ground truth. */
  readonly process: LaunchedDetoxProcess;
}

/**
 * Ground truth for "the server really launched the app with the frozen
 * launch-argument convention": scans host processes (simulator apps are host
 * processes) for binaries under this simulator's device directory carrying
 * `-detoxServer`, and reads the very argv `NSUserDefaults` would read.
 */
export async function discoverDetoxApps(
  udid: string,
  signal?: AbortSignal,
): Promise<DiscoveredDetoxApp[]> {
  const { stdout } = await run('ps', ['-axo', 'pid=,args='], {
    signal,
    maxBuffer: 16 * 1024 * 1024,
  });
  const apps: DiscoveredDetoxApp[] = [];
  for (const line of stdout.split('\n')) {
    const match = /^\s*(\d+)\s+(.*)$/.exec(line);
    if (!match) continue;
    const [, pid, command] = match;
    const argv = command.split(/\s+/);
    // The EXECUTABLE must live in this simulator's data container — not merely
    // some argument. `simctl launch` carries `--stdout=<devices root>/<udid>/
    // data/tmp/...` and the app's `-detoxServer` pair on its own command line
    // (spec 013's capture), so a whole-command match also matches simctl
    // itself, whose pid sits just below the app's and dies as soon as the
    // launch returns.
    if (!(argv[0] ?? '').includes(`/Devices/${udid}/`) || !command.includes('-detoxServer')) continue;
    const argAfter = (flag: string): string | undefined => {
      const at = argv.indexOf(flag);
      return at >= 0 ? argv[at + 1] : undefined;
    };
    apps.push({
      pid: Number(pid),
      command,
      detoxServer: argAfter('-detoxServer'),
      detoxSessionId: argAfter('-detoxSessionId'),
    });
  }
  return apps;
}

/**
 * The token following `flag` in a `ps`-rendered command line (spec 006's
 * argv assertions). Naive whitespace tokenizer, same as
 * {@link discoverDetoxApps}' own parsing: a launch-arg value containing a
 * space cannot be read through this — none of the accept fixtures uses one.
 */
export function argvValueOf(command: string, flag: string): string | undefined {
  const argv = command.split(/\s+/);
  const at = argv.indexOf(flag);
  return at >= 0 ? argv[at + 1] : undefined;
}

export interface ImpersonateOptions {
  readonly signal?: AbortSignal;
  /** A relaunch waits for the successor process, not the doomed one. */
  readonly excludePid?: number;
}

/**
 * The whole "act as the launched app" choreography in one call: polls host
 * processes until the server's `simctl launch` of `sessionId` shows up
 * carrying the frozen launch-arg convention, then dials the argv's own
 * `-detoxServer` URL verbatim and completes the app-side login. The
 * returned fake exposes the discovered process, so the argv assertions
 * stay in the accept file's hands.
 */
export async function impersonateLaunchedApp(
  udid: string,
  sessionId: string,
  options: ImpersonateOptions = {},
): Promise<ImpersonatedApp> {
  const { signal, excludePid } = options;
  let found: DiscoveredDetoxApp | undefined;
  await waitUntil(
    async () => {
      const apps = await discoverDetoxApps(udid, signal);
      found = apps.find(
        (app) => app.detoxSessionId === sessionId && app.pid !== excludePid,
      );
      return found !== undefined;
    },
    {
      signal,
      description: 'launched detox app process for ' + sessionId,
      // Far above the helper default: the first `simctl launch` of a run pays
      // the runtime-wide warm-up of a cold CoreSimulator — the run's first
      // launch can blow the 30 s default while every later test's launch
      // appears in seconds. The server's own launch deadline is the real
      // gate on a hung launch; this wait only has to outlive it.
      timeoutMs: 150_000,
    },
  );
  if (!found?.detoxServer || !found.detoxSessionId) {
    throw new Error(
      'impersonateLaunchedApp: process found without full detox launch args: ' +
        (found?.command ?? '<none>'),
    );
  }
  const process = found as LaunchedDetoxProcess;
  const testee = await connectFakeApp({
    url: process.detoxServer,
    sessionId: process.detoxSessionId,
    signal,
  });
  return { ...testee, process };
}

/**
 * Ground truth that an app's OS process is gone (e.g. after `terminate`) —
 * polls the same host-process listing the discovery uses.
 */
export async function waitForAppProcessExit(
  udid: string,
  pid: number,
  signal?: AbortSignal,
): Promise<void> {
  await waitUntil(
    async () => !(await discoverDetoxApps(udid, signal)).some((app) => app.pid === pid),
    { signal, description: 'app process ' + String(pid) + ' to exit' },
  );
}
