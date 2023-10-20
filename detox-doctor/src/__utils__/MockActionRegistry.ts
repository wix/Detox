import { kebabCase, snakeCase } from 'lodash';
import { SKIPPED } from '../constants';
import type { RuleRegistry, Rule } from '../types';

export class MockActionRegistry implements RuleRegistry {
  getRule = jest.fn();
  getRules = jest.fn();

  static aRule(comment: string): Rule {
    return {
      id: `rule_${snakeCase(comment)}`,
      alias: `rule-${kebabCase(comment)}`,
      description: `A ${comment} rule`,
      check: async () => ({ status: SKIPPED }),
    };
  }

  static twoRules() {
    const registry = new MockActionRegistry();
    registry.getRules.mockReturnValue([
      {
        id: 'rule1',
        alias: 'first-rule',
        description: 'First rule',
      },
      {
        id: 'rule2',
        alias: 'second-rule',
        description: 'Second rule',
      },
    ]);

    return registry;
  }
}
