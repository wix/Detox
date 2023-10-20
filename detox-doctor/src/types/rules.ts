import type { DebugLogger } from './logger';
import type { PackageManifest, Project } from './project';

export type ID = string;

export interface Rule {
  id: ID;
  alias: ID;
  readonly description?: string;
  readonly needs?: ID[];
  check(): Promise<ActionResult>;
  fix?(): Promise<ActionResult>;
}

export interface ActionResult {
  readonly status: ActionResultStatus;
  readonly message?: string | string[];
}

export interface NormalizedActionResult {
  readonly status: ActionResultStatus;
  readonly message: string[];
}

export type ActionResultStatus = 'success' | 'failure' | 'skipped';

export type RuleDependencies = {
  context: RuleContext;
  logger: DebugLogger;
  manifest: PackageManifest | null;
  project: Project;
};

export type RuleContext = {
  /**
   * Indicates that the project is not necessarily installed.
   * Some rules might rely on the project being installed, so they should
   * check this flag before doing anything.
   */
  bare: boolean;
};

export type RuleConstructor<T extends Rule = Rule> = RuleClassConstructor<T> | RuleFnConstructor<T>;

export interface RuleClassConstructor<T extends Rule = Rule> {
  new (deps: RuleDependencies): T;
}

export interface RuleFnConstructor<T extends Rule = Rule> {
  (deps: RuleDependencies): T;
}

export interface RuleRegistry {
  getRule(id: ID): Rule;
  getRules(specificRuleIds?: ID[]): Rule[];
}
