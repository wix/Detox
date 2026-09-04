/**
 * The client half of the app gateway: the {@link DetoxApp} handle.
 *
 * The matcher/action/expectation surface lives in `expect-two.ts` — a port of
 * Detox 20's `expectTwo.js`, envelopes byte-for-byte (the frozen native side
 * accepts exactly that and nothing else). This file owns what v20 kept in its
 * client/session layer: addressing (every call carries `allocationId` +
 * `appHandleId`), AbortSignal composition, and the
 * failed-expectation message (v20 composed `Test Failed: …` from the app's
 * own details; ported suites match on that text).
 */
import type { AppActionParams, DetoxClientPeer } from '@detox-remote/protocol';
import type {
  AppBy,
  AppCallOptions,
  AppElement,
  AppExpectation,
  AppMatcher,
  AppOpenURLOptions,
  AppPayloadOptions,
  AppWaitFor,
  DetoxApp,
  DetoxOperationName,
} from '../client';
import { DetoxError, DetoxErrorCode } from './errors';
import type { OperationImpl, OperationRegistry } from './operations';
import {
  Element,
  Expect,
  Matcher,
  WaitFor,
  isElement,
  statelessBy as portedBy,
  type InvocationExecutor,
} from './expect-two';

/**
 * The stateless builder, re-exported for `detox/client` (`by`) and every
 * handle's own `.by`.
 *
 * @issue DTX-3002: a matcher built by one app's `by` is legal input to
 * another app's `element`.
 */
export const statelessBy: AppBy = portedBy;

export interface DetoxAppInit {
  client: DetoxClientPeer;
  /**
   * The session's operation registry. Lifecycle verbs (`foreground`, the
   * state waits, live payloads) run as real operations — announced on
   * `detox.on('operation')`, session signal composed — unlike per-tap
   * element traffic, which bypasses the registry.
   */
  registry: OperationRegistry;
  /**
   * Routes server `$/progress` values onto the operation, same as every
   * device verb — without it, narration the server grows for these verbs
   * would be lost.
   */
  routeWireProgress: (op: OperationImpl<unknown>, value: unknown) => void;
  allocationId: string;
  appHandleId: string;
  bundleId: string;
  /** Absent on an attached handle (spec 015): the frozen dialect carries no process identity. */
  pid: number | undefined;
  /** The session-wide signal, composed into every call (AbortSignal-first). */
  sessionSignal?: AbortSignal;
  /**
   * The runner-integration ambient provider (@internal): sampled at call
   * time — element traffic bypasses the registry, so the composition the
   * registry does for device verbs happens here for taps and expectations.
   */
  ambient?: () => AbortSignal | undefined;
}

/**
 * v20 parity for a failed expectation reaching the caller: the app's own
 * `details` text leads the message (`actions.js:198` — `'Test Failed: ' +
 * response.params.details`), so ported helpers that match on `e.message`
 * keep working. Code and payload ride unchanged — the frozen accept pins
 * those, never the message.
 */
interface ExpectationFailurePayload {
  details?: unknown;
}

function withV20FailureMessage(err: unknown): unknown {
  if (err instanceof DetoxError && err.code === DetoxErrorCode.DETOX_EXPECTATION_FAILED) {
    const payload = err.details as ExpectationFailurePayload | undefined;
    if (typeof payload?.details === 'string') {
      return new DetoxError(`Test Failed: ${payload.details}`, {
        code: DetoxErrorCode.DETOX_EXPECTATION_FAILED,
        details: err.details,
        cause: err,
      });
    }
  }
  return err;
}

/** What an app verb's wire call rides: the operation's signal and progress route. */
interface AppWireCallOptions {
  signal: AbortSignal;
  onProgress: (value: unknown) => void;
}

export class DetoxAppImpl implements DetoxApp, InvocationExecutor {
  readonly bundleId: string;
  readonly pid: number | undefined;
  readonly by: AppBy = statelessBy;

  readonly #client: DetoxClientPeer;
  readonly #registry: OperationRegistry;
  readonly #routeWireProgress: (op: OperationImpl<unknown>, value: unknown) => void;
  readonly #allocationId: string;
  readonly #appHandleId: string;
  readonly #sessionSignal: AbortSignal | undefined;
  readonly #ambient: (() => AbortSignal | undefined) | undefined;
  #terminated = false;

  constructor({
    client,
    registry,
    routeWireProgress,
    allocationId,
    appHandleId,
    bundleId,
    pid,
    sessionSignal,
    ambient,
  }: DetoxAppInit) {
    this.#client = client;
    this.#registry = registry;
    this.#routeWireProgress = routeWireProgress;
    this.#allocationId = allocationId;
    this.#appHandleId = appHandleId;
    this.bundleId = bundleId;
    this.pid = pid;
    this.#sessionSignal = sessionSignal;
    this.#ambient = ambient;
  }

  readonly element = (matcher: AppMatcher): AppElement => new Element(this, matcher);

  // @issue DTX-3003: `expect`/`waitFor` route through the element's own
  // executor, not `this`.
  readonly expect = (element: AppElement): AppExpectation => {
    if (!isElement(element)) {
      throw new DetoxError('expect() takes an element built by an app handle', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { parameter: 'element' },
      });
    }
    return new Expect(element.boundExecutor, element);
  };

  readonly waitFor = (element: AppElement): AppWaitFor => {
    if (!isElement(element)) {
      throw new DetoxError('waitFor() takes an element built by an app handle', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { parameter: 'element' },
      });
    }
    return new WaitFor(element.boundExecutor, element);
  };

  readonly reloadReactNative = async (options?: AppCallOptions): Promise<void> => {
    await this.#client.reloadReactNative(
      {
        allocationId: this.#allocationId,
        appHandleId: this.#appHandleId,
      },
      { signal: this.#signal(options) },
    );
  };

  readonly terminate = async (options?: AppCallOptions): Promise<void> => {
    await this.#client.terminateApp(
      {
        allocationId: this.#allocationId,
        appId: this.bundleId,
        appHandleId: this.#appHandleId,
      },
      { signal: this.#signal(options) },
    );
    this.#terminated = true;
  };

  // ── App-state sync and live payloads ─────────────────────────────────────
  // Real operations (see DetoxAppInit.registry): the registry composes the
  // session signal, so #signal() is not used here — options.signal rides in
  // as the call's own narrowing signal, and server progress routes onto the
  // operation like every device verb.

  readonly foreground = (options?: AppCallOptions): Promise<void> =>
    this.#operation('foreground', options, (wire) =>
      this.#client.foregroundApp(this.#address(), wire),
    );

  readonly waitForActive = (options?: AppCallOptions): Promise<void> =>
    this.#operation('waitForActive', options, (wire) =>
      this.#client.waitForActive(this.#address(), wire),
    );

  readonly waitForBackground = (options?: AppCallOptions): Promise<void> =>
    this.#operation('waitForBackground', options, (wire) =>
      this.#client.waitForBackground(this.#address(), wire),
    );

  // Three v20 device verbs share one frozen `setSyncSettings` wire frame.
  // They live on the app handle because the setting belongs to one running
  // app's Detox instrumentation, not the simulator.

  readonly enableSynchronization = (options?: AppCallOptions): Promise<void> =>
    this.#operation('enableSynchronization', options, (wire) =>
      this.#client.setSyncSettings({ ...this.#address(), enabled: true }, wire),
    );

  readonly disableSynchronization = (options?: AppCallOptions): Promise<void> =>
    this.#operation('disableSynchronization', options, (wire) =>
      this.#client.setSyncSettings({ ...this.#address(), enabled: false }, wire),
    );

  readonly setURLBlacklist = (urls: readonly string[], options?: AppCallOptions): Promise<void> => {
    // Copied before validation and send: the caller cannot mutate the array
    // between the check and the frame (TOCTOU).
    const patterns: unknown[] = Array.isArray(urls) ? Array.from<unknown>(urls) : [];
    if (!Array.isArray(urls) || patterns.some((pattern) => typeof pattern !== 'string')) {
      // A rejection, never a synchronous throw — every handle verb fails the
      // same way (the server registration block pins the rule).
      return Promise.reject(
        new DetoxError('setURLBlacklist takes an array of URL regex strings', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setURLBlacklist' },
        }),
      );
    }
    return this.#operation('setURLBlacklist', options, (wire) =>
      this.#client.setSyncSettings(
        { ...this.#address(), blacklistURLs: patterns as string[] },
        wire,
      ),
    );
  };

  readonly sendUserNotification = (payload: unknown, options?: AppPayloadOptions): Promise<void> =>
    this.#operation('sendUserNotification', options, (wire) =>
      this.#client.deliverPayload(
        {
          ...this.#address(),
          userNotification: payload,
          ...(options?.delayUntilActive === true ? { delayPayload: true } : {}),
        },
        wire,
      ),
    );

  readonly openURL = (url: string, options?: AppOpenURLOptions): Promise<void> =>
    this.#operation('openURL', options, (wire) =>
      this.#client.deliverPayload(
        {
          ...this.#address(),
          url,
          ...(options?.sourceApp !== undefined ? { sourceApp: options.sourceApp } : {}),
          ...(options?.delayUntilActive === true ? { delayPayload: true } : {}),
        },
        wire,
      ),
    );

  readonly sendUserActivity = (payload: unknown, options?: AppPayloadOptions): Promise<void> =>
    this.#operation('sendUserActivity', options, (wire) =>
      this.#client.deliverPayload(
        {
          ...this.#address(),
          userActivity: payload,
          ...(options?.delayUntilActive === true ? { delayPayload: true } : {}),
        },
        wire,
      ),
    );

  /**
   * Disposal is termination, minus the double-failure trap: a handle whose
   * app is already dead (or whose device is already released) has nothing
   * left to do, and wrapping the test's real failure in a `SuppressedError`
   * about it would tell the reader the wrong story. Only `DETOX_APP_DIED`,
   * `DETOX_STALE_HANDLE` and `DETOX_ABORTED` are swallowed; any other
   * terminate failure is real news.
   */
  async [Symbol.asyncDispose](): Promise<void> {
    if (this.#terminated) return;
    try {
      await this.terminate();
    } catch (err) {
      const code = (err as { code?: number } | null)?.code;
      if (
        code !== DetoxErrorCode.DETOX_APP_DIED &&
        code !== DetoxErrorCode.DETOX_STALE_HANDLE &&
        // A disposal running because the session's signal aborted composes
        // that same signal into its own terminate, which then rejects as
        // aborted — swallowed too, so cleanup doesn't mask the real failure.
        code !== DetoxErrorCode.DETOX_ABORTED
      ) {
        throw err;
      }
    }
  }

  /**
   * The serializer's seam: one invoke on this handle's channel, addressed by
   * allocation + app handle. Resolves with the app's own `invokeResult`
   * payload verbatim — v20 resolved `response.params`, and `getAttributes` is
   * that payload surfaced to the caller.
   */
  async executeInvocation(
    invocation: Record<string, unknown>,
    options?: AppCallOptions,
  ): Promise<unknown> {
    try {
      const reply = await this.#client.invoke(
        {
          allocationId: this.#allocationId,
          appHandleId: this.#appHandleId,
          invocation,
        },
        { signal: this.#signal(options) },
      );
      return reply?.result;
    } catch (err) {
      throw withV20FailureMessage(err);
    }
  }

  /** The uniform app address: allocation + server-minted handle. */
  #address(): AppActionParams {
    return { allocationId: this.#allocationId, appHandleId: this.#appHandleId };
  }

  /** One spec-006 verb as a registry operation; the wire call is the body. */
  #operation(
    name: DetoxOperationName,
    options: AppCallOptions | undefined,
    execute: (wire: AppWireCallOptions) => Promise<void>,
  ): Promise<void> {
    return this.#registry.run<void>(name, {
      signal: options?.signal,
      execute: async (op) => {
        await execute({
          signal: op.signal,
          onProgress: (value) => this.#routeWireProgress(op, value),
        });
      },
    });
  }

  /** Session signal composed with the call's own — AbortSignal-first, everywhere. */
  #signal(options?: AppCallOptions): AbortSignal | undefined {
    const signals = [this.#sessionSignal, this.#ambient?.(), options?.signal].filter(
      (signal): signal is AbortSignal => signal !== undefined,
    );
    if (signals.length === 0) return undefined;
    return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
  }
}

export { Element, Expect, Matcher, WaitFor };
