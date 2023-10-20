import { FAILURE, SKIPPED, SUCCESS } from '../constants';
import type { ActionResult, ActionResultStatus } from '../types';
import { aggregateRuleResults, aggregateRuleResultsAsync } from './aggregateRuleResults';

describe('aggregateRuleResults', () => {
  it('should return skipped for an empty list', () => {
    const result = aggregateRuleResults([]);
    expect(result.status).toBe(SKIPPED);
    expect(result.message).toEqual([]);
  });

  it('should return skipped for a list of skipped results', () => {
    const result = aggregateRuleResults([
      { status: SKIPPED, message: 'Skipped 1.' },
      { status: SKIPPED },
      { status: SKIPPED, message: 'Skipped 2.' },
    ]);
    expect(result.status).toBe(SKIPPED);
    expect(result.message).toEqual(['Skipped 1.', 'Skipped 2.']);
  });

  it('should return failure for a list of failure results', () => {
    const result = aggregateRuleResults([
      { status: FAILURE, message: 'Failure 1.' },
      { status: SUCCESS, message: 'Success 1.' },
    ]);

    expect(result.status).toBe(FAILURE);
    expect(result.message).toEqual(['Failure 1.']);
  });

  it('should return success for a list of successful results', () => {
    const result = aggregateRuleResults([
      { status: SKIPPED, message: 'Skipped 1.' },
      { status: SUCCESS, message: 'Success 1.' },
    ]);

    expect(result.status).toBe(SUCCESS);
    expect(result.message).toEqual(['Success 1.']);
  });

  it('should work without messages too', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const msg = (status: ActionResultStatus) => aggregateRuleResults([{ status }]).message;

    expect(msg(SUCCESS)).toEqual([]);
    expect(msg(FAILURE)).toEqual([]);
    expect(msg(SKIPPED)).toEqual([]);
  });
});

describe('aggregateRuleResultsAsync', () => {
  it('should work with a list of promises', async () => {
    const result = await aggregateRuleResultsAsync([
      Promise.resolve({ status: SUCCESS, message: 'Success 1.' }),
      Promise.resolve({ status: SUCCESS, message: 'Success 2.' }),
    ]);
    expect(result.status).toBe(SUCCESS);
    expect(result.message).toEqual(['Success 1.', 'Success 2.']);
  });

  it('should work with a list of async functions', async () => {
    const result = await aggregateRuleResultsAsync([
      async (): Promise<ActionResult> => ({ status: SUCCESS, message: 'Success 1.' }),
      async (): Promise<ActionResult> => ({ status: SUCCESS, message: 'Success 2.' }),
    ]);
    expect(result.status).toBe(SUCCESS);
    expect(result.message).toEqual(['Success 1.', 'Success 2.']);
  });
});
