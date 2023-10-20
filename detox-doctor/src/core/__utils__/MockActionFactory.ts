import { MockRule } from '../../__utils__';
import type { RuleConstructor } from '../../types';
import type { RuleFactory } from '../rule';

export class MockActionFactory implements RuleFactory {
  createRule(_Rule: RuleConstructor) {
    return new MockRule();
  }
}
