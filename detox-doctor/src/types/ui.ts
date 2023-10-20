import type { Logger } from './logger';
import type { NormalizedActionResult, RuleRegistry } from './rules';

export interface UI {
  listRules(): Promise<void>;
  promptFix(ruleId: string, checkResult: NormalizedActionResult): Promise<boolean>;
  promptRules(selectedRuleIds: string[]): Promise<string[]>;
  printHeader(): Promise<void>;
}

export type UIDependencies = {
  readonly actionRegistry: RuleRegistry;
  readonly doctorVersion: string;
  readonly logger: Logger;
  readonly options: DetoxDoctorOptions;
};

export type DetoxDoctorOptions = {
  cwd: string;
  fix: boolean | undefined;
  format: 'json' | 'plain';
  selectedRuleIds: string[];
  bare: boolean;
};
