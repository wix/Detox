import { FAILURE, SKIPPED, SUCCESS } from '../../constants';
import type {
  Reporter,
  ReporterConstructor,
  ReporterDependencies,
  Reporter$OnRuleResultParams,
  Reporter$OnRuleStartParams,
  Reporter$OnRunEndParams,
  Rule,
} from '../../types';
import type { RuleRegistryImpl } from '../rule';

export type ReportersManagerConfig = ReporterDependencies & {
  actionRegistry: RuleRegistryImpl;
};

export class ReportersManager {
  public allRules: Rule[] = [];
  public allResults = new Map<Rule, Reporter$OnRuleResultParams>();

  private readonly reporters: Reporter[] = [];

  private startedAt = Number.NaN;
  private success = true;
  private numFailed = 0;
  private numPassed = 0;
  private numSkipped = 0;
  private numTotal = 0;
  private unhandledErrors: unknown[] = [];

  constructor(private readonly config: ReportersManagerConfig) {}

  register(Reporter: ReporterConstructor) {
    const reporter = new Reporter(this.config);
    this.reporters.push(reporter);
    return this;
  }

  async runStart(params: { allRules: Rule[] }) {
    this.startedAt = Date.now();
    this.allRules = params.allRules;

    for (const reporter of this.reporters) {
      await reporter.onRunStart?.({
        ts: this.startedAt,
        allRules: this.allRules,
      });
    }
  }

  async ruleStart(params: Omit<Reporter$OnRuleStartParams, 'ts'>) {
    for (const reporter of this.reporters) {
      await reporter.onRuleStart?.({ ...params, ts: Date.now() });
    }
  }

  async ruleResult(params: Omit<Reporter$OnRuleResultParams, 'ts' | 'status'>) {
    const ts = Date.now();
    const status = (params.checkResult2 ?? params.checkResult).status;

    this.numTotal += 1;
    switch (status) {
      case SUCCESS: {
        this.numPassed += 1;

        break;
      }
      case FAILURE: {
        this.numFailed += 1;
        this.success = false;

        break;
      }
      case SKIPPED: {
        this.numSkipped += 1;

        break;
      }
      // No default
    }

    const fullParams = { ...params, status, ts };
    this.allResults.set(params.rule, fullParams);

    for (const reporter of this.reporters) {
      await reporter.onRuleResult?.(fullParams);
    }
  }

  reportError(error: unknown) {
    this.unhandledErrors.push(error);
  }

  async runEnd() {
    if (this.unhandledErrors.length > 0) {
      this.success = false;
    }

    const params: Reporter$OnRunEndParams = {
      ts: Date.now(),
      success: this.success,
      numPassed: this.numPassed,
      numFailed: this.numFailed,
      numSkipped: this.numSkipped,
      numTotal: this.numTotal,
      allResults: this.allResults,
      unhandledErrors: this.unhandledErrors,
    };

    for (const reporter of this.reporters) {
      await reporter.onRunEnd?.(params);
    }

    return this.success;
  }
}
