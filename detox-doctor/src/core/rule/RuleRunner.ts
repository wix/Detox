import { difference, isEmpty } from 'lodash';
import { FAILURE, SKIPPED, SUCCESS } from '../../constants';
import type { Project, Rule, UI } from '../../types';
import type { ProjectImpl } from '../project';
import type { ReportersManager } from '../reporters';
import { RuleHelper } from './RuleHelper';
import type { RuleRegistryImpl } from './RuleRegistryImpl';

export type RuleRunnerConfig = {
  actionRegistry: RuleRegistryImpl;
  fix: boolean | undefined;
  project: Project;
  reportersManager: ReportersManager;
  ui: UI;
};

export class RuleRunner {
  protected readonly executed = new Set<string>();
  protected readonly actionRegistry: RuleRegistryImpl;
  protected readonly shouldFix: boolean | undefined;
  protected readonly project: Project;
  protected readonly ui: UI;
  protected readonly reportersManager: ReportersManager;

  constructor(config: RuleRunnerConfig) {
    this.actionRegistry = config.actionRegistry;
    this.shouldFix = config.fix;
    this.project = config.project;
    this.reportersManager = config.reportersManager;
    this.ui = config.ui;
  }

  async run(selectedRuleIds: string[]) {
    const allRules = this.actionRegistry.getRules(selectedRuleIds);
    const executedRules = difference(this.actionRegistry.rules, allRules);
    for (const rule of executedRules) {
      this.executed.add(rule.id);
      this.executed.add(rule.alias);
    }

    await this.reportersManager.runStart({ allRules });

    let remaining = allRules;

    do {
      const batch = remaining.filter((rule) =>
        RuleHelper.needs(rule).every((dep) => this.executed.has(dep)),
      );

      if (isEmpty(batch)) {
        break;
      }

      await this._runBatch(batch);
      remaining = difference(remaining, batch);
    } while (remaining.length > 0);

    try {
      await (this.project as ProjectImpl).commitChanges?.();
    } catch (error) {
      this.reportersManager.reportError(error);
    }

    return await this.reportersManager.runEnd();
  }

  private async _runBatch(batch: Rule[]): Promise<void> {
    for (const rule of batch) {
      await this.reportersManager.ruleStart({ rule });
      const checkResult = await RuleHelper.check(rule);

      const mightFix =
        checkResult.status === FAILURE &&
        !RuleHelper.isUnhandledException(checkResult) &&
        RuleHelper.hasFix(rule);

      let shouldFix = mightFix && this.shouldFix;
      if (shouldFix === undefined) {
        shouldFix = await this.ui.promptFix(rule.id, checkResult);
      }

      if (
        checkResult.status === SUCCESS ||
        checkResult.status === SKIPPED ||
        (checkResult.status === FAILURE && !shouldFix)
      ) {
        await this.reportersManager.ruleResult({ rule, checkResult });
      } else {
        const fixResult = await RuleHelper.fix(rule);
        if (!fixResult || fixResult.status === FAILURE || fixResult.status === SKIPPED) {
          await this.reportersManager.ruleResult({ rule, checkResult, fixResult });
        } else {
          const checkResult2 = await RuleHelper.check(rule);
          await this.reportersManager.ruleResult({ rule, checkResult, fixResult, checkResult2 });
        }
      }

      this.executed.add(rule.id);
      this.executed.add(rule.alias);
    }
  }
}
