/**
 * The circus step tree (spec 013): synthetic circus events against a fake
 * `log.begin`, the wrapper's dispatch-shape guarantee, retries, hooks,
 * skips, failure propagation, and the tree's silence without a session.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import { describe, it, expect } from 'vitest';
import type { DetoxLogBeginOptions, DetoxLogEnd, DetoxLogHandle } from 'detox/client';

import {
  CircusStepTree,
  describeCircusError,
  fullNameOf,
  isRunnerOwnHook,
  wrapInStep,
  type CircusDescribeBlock,
  type CircusHook,
  type CircusTestEntry,
} from '../test-tree';

interface Ended extends DetoxLogEnd {
  id: string;
}

/** A fake session log: every begin recorded, every handle's `run` a real ALS context. */
function fakeLog() {
  const als = new AsyncLocalStorage<string>();
  const begins: Array<DetoxLogBeginOptions & { id: string }> = [];
  const ends: Ended[] = [];
  let next = 1;
  const begin = (options: DetoxLogBeginOptions): DetoxLogHandle => {
    const id = `s${String(next++)}`;
    begins.push({ ...options, id });
    let ended = false;
    return {
      id,
      end: (outcome) => {
        ended = true;
        ends.push({ id, ...outcome });
      },
      get ended() {
        return ended;
      },
      run: <T>(fn: () => T): T => als.run(id, fn),
    };
  };
  return { begin, begins, ends, current: (): string | undefined => als.getStore() };
}

const root: CircusDescribeBlock = { name: 'ROOT_DESCRIBE_BLOCK' };

function block(name: string, parent: CircusDescribeBlock = root, mode?: string): CircusDescribeBlock {
  return { name, parent, mode };
}

function test(name: string, parent: CircusDescribeBlock, extra: Partial<CircusTestEntry> = {}): CircusTestEntry {
  return { name, parent, fn: (): void => undefined, invocations: 1, errors: [], ...extra };
}

function hook(type: string, parent: CircusDescribeBlock): CircusHook {
  return { type, parent, fn: (): void => undefined };
}

function treeOf(log = fakeLog()) {
  const tree = new CircusStepTree({ filePath: 'e2e/a.test.js' });
  tree.attach(log.begin);
  return { tree, ...log };
}

describe('the file and the describe blocks', () => {
  it('opens the file step once, nests describes under it with fullNames, and the root block emits nothing', () => {
    const { tree, begins, ends } = treeOf();
    tree.fileStart();
    tree.fileStart();
    tree.describeStart(root);
    const outer = block('Sanity');
    const inner = block('inner', outer);
    tree.describeStart(outer);
    tree.describeStart(inner);
    expect(begins).toEqual([
      { id: 's1', kind: 'file', name: 'e2e/a.test.js', attrs: { filePath: 'e2e/a.test.js' } },
      { id: 's2', kind: 'describe', name: 'Sanity', attrs: { fullName: 'Sanity' }, parent: 's1' },
      { id: 's3', kind: 'describe', name: 'inner', attrs: { fullName: 'Sanity inner' }, parent: 's2' },
    ]);
    expect(tree.stepOf(outer)?.id).toBe('s2');
    expect(tree.stepOf(root)).toBeUndefined();
    tree.describeFinish(inner);
    tree.describeFinish(outer);
    tree.describeFinish(root);
    tree.fileEnd();
    tree.fileEnd();
    expect(ends).toEqual([
      { id: 's3', status: 'passed' },
      { id: 's2', status: 'passed' },
      { id: 's1', status: 'passed' },
    ]);
  });

  it('a skipped describe is a skipped step, not silence; a file with zero tests still has its step', () => {
    const { tree, ends } = treeOf();
    tree.fileStart();
    const skipped = block(':android: not here', root, 'skip');
    tree.describeStart(skipped);
    tree.describeFinish(skipped);
    tree.fileEnd();
    expect(ends).toEqual([
      { id: 's2', status: 'skipped' },
      { id: 's1', status: 'passed' },
    ]);
  });
});

describe('tests', () => {
  it('a test step carries fullName, filePath and invocation, ends by status, and its rpc parent is explicit', () => {
    const { tree, begins, ends } = treeOf();
    tree.fileStart();
    const suite = block('Sanity');
    tree.describeStart(suite);
    const passes = test('passes', suite);
    tree.testStart(passes);
    tree.testDone(passes);
    const fails = test('fails', suite, { errors: [new Error('expected 2')] });
    tree.testStart(fails);
    tree.testDone(fails);
    expect(begins.slice(2)).toEqual([
      { id: 's3', kind: 'test', name: 'passes', attrs: { fullName: 'Sanity passes', filePath: 'e2e/a.test.js', invocation: 1 }, parent: 's2' },
      { id: 's4', kind: 'test', name: 'fails', attrs: { fullName: 'Sanity fails', filePath: 'e2e/a.test.js', invocation: 1 }, parent: 's2' },
    ]);
    expect(ends).toEqual([
      { id: 's3', status: 'passed' },
      { id: 's4', status: 'failed', error: { name: 'Error', message: 'expected 2' } },
    ]);
    tree.describeFinish(suite);
    tree.fileEnd();
    expect(ends.slice(2)).toEqual([
      { id: 's2', status: 'failed' },
      { id: 's1', status: 'failed' },
    ]);
  });

  it('a skipped test begins and ends at once; a todo is skipped with attrs.todo', () => {
    const { tree, begins, ends } = treeOf();
    tree.fileStart();
    const skip = test('skip me', root, { mode: 'skip' });
    tree.testStart(skip);
    tree.testSkip(skip);
    const todo = test('later', root, { mode: 'todo' });
    tree.testStart(todo);
    tree.testTodo(todo);
    expect(begins[1]).toMatchObject({ kind: 'test', name: 'skip me', parent: 's1' });
    expect(begins[1].attrs).not.toHaveProperty('todo');
    expect(begins[2].attrs).toMatchObject({ todo: true });
    expect(ends).toEqual([
      { id: 's2', status: 'skipped' },
      { id: 's3', status: 'skipped' },
    ]);
  });

  it('wraps the body so it runs inside its step even after three awaited handlers, and keeps a done-taking arity', async () => {
    const { tree, current } = treeOf();
    tree.fileStart();
    const seen: Array<string | undefined> = [];
    const body = async function (this: unknown): Promise<void> {
      await Promise.resolve();
      seen.push(current());
    };
    const entry = test('sees its step', root, { fn: body });
    // Circus's dispatch shape: every handler awaited in turn, this tree's the third,
    // then the body is read off the entry and called.
    const handler = async (): Promise<void> => {
      await Promise.resolve();
    };
    await handler();
    await handler();
    tree.testStart(entry);
    await handler();
    expect(entry.fn).not.toBe(body);
    await (entry.fn as () => Promise<void>)();
    expect(seen).toEqual(['s2']);
    expect(current()).toBeUndefined();

    const withDone = test('takes done', root, { fn: (done: () => void): void => done() });
    tree.testStart(withDone);
    expect((withDone.fn as (...args: unknown[]) => unknown).length).toBe(1);
    let called = false;
    (withDone.fn as (done: () => void) => void)(() => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it('a generator body is left alone (circus drives it through co); the wrapper only ever wraps plain functions', () => {
    const { tree } = treeOf();
    tree.fileStart();
    const body = function* (): Generator<number> {
      yield 1;
    };
    const entry = test('yields', root, { fn: body });
    tree.testStart(entry);
    expect(entry.fn).toBe(body);
    expect(tree.stepOf(entry)).toBeDefined();
    const asyncBody = async function* (): AsyncGenerator<number> {
      yield 1;
    };
    const entry2 = test('async yields', root, { fn: asyncBody });
    tree.testStart(entry2);
    expect(entry2.fn).toBe(asyncBody);
  });

  it('a retry that passes withdraws the failure: the describe and the file end passed, as jest reports', () => {
    const { tree, ends } = treeOf();
    tree.fileStart();
    const suite = block('Sanity');
    tree.describeStart(suite);
    const flaky = test('flaky', suite, { errors: [new Error('first try')] });
    tree.testStart(flaky);
    tree.testDone(flaky);
    flaky.errors = [];
    flaky.invocations = 2;
    tree.testStart(flaky);
    tree.testDone(flaky);
    tree.describeFinish(suite);
    tree.fileEnd();
    expect(ends.map((e) => [e.id, e.status])).toEqual([
      ['s3', 'failed'],
      ['s4', 'passed'],
      ['s2', 'passed'],
      ['s1', 'passed'],
    ]);
  });

  it('retries re-wrap the original body, never the previous wrapper, and count invocations', () => {
    const { tree, begins } = treeOf();
    tree.fileStart();
    const original = (): void => undefined;
    const entry = test('flaky', root, { fn: original, invocations: 1 });
    tree.testStart(entry);
    const firstWrapper = entry.fn;
    tree.testDone(entry);
    expect(entry.fn).toBe(original);
    entry.invocations = 2;
    tree.testStart(entry);
    expect(entry.fn).not.toBe(firstWrapper);
    expect(entry.fn).not.toBe(original);
    expect(begins.at(-1)?.attrs).toMatchObject({ invocation: 2 });
    expect(tree.stepOf(entry)?.id).toBe('s3');
  });

  it('two concurrent bodies each run inside their own step', async () => {
    const { tree, current } = treeOf();
    tree.fileStart();
    const seen: Record<string, string | undefined> = {};
    const first = test('first', root, {
      fn: async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        seen.first = current();
      },
    });
    const second = test('second', root, {
      fn: async (): Promise<void> => {
        seen.second = current();
      },
    });
    tree.testStart(first);
    const a = (first.fn as () => Promise<void>)();
    tree.testStart(second);
    const b = (second.fn as () => Promise<void>)();
    await Promise.all([a, b]);
    expect(seen).toEqual({ first: 's2', second: 's3' });
  });
});

describe('hooks', () => {
  it('all-hooks nest under their describe (the file for the root); each-hooks under the running test', () => {
    const { tree, begins, ends } = treeOf();
    tree.fileStart();
    const suite = block('Sanity');
    tree.describeStart(suite);
    const beforeAllRoot = hook('beforeAll', root);
    tree.hookStart(beforeAllRoot);
    tree.hookSuccess(beforeAllRoot);
    const beforeAllSuite = hook('beforeAll', suite);
    tree.hookStart(beforeAllSuite);
    tree.hookSuccess(beforeAllSuite);
    const entry = test('t', suite);
    tree.testStart(entry);
    const beforeEach = hook('beforeEach', suite);
    tree.hookStart(beforeEach);
    expect(typeof beforeEach.fn).toBe('function');
    tree.hookSuccess(beforeEach);
    tree.testDone(entry);
    expect(begins.slice(2).map((b) => ({ name: b.name, parent: b.parent, hookType: b.attrs?.hookType }))).toEqual([
      { name: 'beforeAll', parent: 's1', hookType: 'beforeAll' },
      { name: 'beforeAll', parent: 's2', hookType: 'beforeAll' },
      { name: 't', parent: 's2', hookType: undefined },
      { name: 'beforeEach', parent: 's5', hookType: 'beforeEach' },
    ]);
    expect(ends.map((e) => e.status)).toEqual(['passed', 'passed', 'passed', 'passed']);
  });

  it('a failed hook ends failed with its error and fails its describe and the file', () => {
    const { tree, ends } = treeOf();
    tree.fileStart();
    const suite = block('Sanity');
    tree.describeStart(suite);
    const beforeAll = hook('beforeAll', suite);
    tree.hookStart(beforeAll);
    tree.hookFailure(beforeAll, new TypeError('no device'));
    tree.describeFinish(suite);
    tree.fileEnd();
    expect(ends).toEqual([
      { id: 's3', status: 'failed', error: { name: 'TypeError', message: 'no device' } },
      { id: 's2', status: 'failed' },
      { id: 's1', status: 'failed' },
    ]);
    expect(beforeAll.fn).toBeTypeOf('function');
  });

  it('jest\'s own mock-reset beforeEach — registered from jest-circus\'s build — is no step; a tester\'s hook is', () => {
    const own = new Error('registered by jest');
    own.stack = 'Error: registered by jest\n    at Object.<anonymous> (/repo/node_modules/jest-circus/build/runner.js:61:11)\n    at /repo/e2e/x.test.js:1:1';
    const theirs = new Error('registered by the tester');
    theirs.stack = 'Error: registered by the tester\n    at Object.<anonymous> (/repo/e2e/x.test.js:3:1)\n    at /repo/node_modules/jest-circus/build/index.js:9:9';
    const jestHook: CircusHook = { type: 'beforeEach', parent: root, fn: (): void => undefined, asyncError: own };
    const userHook: CircusHook = { type: 'beforeEach', parent: root, fn: (): void => undefined, asyncError: theirs };
    expect(isRunnerOwnHook(jestHook)).toBe(true);
    expect(isRunnerOwnHook(userHook)).toBe(false);
    expect(isRunnerOwnHook({ type: 'beforeEach', parent: root })).toBe(false);
    // Another realm's Error is not `instanceof Error` here — only its stack counts.
    expect(isRunnerOwnHook({ type: 'beforeEach', parent: root, asyncError: { stack: own.stack } })).toBe(true);
    expect(isRunnerOwnHook({ type: 'beforeEach', parent: root, asyncError: Object.assign(new Error('bare'), { stack: undefined }) })).toBe(false);
    expect(isRunnerOwnHook({ type: 'beforeEach', parent: root, asyncError: Object.assign(new Error('no frames'), { stack: 'Error: no frames' }) })).toBe(false);
    const { tree, begins } = treeOf();
    tree.fileStart();
    const original = jestHook.fn;
    tree.hookStart(jestHook);
    tree.hookSuccess(jestHook);
    expect(begins).toHaveLength(1);
    expect(jestHook.fn).toBe(original);
    expect(tree.stepOf(jestHook)).toBeUndefined();
    tree.hookStart(userHook);
    expect(begins).toHaveLength(2);
  });

  it('an each-hook with no test open falls back to its describe', () => {
    const { tree, begins } = treeOf();
    tree.fileStart();
    const afterEach = hook('afterEach', root);
    tree.hookStart(afterEach);
    expect(begins[1]).toMatchObject({ kind: 'hook', name: 'afterEach', parent: 's1' });
  });
});

describe('without a session, and with a refusing one', () => {
  it('records nothing and never throws when no sink is attached', () => {
    const tree = new CircusStepTree({ filePath: 'x.test.js' });
    const suite = block('S');
    const entry = test('t', suite);
    const original = entry.fn;
    tree.fileStart();
    tree.describeStart(suite);
    tree.testStart(entry);
    tree.testDone(entry);
    tree.hookStart(hook('beforeAll', suite));
    tree.describeFinish(suite);
    tree.fileEnd();
    expect(tree.fileStep).toBeUndefined();
    expect(tree.stepOf(entry)).toBeUndefined();
    expect(entry.fn).toBe(original);
  });

  it('a sink that refuses typed (an endpoint with no log) leaves the tree silent', () => {
    const tree = new CircusStepTree({ filePath: 'x.test.js' });
    tree.attach(() => {
      throw new Error('this endpoint does not record a log');
    });
    tree.fileStart();
    expect(tree.fileStep).toBeUndefined();
    tree.fileEnd(true);
  });

  it('ends an unfinished file failed when told the init failed', () => {
    const { tree, ends } = treeOf();
    tree.fileStart();
    tree.fileEnd(true);
    expect(ends).toEqual([{ id: 's1', status: 'failed' }]);
  });
});

describe('the helpers', () => {
  it('fullNameOf joins the describe chain from the root with one space', () => {
    const a = block('a');
    const b = block('b', a);
    expect(fullNameOf(undefined, 'x')).toBe('x');
    expect(fullNameOf(root, 'x')).toBe('x');
    expect(fullNameOf(b, 'x')).toBe('a b x');
  });

  it('describeCircusError reads an Error, a [exception, asyncError] pair, a plain object, a string, and nothing', () => {
    expect(describeCircusError(new RangeError('r'))).toEqual({ name: 'RangeError', message: 'r' });
    expect(describeCircusError([undefined, new Error('async')])).toEqual({ name: 'Error', message: 'async' });
    expect(describeCircusError({ name: 'Custom', message: 'm' })).toEqual({ name: 'Custom', message: 'm' });
    expect(describeCircusError({ message: 42 })).toEqual({ name: 'Error', message: '' });
    expect(describeCircusError('thrown string')).toEqual({ name: 'Error', message: 'thrown string' });
    expect(describeCircusError(undefined)).toEqual({ name: 'Error', message: '' });
  });

  it('wrapInStep leaves a non-function alone and passes this and arguments through', () => {
    const { begin } = fakeLog();
    const handle = begin({ kind: 'step', name: 'x' });
    expect(wrapInStep(undefined, handle)).toBeUndefined();
    interface Counter {
      n: number;
    }
    const wrapped = wrapInStep(function (this: Counter, a: number, b: number) {
      return this.n + a + b;
    }, handle) as (this: Counter, a: number, b: number) => number;
    expect(wrapped.call({ n: 1 }, 2, 3)).toBe(6);
    expect(wrapped.length).toBe(2);
  });
});
