import type { Reporter } from '../types';

export class MockReporter implements Reporter {
  static readonly instances: MockReporter[] = [];

  onRunStart = jest.fn();
  onRuleStart = jest.fn();
  onRuleResult = jest.fn();
  onRunEnd = jest.fn();

  constructor() {
    MockReporter.instances.push(this);
  }
}
