/**
 * v20 wording for the two failures old suites assert on by message text.
 *
 * Detox 20 composed these sentences in its client, and corpus fixtures match
 * on them (`19.crash-handling` uses `expectToThrow(fn, 'The app has crashed')`
 * four times). v21's own wording is its contract — pinned by the frozen
 * accept files and deliberately more precise ("The app behind this handle is
 * gone") — so the translation lives here, on the surface whose contract is
 * v20, exactly like the `Test Failed: …` prefix the client keeps for the same
 * reason.
 *
 * @issue DTX-4042: nothing is invented — the code, the details and the cause ride through
 * untouched, and the native's own crash report is folded back into the message.
 */
import { DetoxError, DetoxErrorCode } from 'detox/client';

/** v20 `Client.js:349`, verbatim. */
const CRASH_MESSAGE = 'The app has crashed, see the details below:';
/** v20's wording when nothing is connected (`Client.js` connect error). */
export const NOT_CONNECTED_MESSAGE = "Detox can't seem to connect to the test app(s)!";

interface DeathDetails {
  appReport?: { errorDetails?: unknown };
}

/** The slice of a typed error this module reads — duck-typed, never `instanceof`. */
interface DetoxErrorLike {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

/**
 * Re-words an app-death rejection the way Detox 20 did, and leaves every other error strictly
 * alone.
 *
 * Duck-typed on `.code`, deliberately not `instanceof DetoxError` (spec 010):
 * under jest, the error may have been minted by the outer realm's client
 * while this module is a sandboxed `require('detox')` copy — `instanceof` is
 * realm-local and would silently skip the translation there. The numeric
 * code is the cross-realm identity, same as everywhere else in this stack.
 */
export function toV20Error(err: unknown): unknown {
  const carrier = err as DetoxErrorLike | null;
  if (
    typeof carrier !== 'object' ||
    carrier === null ||
    carrier.code !== DetoxErrorCode.DETOX_APP_DIED
  ) {
    return err;
  }
  const report = (carrier.details as DeathDetails | undefined)?.appReport?.errorDetails;
  const message = typeof carrier.message === 'string' ? carrier.message : String(err);
  const detail = typeof report === 'string' && report.length > 0 ? report : message;
  const translated = new DetoxError(`${CRASH_MESSAGE}\n\n${detail}`, {
    code: DetoxErrorCode.DETOX_APP_DIED,
    details: carrier.details as Record<string, unknown> | undefined,
    cause: err,
  });
  // @issue DTX-4043: v20 put the native report in the stack too, because that is the only part
  // jest prints for a thrown error. No manual prepend is needed: V8 renders `stack` as
  // `<name>: <message>` + frames, and the report is already inside `message`.
  return translated;
}

/**
 * @issue DTX-4045: wraps an element/expectation/waitFor object so every rejection it produces
 * passes through {@link toV20Error}, chained objects included (`element(...).atIndex(0)`,
 * `expect(...).not`, `waitFor(...).toBeVisible()`).
 * Only class instances are wrapped further: a plain object or array coming back from an action
 * is data (`getAttributes`' result), and re-wrapping it would put a proxy where a ported
 * fixture expects a value.
 */
export function withV20Errors<T extends object>(
  target: T,
  /**
   * Applied to every argument on its way in. The compat surface uses it to swap its late-bound
   * `element()` stand-ins for real elements: a v20 fixture passes elements as arguments too
   * (`longPressAndDrag(…, target, …)`, `whileElement(…)`), and the client's serializer rejects
   * anything that is not its own `Element`.
   */
  mapArg: (value: unknown) => unknown = (value) => value,
): T {
  return new Proxy(target, {
    get(object, property) {
      // @issue DTX-4047: receiver is the raw object on purpose — a getter reaching a private field through the proxy would throw.
      const value = Reflect.get(object, property, object) as unknown;
      if (typeof value === 'function') {
        return (...args: unknown[]): unknown => {
          let result: unknown;
          try {
            result = (value as (...a: unknown[]) => unknown).apply(object, args.map(mapArg));
          } catch (err) {
            throw toV20Error(err);
          }
          // Thenable check, not `instanceof Promise` (spec 010): a promise
          // minted by the outer realm's client fails a realm-local
          // instanceof, and the translation would silently vanish on the
          // sandboxed-`require('detox')` path.
          if (isThenable(result)) {
            const translated = result.catch((err: unknown) => {
              throw toV20Error(err);
            });
            // A call taken but not awaited must never crash the process (the
            // operation registry's own rule): the jest environment's
            // file-scope abort settles a fixture's forgotten promise, and an
            // unhandled AbortError there would kill the worker after jest
            // removed its own handlers. Awaiting callers still see the
            // rejection through `translated`.
            translated.catch(() => undefined);
            return translated;
          }
          return wrapIfInstance(result, mapArg);
        };
      }
      return wrapIfInstance(value, mapArg);
    },
  });
}

/** The two members a cross-realm promise must answer for the wrap above. */
interface ThenableLike {
  then?: unknown;
  catch?: unknown;
}

function isThenable(value: unknown): value is Promise<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ThenableLike).then === 'function' &&
    typeof (value as ThenableLike).catch === 'function'
  );
}

function wrapIfInstance(value: unknown, mapArg: (value: unknown) => unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const proto: unknown = Object.getPrototypeOf(value);
  // Plain data stays a value. The extra `getPrototypeOf(proto) === null` leg
  // is the cross-realm spelling of "plain object" (spec 010): an object
  // literal produced by the outer realm has another realm's
  // `Object.prototype`, which this realm's identity check cannot name — but
  // a plain prototype is always the chain's last link, and a class
  // instance's never is.
  if (
    proto === Object.prototype ||
    proto === null ||
    Object.getPrototypeOf(proto) === null ||
    Array.isArray(value)
  ) {
    return value;
  }
  return withV20Errors(value, mapArg);
}
