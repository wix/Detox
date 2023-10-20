import { FAILURE, SKIPPED, SUCCESS } from '../constants';
import type { ActionResult, ActionResultStatus } from '../types';

export type InflatedActionResult = {
  status: ActionResultStatus;
  message?: string | string[];
  successMessage?: string | string[];
  failureMessage?: string | string[];
  skipReason?: string | string[];
};

export function flattenResult(result: InflatedActionResult): ActionResult {
  if (result.message) {
    return {
      status: result.status,
      message: result.message,
    };
  }

  switch (result.status) {
    case SUCCESS: {
      return {
        status: result.status,
        message: result.successMessage,
      };
    }
    case FAILURE: {
      return {
        status: result.status,
        message: result.failureMessage,
      };
    }
    case SKIPPED: {
      return {
        status: result.status,
        message: result.skipReason,
      };
    }
    default: {
      throw new Error(`Unknown rule result status: ${result.status}`);
    }
  }
}
