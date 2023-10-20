import { FAILURE, SKIPPED, SUCCESS } from '../constants';
import type { ActionResult } from '../types';
import { flattenResult } from './flattenResult';

export function aggregateRuleResults(rawRuleResults: Iterable<ActionResult>): ActionResult {
  const actionResults = [...rawRuleResults];
  const failure = actionResults.filter((result) => result.status === FAILURE);
  const skipped = actionResults.filter((result) => result.status === SKIPPED);
  const success = actionResults.filter((result) => result.status === SUCCESS);
  const status = failure.length > 0 ? FAILURE : success.length > 0 ? SUCCESS : SKIPPED;

  return flattenResult({
    status,
    successMessage: success.flatMap<string>((result) => result.message || []),
    failureMessage: failure.flatMap<string>((result) => result.message || []),
    skipReason: skipped.flatMap<string>((result) => result.message || []),
  });
}

type PromiseOrAsyncFunction<T> = Promise<T> | (() => Promise<T>);

export async function aggregateRuleResultsAsync(
  rawRuleResults: Iterable<PromiseOrAsyncFunction<ActionResult>>,
): Promise<ActionResult> {
  return aggregateRuleResults(
    await Promise.all([...rawRuleResults].map((r) => (typeof r === 'function' ? r() : r))),
  );
}
