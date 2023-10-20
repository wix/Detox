import type { RuleRegistry, Logger, UI, UIDependencies } from '../types';

export class JSONUI implements UI {
  private readonly actionRegistry: RuleRegistry;
  private readonly doctorVersion: string;
  private readonly logger: Logger;

  constructor(deps: UIDependencies) {
    this.actionRegistry = deps.actionRegistry;
    this.doctorVersion = deps.doctorVersion;
    this.logger = deps.logger;
  }

  async listRules(): Promise<void> {
    const rules = this.actionRegistry.getRules().map((rule) => ({
      id: rule.id,
      alias: rule.alias,
      description: rule.description,
    }));

    this.logger.log(
      JSON.stringify({
        version: this.doctorVersion,
        rules,
      }),
    );
  }

  async printHeader(): Promise<void> {
    // no-op
  }

  async promptFix(): Promise<boolean> {
    return false; // no-op
  }

  async promptRules(selectedRuleIds: string[]) {
    return selectedRuleIds;
  }
}
