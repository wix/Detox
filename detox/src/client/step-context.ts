/**
 * The step context (spec 013): which step the code running right now is
 * inside, carried by `AsyncLocalStorage` so it survives every `await` and
 * never leaks across `test.concurrent` bodies. Two readers: every request
 * frame the client peer builds gets `step: <current>`, and every `$/log`
 * begin gets `parent: <current>` unless told otherwise. One writer:
 * {@link StepContext.run}, the door `DetoxLogHandle.run` and `detox.step`
 * open, and the jest environment wraps each test/hook body in.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

export class StepContext {
  readonly #als = new AsyncLocalStorage<string>();

  /** The client-minted id of the innermost step the caller is inside, if any. */
  current(): string | undefined {
    return this.#als.getStore();
  }

  /** Runs `fn` inside `stepId`'s context; whatever `fn` starts inherits it, whatever it returns is passed through. */
  run<T>(stepId: string, fn: () => T): T {
    return this.#als.run(stepId, fn);
  }
}
