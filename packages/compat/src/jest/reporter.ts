/**
 * `detox/runners/jest/reporter` — the project's own jest default reporting,
 * undecorated (spec 010): a migrant's config replaces jest's
 * `default` reporter with this module path, so this module is jest's default
 * reporting — the per-file reporter (verbose when the run is) plus the
 * summary, both resolved from the project's jest, both delegated to
 * untouched. Streamlined output is the reporting era's; nothing here pins
 * what a report looks like.
 */
import { requireFromProject } from './project-modules';

/** The slice of `@jest/reporters` this shim instantiates. */
interface JestReportersModule {
  DefaultReporter: new (globalConfig: unknown) => Delegate;
  VerboseReporter: new (globalConfig: unknown) => Delegate;
  SummaryReporter: new (globalConfig: unknown, options?: unknown) => Delegate;
}

/** A delegate reporter — forwarded to by whatever hooks it implements. */
interface Delegate {
  onRunStart?: (...args: unknown[]) => unknown;
  onTestStart?: (...args: unknown[]) => unknown;
  onTestCaseStart?: (...args: unknown[]) => unknown;
  onTestCaseResult?: (...args: unknown[]) => unknown;
  onTestResult?: (...args: unknown[]) => unknown;
  onRunComplete?: (...args: unknown[]) => unknown;
  getLastError?: () => Error | undefined;
}

const jestReporters = requireFromProject<JestReportersModule>(
  '@jest/reporters',
  'it ships with jest, which must be a dependency of your project (the detox tarball bundles no jest)',
);

export default class DetoxJestReporter implements Delegate {
  readonly #delegates: Delegate[];

  constructor(globalConfig: unknown, reporterConfig?: unknown) {
    const verbose = (globalConfig as { verbose?: unknown } | undefined)?.verbose === true;
    const PerFile = verbose ? jestReporters.VerboseReporter : jestReporters.DefaultReporter;
    this.#delegates = [
      new PerFile(globalConfig),
      new jestReporters.SummaryReporter(globalConfig, reporterConfig),
    ];
  }

  async #forward(hook: keyof Delegate, args: unknown[]): Promise<void> {
    for (const delegate of this.#delegates) {
      const fn = delegate[hook];
      if (typeof fn === 'function') await (fn).apply(delegate, args);
    }
  }

  onRunStart(...args: unknown[]): Promise<void> {
    return this.#forward('onRunStart', args);
  }

  onTestStart(...args: unknown[]): Promise<void> {
    return this.#forward('onTestStart', args);
  }

  onTestCaseStart(...args: unknown[]): Promise<void> {
    return this.#forward('onTestCaseStart', args);
  }

  onTestCaseResult(...args: unknown[]): Promise<void> {
    return this.#forward('onTestCaseResult', args);
  }

  onTestResult(...args: unknown[]): Promise<void> {
    return this.#forward('onTestResult', args);
  }

  onRunComplete(...args: unknown[]): Promise<void> {
    return this.#forward('onRunComplete', args);
  }

  getLastError(): Error | undefined {
    for (const delegate of this.#delegates) {
      const error = delegate.getLastError?.();
      if (error) return error;
    }
    return undefined;
  }
}
