import chalk from 'chalk';

import { FAILURE, SUCCESS } from '../constants';
import type {
  Logger,
  Reporter,
  ReporterDependencies,
  Reporter$OnRuleResultParams,
  Reporter$OnRuleStartParams,
  Reporter$OnRunEndParams,
  Reporter$OnRunStartParams,
} from '../types';
import { indent } from '../utils';

const { blue: em, red, green, yellow, gray } = chalk;

export class DefaultReporter implements Reporter {
  private readonly logger: Logger;
  private startedAt = Number.NaN;

  constructor(deps: Pick<ReporterDependencies, 'logger'>) {
    this.logger = deps.logger;
  }

  onRunStart(params: Reporter$OnRunStartParams): void {
    this.startedAt = params.ts;
    this.logger.log('Running rules...\n');
  }

  onRuleStart(params: Reporter$OnRuleStartParams): void {
    const { alias } = params.rule;
    this.logger.debug(`Started rule: ${alias}`);
  }

  onRuleResult(params: Reporter$OnRuleResultParams): void {
    const {
      status,
      rule: { alias },
      fixResult,
      checkResult,
      checkResult2,
    } = params;

    const badge = status === SUCCESS ? '✔' : status === FAILURE ? '✖' : '⏏';
    const color = status === SUCCESS ? green : status === FAILURE ? red : yellow;
    const messages: string[] = [];
    const enqueueMessage = (message: string[]) => messages.push(...message);

    this.logger.log(color(`${badge} ${alias}`));
    if (fixResult) {
      if (fixResult.status === FAILURE) {
        enqueueMessage(checkResult.message);
      }
      enqueueMessage(fixResult.message);
      if (fixResult.status === SUCCESS && checkResult2 && checkResult2.status !== SUCCESS) {
        enqueueMessage(['⚠ The fix was not successful.']);
        enqueueMessage(checkResult2.message);
      }
    } else {
      enqueueMessage(checkResult.message);
    }
    this._printMessage(messages);
  }

  onRunEnd(params: Reporter$OnRunEndParams): void {
    const { ts, success, allResults, numFailed, numPassed, numSkipped } = params;

    this.logger.log('\nRules Summary');
    this.logger.log('-------------');
    this.logger.log(`Execution time: ${em(`${ts - this.startedAt}ms`)}`);
    this.logger.log(`${green(numPassed)} rules passed`);
    this.logger.log(`${red(numFailed)} rules failed`);
    this.logger.log(`${yellow(numSkipped)} rules skipped\n`);

    if (numFailed > 0) {
      this.logger.log('Failed Rules');
      this.logger.log('------------');
      for (const [rule, result] of allResults) {
        if (result.status === FAILURE) {
          this.logger.log(`- ${red(rule.alias)}`);
          if (rule.description) {
            this.logger.log(`  - ${gray(rule.description)}`);
          }
        }
      }
      this.logger.log('\nPlease review and address the issues before running the tests again.');
    } else if (success) {
      this.logger.log('Detox Doctor completed successfully.');
    } else {
      const { unhandledErrors } = params;
      const reason =
        unhandledErrors.length > 0 ? 'due to an unhandled error:' : 'for an unknown reason.';
      this.logger.log(`Detox Doctor failed ${reason}`);
      for (const error of unhandledErrors) {
        this.logger.log(`${error}\n`);
      }
    }
  }

  private _printMessage(message: string[]) {
    for (let i = 0; i < message.length; i++) {
      const line = message[i];
      const last = i === message.length - 1;
      const char = last ? '└' : '├';
      const indentation = last ? '      ' : '  │   ';
      this.logger.log(indent(line, indentation).replace(indentation, `  ${char}── `));
    }
  }
}
