/**
 * The circus step tree (spec 013): one file's
 * `file › describe › test / hook` steps, declared into the run's log through `$/log` as jest-circus
 * announces them, every parent named explicitly — so `test.concurrent`
 * bodies never share a step — and every test/hook body wrapped so that the
 * Detox calls it makes are recorded under its own step.
 *
 * A collaborator, not environment state (spec 013's compatibility bullet):
 * one method per circus event, keyed by the circus objects themselves in
 * `WeakMap`s (the same key `jest-metadata` uses), the step of any circus
 * object readable through {@link CircusStepTree.stepOf}. It never awaits
 * the server: a step is a notification.
 *
 * Why the body is wrapped rather than the context entered from the event
 * handler: circus awaits every handler in turn, and this environment's is
 * the third, so its handler always runs in a continuation created after
 * `_callCircusTest` already awaited the dispatch — a store entered there
 * never reaches the body (`jest-circus/src/state.ts:65-67`,
 * `jestAdapterInit.ts:84-87`, `run.ts:275`; verified on Node 24). The
 * wrapper runs the original inside the step's own context, keeps its
 * `length` (`utils.ts:30` reads `fn.length > 0` as "takes `done`") and its
 * `this`, and is swapped onto the circus object, which circus reads `.fn`
 * off at call time (`utils.ts:203`). Jest 30 only: 29's
 * `startTestsConcurrently` started concurrent bodies before any
 * `test_start`, so nothing swapped at `test_start` could reach them.
 */
import type { DetoxLogBeginOptions, DetoxLogEnd, DetoxLogHandle, DetoxLogStatus } from 'detox/client';

/** `{ name, message }` — what a step's end carries of an error (never the stack). */
type StepError = NonNullable<DetoxLogEnd['error']>;

/** The slice of a circus describe block this tree reads. */
export interface CircusDescribeBlock {
  name: string;
  /** The root block has none. */
  parent?: CircusDescribeBlock;
  mode?: unknown;
}

/** The slice of a circus test entry this tree reads and writes (`fn`). */
export interface CircusTestEntry {
  name: string;
  parent: CircusDescribeBlock;
  fn?: unknown;
  mode?: unknown;
  /** Incremented by circus's own handler at `test_start`, before this tree sees the event. */
  invocations?: number;
  errors?: unknown[];
}

/** The slice of a circus hook this tree reads and writes (`fn`). */
export interface CircusHook {
  type: string;
  parent: CircusDescribeBlock;
  fn?: unknown;
  /** Circus's registration-site error (`ErrorWithStack`), whose first frame says who wrote the hook. */
  asyncError?: unknown;
}

/** The registration site of a hook jest-circus registers for itself (its mock-reset `beforeEach`, `runner.ts`). */
const CIRCUS_OWN_FRAME = /[\\/]jest-circus[\\/]build[\\/]/;

/** Whatever carries a `stack` — an `Error` of any realm. */
interface StackCarrier {
  stack?: unknown;
}

/**
 * Whether jest registered the hook for itself rather than the tester
 * writing it: jest-circus adds one `beforeEach` per file for
 * `resetModules`/`clearMocks`/`resetMocks`/`restoreMocks`
 * (`jest-circus/src/legacy-code-todo-rewrite/jestAdapter.ts`), and it
 * runs before every test. The tree is what the tester wrote, so that hook
 * is no step. The tell is the registration site circus itself records:
 * `asyncError` is an `ErrorWithStack` captured past the `beforeEach`
 * frame, so its first frame is the caller — jest-circus's own build for
 * jest's hook, the tester's file for theirs.
 */
export function isRunnerOwnHook(hook: CircusHook): boolean {
  // Duck-typed, never `instanceof Error`: circus's adapter runs inside the
  // test file's vm realm, so its errors are that realm's `Error` (spec 010's
  // brand lesson, `v20-errors.ts`).
  const error = hook.asyncError;
  const stack = typeof error === 'object' && error !== null ? (error as StackCarrier).stack : undefined;
  if (typeof stack !== 'string') return false;
  const firstFrame = stack.split('\n').find((line) => /^\s+at /.test(line));
  return firstFrame !== undefined && CIRCUS_OWN_FRAME.test(firstFrame);
}

/** The door a step is begun through — `Detox['log']['begin']`, bound. */
export type StepSink = (options: DetoxLogBeginOptions) => DetoxLogHandle;

interface DescribeRecord {
  handle: DetoxLogHandle;
}

interface UnitRecord {
  handle: DetoxLogHandle;
  /** The body as the tester wrote it — restored under the next invocation's wrapper (retries). */
  originalFn: unknown;
}

export interface CircusStepTreeInit {
  /** The test file's path relative to jest's `rootDir` — the file step's name and `attrs.filePath`. */
  filePath: string;
}

const EACH_HOOKS: ReadonlySet<string> = new Set(['beforeEach', 'afterEach']);

/** `{ name, message }` of the first error circus recorded — never the stack (spec 012's rule). */
export function describeCircusError(error: unknown): StepError {
  // A circus `TestError` is an exception or a pair `[exception, asyncError]`.
  // Duck-typed on purpose: a test file's errors are its vm realm's `Error`,
  // never `instanceof` this one; `name` reads off the prototype either way.
  const first = Array.isArray(error) ? (error as unknown[]).find((e) => e !== undefined && e !== null) : error;
  if (typeof first === 'object' && first !== null) {
    const { name, message } = first as Partial<Record<'name' | 'message', unknown>>;
    return { name: typeof name === 'string' ? name : 'Error', message: typeof message === 'string' ? message : '' };
  }
  return { name: 'Error', message: typeof first === 'string' ? first : '' };
}

/** jest's own full name: the describe names from the root down, then the test's, joined by one space. */
export function fullNameOf(parent: CircusDescribeBlock | undefined, own: string): string {
  const names: string[] = [];
  for (let block = parent; block !== undefined && block.parent !== undefined; block = block.parent) names.unshift(block.name);
  names.push(own);
  return names.join(' ');
}

/** A `function*` body: circus drives it through `co`, branching on the generator brand a wrapper would erase. */
function isGeneratorFunction(fn: unknown): boolean {
  const tag = Object.prototype.toString.call(fn);
  return tag === '[object GeneratorFunction]' || tag === '[object AsyncGeneratorFunction]';
}

/**
 * The wrapper: the original runs inside the step, `this` and arguments
 * passed through, `length` preserved so circus still sees a `done`-taking
 * body as one. A generator body is left alone (its calls fall back to the
 * server's open-step rule): circus tells one apart by its brand
 * (`utils.ts` `isGeneratorFunction`) and runs it through `co`, and a plain
 * wrapper would turn it into a synchronous body that returns an iterator —
 * green, never run.
 */
export function wrapInStep(fn: unknown, handle: DetoxLogHandle): unknown {
  if (typeof fn !== 'function' || isGeneratorFunction(fn)) return fn;
  const original = fn as (this: unknown, ...args: unknown[]) => unknown;
  const wrapped = function (this: unknown, ...args: unknown[]): unknown {
    return handle.run(() => original.apply(this, args));
  };
  Object.defineProperty(wrapped, 'length', { value: original.length });
  return wrapped;
}

export class CircusStepTree {
  readonly #filePath: string;
  #sink: StepSink | undefined;
  #file: DetoxLogHandle | undefined;
  /** Every test or hook whose latest outcome is a failure, with the block it belongs to: a passing retry withdraws it. */
  readonly #failedUnits = new Map<object, CircusDescribeBlock>();
  readonly #describes = new WeakMap<object, DescribeRecord>();
  readonly #tests = new WeakMap<object, UnitRecord>();
  readonly #hooks = new WeakMap<object, UnitRecord>();
  /** Tests begun and not yet done, in begin order: an each-hook belongs to the last (each-hooks never run for concurrent tests). */
  readonly #openTests: CircusTestEntry[] = [];

  constructor({ filePath }: CircusStepTreeInit) {
    this.#filePath = filePath;
  }

  /** The session's `log.begin`, once there is a session; without one the tree records nothing. */
  attach(sink: StepSink): void {
    this.#sink = sink;
  }

  /** The step of a circus describe block, test or hook, for a listener that wants to publish it beside its own ids. */
  stepOf(circusObject: object): DetoxLogHandle | undefined {
    return this.#describes.get(circusObject)?.handle ?? this.#tests.get(circusObject)?.handle ?? this.#hooks.get(circusObject)?.handle;
  }

  get fileStep(): DetoxLogHandle | undefined {
    return this.#file;
  }

  // ── the file ─────────────────────────────────────────────────────────────

  fileStart(): void {
    if (this.#file !== undefined) return;
    this.#file = this.#begin({ kind: 'file', name: this.#filePath, attrs: { filePath: this.#filePath } });
  }

  /** `failed` when told so, or when any test or hook in the file failed. */
  fileEnd(failed = false): void {
    const file = this.#file;
    if (file === undefined || file.ended) return;
    file.end({ status: failed || this.#failedUnits.size > 0 ? 'failed' : 'passed' });
  }

  // ── describe blocks ──────────────────────────────────────────────────────

  describeStart(block: CircusDescribeBlock): void {
    // The root block (jest's unnamed ROOT_DESCRIBE_BLOCK) emits nothing: the file step stands in.
    if (block.parent === undefined) return;
    const parent = this.#stepOfBlock(block.parent);
    const handle = this.#begin({
      kind: 'describe',
      name: block.name,
      attrs: { fullName: fullNameOf(block.parent, block.name) },
      ...(parent !== undefined ? { parent: parent.id } : {}),
    });
    if (handle !== undefined) this.#describes.set(block, { handle });
  }

  describeFinish(block: CircusDescribeBlock): void {
    const record = this.#describes.get(block);
    if (record === undefined || record.handle.ended) return;
    record.handle.end({ status: this.#hasFailureUnder(block) ? 'failed' : block.mode === 'skip' ? 'skipped' : 'passed' });
  }

  // ── tests ────────────────────────────────────────────────────────────────

  testStart(test: CircusTestEntry): void {
    const previous = this.#tests.get(test);
    const originalFn = previous?.originalFn ?? test.fn;
    const parent = this.#stepOfBlock(test.parent);
    const handle = this.#begin({
      kind: 'test',
      name: test.name,
      attrs: {
        fullName: fullNameOf(test.parent, test.name),
        filePath: this.#filePath,
        invocation: typeof test.invocations === 'number' && test.invocations > 0 ? test.invocations : 1,
        ...(test.mode === 'todo' ? { todo: true } : {}),
      },
      ...(parent !== undefined ? { parent: parent.id } : {}),
    });
    if (handle === undefined) return;
    this.#tests.set(test, { handle, originalFn });
    test.fn = wrapInStep(originalFn, handle);
    this.#openTests.push(test);
  }

  testSkip(test: CircusTestEntry): void {
    this.#endTest(test, 'skipped');
  }

  testTodo(test: CircusTestEntry): void {
    this.#endTest(test, 'skipped');
  }

  testDone(test: CircusTestEntry): void {
    const errors = test.errors ?? [];
    if (errors.length > 0) {
      this.#failedUnits.set(test, test.parent);
      this.#endTest(test, 'failed', describeCircusError(errors[0]));
    } else {
      // A retry that passes (`jest.retryTimes`) clears the file's and the describe's verdict — jest's own.
      this.#failedUnits.delete(test);
      this.#endTest(test, 'passed');
    }
  }

  // ── hooks ────────────────────────────────────────────────────────────────

  hookStart(hook: CircusHook): void {
    // jest's own per-test hook is not the tester's tree; it runs unrecorded.
    if (isRunnerOwnHook(hook)) return;
    const previous = this.#hooks.get(hook);
    const originalFn = previous?.originalFn ?? hook.fn;
    // An each-hook belongs to the test it runs for (the event names none;
    // circus never runs each-hooks for concurrent tests, so the last begun
    // still-open test is that test); an all-hook to its describe block.
    const lastOpen = this.#openTests.at(-1);
    const owner = EACH_HOOKS.has(hook.type) && lastOpen !== undefined ? this.#tests.get(lastOpen)?.handle : undefined;
    const parent = owner ?? this.#stepOfBlock(hook.parent);
    const handle = this.#begin({
      kind: 'hook',
      name: hook.type,
      attrs: { hookType: hook.type },
      ...(parent !== undefined ? { parent: parent.id } : {}),
    });
    if (handle === undefined) return;
    this.#hooks.set(hook, { handle, originalFn });
    hook.fn = wrapInStep(originalFn, handle);
  }

  hookSuccess(hook: CircusHook): void {
    this.#endHook(hook, 'passed');
  }

  hookFailure(hook: CircusHook, error: unknown): void {
    this.#failedUnits.set(hook, hook.parent);
    this.#endHook(hook, 'failed', describeCircusError(error));
  }

  // ── internals ────────────────────────────────────────────────────────────

  #begin(options: DetoxLogBeginOptions): DetoxLogHandle | undefined {
    const sink = this.#sink;
    if (sink === undefined) return undefined;
    try {
      return sink(options);
    } catch {
      // A session that announced no log refuses typed (spec 012); the tree
      // then records nothing rather than failing the file.
      return undefined;
    }
  }

  /** The step a block's children nest under: the block's own, else (the root, or a block the tree never saw) the file's. */
  #stepOfBlock(block: CircusDescribeBlock): DetoxLogHandle | undefined {
    for (let current: CircusDescribeBlock | undefined = block; current !== undefined; current = current.parent) {
      const record = this.#describes.get(current);
      if (record !== undefined) return record.handle;
    }
    return this.#file;
  }

  /** Whether a unit under `block` (at any depth) failed and was not retried green. */
  #hasFailureUnder(block: CircusDescribeBlock): boolean {
    for (const owner of this.#failedUnits.values()) {
      for (let current: CircusDescribeBlock | undefined = owner; current !== undefined; current = current.parent) {
        if (current === block) return true;
      }
    }
    return false;
  }

  #endTest(test: CircusTestEntry, status: DetoxLogStatus, error?: StepError): void {
    const record = this.#tests.get(test);
    const at = this.#openTests.indexOf(test);
    if (at !== -1) this.#openTests.splice(at, 1);
    if (record === undefined || record.handle.ended) return;
    // The body is the tester's again: the next invocation (a retry) wraps it afresh.
    test.fn = record.originalFn;
    record.handle.end({ status, ...(error !== undefined ? { error } : {}) });
  }

  #endHook(hook: CircusHook, status: DetoxLogStatus, error?: StepError): void {
    const record = this.#hooks.get(hook);
    if (record === undefined || record.handle.ended) return;
    hook.fn = record.originalFn;
    record.handle.end({ status, ...(error !== undefined ? { error } : {}) });
  }
}
