import type { RuleRegistry, Rule, RuleConstructor, ID } from '../../types';
import type { RuleFactory } from './RuleFactoryImpl';

export type RuleRegistryDependencies = {
  rules: Record<string, RuleConstructor>;
  actionFactory: RuleFactory;
};

export class RuleRegistryImpl implements RuleRegistry {
  public readonly rules: Rule[];

  constructor(deps: RuleRegistryDependencies) {
    this.rules = Object.values(deps.rules).map((RuleClass: RuleConstructor) => {
      return deps.actionFactory.createRule(RuleClass);
    });

    this._validateIDUniqueness();
  }

  public getRule(id: ID): Rule {
    const rule = this.rules.find((rule) => rule.id === id || rule.alias === id);
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }

    return rule;
  }

  public getRules(specificRuleIds: ID[] = []): Rule[] {
    const ids = new Set(specificRuleIds);

    if (ids.size === 0) {
      return this.rules;
    }

    return this.rules.filter((rule) => ids.has(rule.id) || ids.has(rule.alias));
  }

  private _validateIDUniqueness() {
    const ids = this.rules.map((rule) => rule.id);
    const uniqueIds = new Set(ids);
    const nonUniqueRules = this.rules.filter((rule) => !uniqueIds.has(rule.id));

    if (nonUniqueRules.length > 0) {
      const details = nonUniqueRules.map((rule) => `\t- ${rule.alias} (id: ${rule.id})`).join('\n');
      throw new Error(`Detected non-unique rule IDs:\n${details}`);
    }
  }
}
