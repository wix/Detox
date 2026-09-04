/**
 * `DetoxCircusEnvironment` for Jest 30 (spec 010) — the lightweight port of
 * v20's `runners/jest/testEnvironment/index.js`, reduced on purpose: no IPC,
 * no facade, no listener framework, and no timer of any kind (jest's own
 * `testTimeout` is the only test clock; the environment only reacts to
 * circus saying a unit failed).
 *
 * What it does, whole list:
 *  - first file in a worker: read the `detox test` snapshot, map it (spec
 *    009's seam), `connect` the compat surface — the session, device and
 *    installed apps then live in the compat state box (the surface's one
 *    singleton), which the worker process keeps across files;
 *  - subsequent files: adopt the live session (no re-init — compat's own
 *    already-initialized refusal makes the wrong implementation loudly red).
 *    A file whose init failed leaves the box empty, so the next file's setup
 *    retries and fails (or succeeds) on its own terms — each file's verdict
 *    is its own;
 *  - expose the detox globals per `behavior.init.exposeGlobals`, and extend
 *    jest's own `expect` with the Detox element matchers (never shadow it);
 *  - the `:platform:` name filter (v20's, shipped);
 *  - AbortSignal hygiene for hung calls: a unit scope per test/hook aborts
 *    on failure so the next unit finds the session clean; a
 *    passing unit aborts nothing; environment teardown aborts the file scope
 *    unconditionally;
 *  - the test tree in the run's log (spec 013, widening spec 010): the file,
 *    every describe, test and hook as steps with explicit parents, each body
 *    run inside its own step — see `test-tree.ts`; and the run named to
 *    `detox test` through a row beside the snapshot — `run-rows.ts`.
 *
 * Environment-rank failures (snapshot missing, server unreachable, allocation
 * refused) throw out of `setup()` — jest surfaces them as the file's failure,
 * typed message intact, and the run exits non-zero through jest. There is
 * no `process.exit` anywhere in this source (grep-gated by
 * `__tests__/entries.test.ts`).
 *
 * `handleTestEvent` is a prototype method, not an instance field: a
 * subclass wrapping this environment (`jest-environment-emit`'s
 * `WithEmitter` calls `super.handleTestEvent`) must be able to override it,
 * and an own property would silently shadow the override.
 */
import path from 'node:path';

import type { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';
import type { Circus } from '@jest/types';
import type { Detox } from 'detox/client';
import type JestNodeEnvironment from 'jest-environment-node';

import * as compat from '../index';
import { COMPAT_STATE_KEY, compatStateBox } from '../state';
import { emitFateWarnings } from './fates';
import { detoxMatchers } from './matchers';
import { applyPlatformFilter } from './platform-filter';
import { requireFromProject } from './project-modules';
import { appendRunRow, viewerUrlFor } from './run-rows';
import { loadSnapshot, type LoadedSnapshot } from './snapshot';
import { stampDetoxCodeName } from './taxonomy';
import { CircusStepTree, type CircusDescribeBlock, type CircusHook, type CircusTestEntry } from './test-tree';

type NodeEnvironmentCtor = typeof JestNodeEnvironment;

interface NodeEnvironmentModule {
  default?: NodeEnvironmentCtor;
  TestEnvironment?: NodeEnvironmentCtor;
}

const nodeEnvironmentModule = requireFromProject<NodeEnvironmentModule | NodeEnvironmentCtor>(
  'jest-environment-node',
  'it ships with jest, which must be a dependency of your project (the detox tarball bundles no jest)',
);

const NodeEnvironment: NodeEnvironmentCtor =
  (nodeEnvironmentModule as NodeEnvironmentModule).default ??
  (nodeEnvironmentModule as NodeEnvironmentModule).TestEnvironment ??
  (nodeEnvironmentModule as NodeEnvironmentCtor);

/** What a unit-scope abort tells the strays it settles. */
const unitAbortReason = (what: string): Error =>
  new Error(`detox: ${what} — its in-flight Detox calls were cancelled so the next test starts clean`);

/**
 * jest-environment-node's globals cleanup soft-deletes the own properties of
 * every object assigned onto the test global after setup. Today a jest-side
 * recursion quirk protects everything by accident; this stamp is the
 * deliberate spelling of the same protection (an empty list means "protect
 * every key") for the objects that are shared singletons — gutting the state
 * box or the `device` delegate between files would re-init the session per
 * file, the per-file boot cost the shared session exists to avoid.
 */
const JEST_PROTECT = Symbol.for('$$jest-protect-from-deletion');

function protectFromJestCleanup(value: unknown): void {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') return;
  try {
    const carrier = value as Record<symbol, unknown>;
    carrier[JEST_PROTECT] ??= [];
  } catch {
    // A sealed/frozen object cannot take the stamp — and cannot be gutted.
  }
}

/** The slice of circus events this environment reads beyond `name`. */
interface UnitCircusEvent {
  test?: CircusTestEntry;
  hook?: CircusHook;
  describeBlock?: CircusDescribeBlock;
  error?: unknown;
  /** The `setup` event's registry-independent globals (`injectGlobals: false` has no global `expect`). */
  runtimeGlobals?: { expect?: { extend?: (matchers: Record<string, unknown>) => void } };
}

export class DetoxCircusEnvironment extends NodeEnvironment {
  #loaded: LoadedSnapshot | undefined;
  /** The file's steps (spec 013) — a collaborator keyed by circus objects, dispatched to per event. */
  readonly #tree: CircusStepTree;
  #initFailed = false;
  #fileScope: AbortController | undefined;
  /** Last-started unit — the scope ambient calls compose (sequential runs: the only unit). */
  #currentUnit: AbortController | undefined;
  /**
   * @issue DTX-4059
   * Scope per circus test/hook object, so a failure aborts its own unit even under
   * `test.concurrent`, where starts and failures interleave. The ambient can still only point
   * at one scope at a time — concurrent tests' hygiene is attribution-correct for aborts and
   * approximate for composition, and one shared device makes concurrency pathological here
   * anyway.
   */
  #unitScopes = new WeakMap<object, AbortController>();
  /** Captured once — collection-time events must never reach for session state. */
  readonly #platform = compat.device.getPlatform();

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    // @issue DTX-4050: mirrors the state box into the test context at construction — jest
    // evaluates `setupFiles` before `environment.setup()`.
    const box = compatStateBox();
    protectFromJestCleanup(box);
    (this.global as unknown as Record<symbol, unknown>)[COMPAT_STATE_KEY] = box;
    // The file step's name is the path a tester recognises: relative to jest's rootDir.
    const rootDir = config.projectConfig.rootDir;
    const testPath = context.testPath;
    this.#tree = new CircusStepTree({
      filePath: typeof rootDir === 'string' && rootDir !== '' ? path.relative(rootDir, testPath) : testPath,
    });
  }

  override async setup(): Promise<void> {
    try {
      await this.#setup();
    } catch (error) {
      // Environment-rank failures (snapshot missing, server unreachable,
      // allocation refused) surface as the file's failure — same object,
      // code name stamped into what jest will print.
      this.#initFailed = true;
      stampDetoxCodeName(error);
      throw error;
    }
  }

  async #setup(): Promise<void> {
    await super.setup();
    const box = compatStateBox();

    this.#loaded = loadSnapshot(process.env);
    emitFateWarnings(this.#loaded.snapshot);

    this.#fileScope = new AbortController();
    box.ambient = this.#fileScope.signal;
    // An idle session must never hold a jest worker (or an in-band main
    // process) open — set before init so the socket unrefs at connect.
    box.unrefSocket = true;

    if (box.state === undefined) {
      if (box.pendingInit !== undefined) {
        // @issue DTX-4051: a prior environment's init is still in flight — share its outcome
        // rather than silently adopting an uninitialized surface.
        await box.pendingInit;
        // The environment that started the init named the run; this one only opens its file.
        this.#openFile(compatStateBox().state?.session);
      } else {
        // No signal argument on purpose — a signal handed to `connect` becomes the session's
        // signal, and the session must outlive this file.
        //
        // The session-opened door (spec 013): the run is named and the file
        // step opened the moment the session is announced, before init's own
        // allocation — so that allocation is the first file's first child.
        box.onSession = (session) => {
          this.#nameRun(session);
          this.#openFile(session);
        };
        try {
          await compat.init(this.#loaded.compatConfig);
        } finally {
          box.onSession = undefined;
        }
      }
    } else {
      // The session is already there — adopt it. The device and any running app carry over
      // the file boundary exactly as they did across v20 worker files.
      this.#openFile(box.state.session);
    }

    if (this.#loaded.behavior.exposeGlobals) {
      const g = this.global as unknown as Record<string, unknown>;
      g.device = compat.device;
      g.element = compat.element;
      g.by = compat.by;
      g.waitFor = compat.waitFor;
      g.detox = compat;
      for (const value of [compat.device, compat.element, compat.by, compat.waitFor, compat]) {
        protectFromJestCleanup(value);
      }
      // `expect` is never shadowed — jest's own is extended on the circus `setup` event below.
    }
  }

  override async teardown(): Promise<void> {
    // The file's step ends before its strays are cut: a file whose init
    // failed ends failed, one with a failed test or hook likewise.
    this.#tree.fileEnd(this.#initFailed);
    // Whatever this file left in flight dies with the file, unconditionally, before the next
    // file's setup adopts the session.
    this.#currentUnit = undefined;
    this.#fileScope?.abort(unitAbortReason('the test file ended'));
    const box = compatStateBox();
    box.ambient = undefined;
    await super.teardown();
  }

  /** The tree's `log.begin` is the session's; the file step opens at once (idempotent). */
  #openFile(session: Detox | undefined): void {
    if (session === undefined) return;
    this.#tree.attach((options) => session.log.begin(options));
    this.#tree.fileStart();
  }

  /** One row per session opened by this worker (spec 013): `detox test` prints it last. */
  #nameRun(session: Detox): void {
    const loaded = this.#loaded;
    const runId = session.runId;
    if (loaded === undefined || runId === undefined) return;
    const serverUrl = loaded.compatConfig.server.url;
    appendRunRow(loaded.snapshotPath, {
      runId,
      serverUrl,
      viewerUrl: viewerUrlFor(serverUrl, runId),
      gated: loaded.compatConfig.server.headers !== undefined,
    });
  }

  /** The step of a circus describe block, test or hook (spec 013's readable bookkeeping), for a wrapping listener. */
  stepOf(circusObject: object): ReturnType<CircusStepTree['stepOf']> {
    return this.#tree.stepOf(circusObject);
  }

  handleTestEvent(event: Circus.Event, state: Circus.State): void {
    const unit = event as UnitCircusEvent;
    switch (event.name) {
      case 'setup': {
        // jest has just built this file's `expect` — extend it with the
        // Detox element matchers (one expect, both vocabularies). The
        // event's `runtimeGlobals` is the registry-independent handle: with
        // `injectGlobals: false` no `expect` global exists, yet
        // `import { expect } from '@jest/globals'` serves the same instance.
        const expectHandle =
          unit.runtimeGlobals?.expect ??
          ((this.global as unknown as Record<string, unknown>).expect as
            | { extend?: (matchers: Record<string, unknown>) => void }
            | undefined);
        expectHandle?.extend?.(detoxMatchers);
        break;
      }
      case 'start_describe_definition':
      case 'add_test':
        // Consumed alongside `add_test` as one filter: v20's own listener
        // filtered describes too, so a tagged describe must skip its
        // children and its hooks.
        applyPlatformFilter(event, state, this.#platform);
        break;
      // ── the tree (spec 013, spec 010's six more events) ────────
      case 'run_describe_start':
        if (unit.describeBlock !== undefined) this.#tree.describeStart(unit.describeBlock);
        break;
      case 'run_describe_finish':
        if (unit.describeBlock !== undefined) this.#tree.describeFinish(unit.describeBlock);
        break;
      case 'test_start':
        if (unit.test !== undefined) this.#tree.testStart(unit.test);
        break;
      case 'test_skip':
        if (unit.test !== undefined) this.#tree.testSkip(unit.test);
        break;
      case 'test_todo':
        if (unit.test !== undefined) this.#tree.testTodo(unit.test);
        break;
      case 'hook_success':
        if (unit.hook !== undefined) this.#tree.hookSuccess(unit.hook);
        break;
      // ── the hygiene (spec 010), and the events both read ─────────────────
      case 'test_fn_start':
        this.#beginUnit(unit.test);
        break;
      case 'hook_start':
        if (unit.hook !== undefined) this.#tree.hookStart(unit.hook);
        this.#beginUnit(unit.hook);
        break;
      case 'test_fn_failure':
        // A typed DetoxError thrown inside the test reaches jest's report with
        // its code name in the message.
        stampDetoxCodeName(unit.error);
        this.#failUnit(unitAbortReason('a test failed (or timed out)'), unit.test);
        break;
      case 'hook_failure':
        stampDetoxCodeName(unit.error);
        if (unit.hook !== undefined) this.#tree.hookFailure(unit.hook, unit.error);
        this.#failUnit(unitAbortReason('a hook failed (or timed out)'), unit.hook);
        break;
      case 'test_done':
        if (unit.test !== undefined) this.#tree.testDone(unit.test);
        this.#endUnit(unit.test);
        break;
      case 'run_finish':
        this.#endUnit();
        break;
      default:
        // The consumed list is closed (spec 010 + spec 013);
        // everything else is the reporting era's business.
        break;
    }
  }

  /**
   * @issue DTX-4055
   * A fresh scope per unit. The previous unit's controller is dropped, never aborted: a
   * passing test's completed work — and even its legitimately still-pending leftovers — are
   * not touched (parity with v20; the file boundary catches true strays).
   */
  #beginUnit(key?: object): void {
    if (this.#fileScope === undefined) return;
    const controller = new AbortController();
    if (key !== undefined) this.#unitScopes.set(key, controller);
    this.#currentUnit = controller;
    compatStateBox().ambient = AbortSignal.any([this.#fileScope.signal, controller.signal]);
  }

  /** @issue DTX-4056: the unit failed — its scope aborts (keyed, so a concurrent sibling's is never hit). */
  #failUnit(reason: Error, key?: object): void {
    const scoped = key !== undefined ? this.#unitScopes.get(key) : undefined;
    (scoped ?? this.#currentUnit)?.abort(reason);
  }

  /**
   * @issue DTX-4057: the unit is over; between units the file scope alone governs.
   * @issue DTX-4058: keyed — a concurrent sibling finishing must not strip the ambient from
   * the still-running current unit.
   */
  #endUnit(key?: object): void {
    if (key !== undefined) {
      const scoped = this.#unitScopes.get(key);
      if (scoped !== undefined && scoped !== this.#currentUnit) return;
    }
    this.#currentUnit = undefined;
    compatStateBox().ambient = this.#fileScope?.signal;
  }
}

export default DetoxCircusEnvironment;
