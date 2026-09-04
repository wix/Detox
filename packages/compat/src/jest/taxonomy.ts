/**
 * Failures carry the error taxonomy (spec 010): a typed DetoxError must
 * reach jest's report with its code name visible —
 * `DETOX_SERVER_UNREACHABLE`, not just a prose sentence. Jest derives what
 * it prints from an error's `stack` (separateMessageFromStack), so the stamp
 * touches message and stack, in place: the environment neither wraps nor
 * swallows — same object, same type, same code, one prefix.
 */
import { DetoxErrorCode } from 'detox/client';

/** The code's name (`DETOX_POOL_EXHAUSTED`), or undefined for a foreign code. */
export function detoxCodeName(code: unknown): string | undefined {
  if (typeof code !== 'number') return undefined;
  return Object.entries(DetoxErrorCode).find(([, value]) => value === code)?.[0];
}

/**
 * Prefixes the code name onto the error's message (and its stack's copy of
 * it), once — idempotent, and a no-op for anything that is not a typed
 * DetoxError. Mutation is the point: jest will serialize this object.
 */
export function stampDetoxCodeName(error: unknown): void {
  const carrier = error as { code?: unknown; message?: unknown; stack?: unknown } | null;
  if (carrier === null || typeof carrier !== 'object') return;
  const name = detoxCodeName(carrier.code);
  if (name === undefined) return;
  const original = carrier.message;
  if (typeof original !== 'string' || original.includes(name)) return;
  const stamped = `${name}: ${original}`;
  try {
    // @issue DTX-4069: materialize the stack before touching the message — V8 renders `.stack`
    // lazily on first read, using the current message.
    const stack = carrier.stack;
    carrier.message = stamped;
    if (typeof stack === 'string' && original.length > 0 && !stack.includes(stamped)) {
      carrier.stack = stack.replace(original, stamped);
    }
  } catch {
    // A frozen error object keeps its message; the code still rides `.code`.
  }
}
