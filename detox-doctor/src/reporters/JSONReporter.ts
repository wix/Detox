import { FAILURE, SUCCESS } from '../constants';
import type {
  ActionResultStatus,
  Logger,
  Reporter,
  Reporter$OnRuleResultParams,
  Reporter$OnRuleStartParams,
  Reporter$OnRunEndParams,
  Reporter$OnRunStartParams,
  ReporterDependencies,
} from '../types';

export type DetoxDoctorJSONReport = {
  event: 'detox-doctor-report';
  version: 1;
  success: boolean;
  duration: number;
  numFailed: number;
  numPassed: number;
  numSkipped: number;
  numTotal: number;
  unhandledErrors: string[];
  results: DetoxDoctorJSONReport$Result[];
};

export type DetoxDoctorJSONReport$Result = {
  rule: {
    alias: string;
    description: string;
  };
  status: ActionResultStatus;
  message: string;
};

export class JSONReporter implements Reporter {
  private readonly logger: Logger;
  private startedAt = Number.NaN;

  constructor(deps: Pick<ReporterDependencies, 'logger'>) {
    this.logger = deps.logger;
  }

  onRunStart(params: Reporter$OnRunStartParams): void {
    this.startedAt = params.ts;
    this._debug({ event: 'run-start', ts: params.ts });
  }

  onRuleStart(params: Reporter$OnRuleStartParams): void {
    const {
      rule: { alias },
      ts,
    } = params;

    this._debug({ event: 'rule-start', ts, alias });
  }

  onRuleResult(params: Reporter$OnRuleResultParams): void {
    const {
      ts,
      status,
      rule: { alias },
    } = params;
    this._debug({ event: 'rule-result', ts, alias, status });
  }

  onRunEnd(params: Reporter$OnRunEndParams): void {
    const { ts, unhandledErrors, allResults, success, numFailed, numPassed, numSkipped, numTotal } =
      params;

    const report: DetoxDoctorJSONReport = {
      event: 'detox-doctor-report',
      version: 1,
      success,
      duration: ts - this.startedAt,
      numFailed,
      numPassed,
      numSkipped,
      numTotal,
      results: [...allResults.values()].map((result) => this._buildReportResult(result)),
      unhandledErrors: unhandledErrors.map((err) => `${(err as Error)?.stack ?? err}`),
    };

    this._log(report);
  }

  _buildReportResult({
    rule: { alias, description },
    status,
    fixResult,
    checkResult,
    checkResult2,
  }: Reporter$OnRuleResultParams): DetoxDoctorJSONReport$Result {
    const message: string[] = [];

    if (fixResult) {
      if (fixResult.status === FAILURE) {
        message.push(...checkResult.message);
      }

      message.push(...fixResult.message);

      if (fixResult.status === SUCCESS && checkResult2 && checkResult2.status !== SUCCESS) {
        message.push('⚠ The fix was not successful.', ...checkResult2.message);
      }
    } else {
      message.push(...checkResult.message);
    }

    return {
      rule: {
        alias,
        description: description ?? '',
      },
      status,
      message: message.join('\n'),
    };
  }

  _log(msg: unknown) {
    this.logger.log(JSON.stringify(msg, null, 2));
  }

  _debug(msg: unknown) {
    this.logger.debug(JSON.stringify(msg));
  }
}
