import type { Rule } from '../types';

export class MockRule implements Rule {
  static readonly instances: MockRule[] = [];

  readonly alias = 'mock-rule';
  readonly id = 'MOCK';

  check = jest.fn();
  fix = jest.fn();

  constructor() {
    MockRule.instances.push(this);
  }
}
