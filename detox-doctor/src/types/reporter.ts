import type { Logger } from './logger';
import type { PackageManifest, Project } from './project';
import type { ActionResultStatus, NormalizedActionResult, Rule } from './rules';

export interface Reporter {
  onRunStart?(params: Reporter$OnRunStartParams): void;
  onRuleStart?(params: Reporter$OnRuleStartParams): void;
  onRuleResult?(params: Reporter$OnRuleResultParams): void;
  onRunEnd?(params: Reporter$OnRunEndParams): void;
}

export interface ReporterConstructor {
  new (deps: ReporterDependencies): Reporter;
}

export interface ReporterDependencies {
  readonly logger: Logger;
  readonly project: Project;
  readonly manifest: PackageManifest | null;
}

export type Reporter$OnRunStartParams = {
  ts: number;
  allRules: Rule[];
};

export type Reporter$OnRuleStartParams = {
  ts: number;
  rule: Rule;
};

export type Reporter$OnRuleResultParams = {
  ts: number;
  status: ActionResultStatus;
  rule: Rule;
  checkResult: NormalizedActionResult;
  fixResult?: NormalizedActionResult;
  checkResult2?: NormalizedActionResult;
};

export type Reporter$OnRunEndParams = {
  ts: number;
  success: boolean;
  numPassed: number;
  numFailed: number;
  numSkipped: number;
  numTotal: number;
  allResults: Map<Rule, Reporter$OnRuleResultParams>;
  unhandledErrors: unknown[];
};
