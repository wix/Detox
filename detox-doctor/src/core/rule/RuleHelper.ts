import { FAILURE } from '../../constants';
import type { ActionResult, ID, Rule, NormalizedActionResult } from '../../types';

const UNHANDLED_EXCEPTION = 'Unhandled exception:\n';

/**
 * Safety wrapper around a rule that catches exceptions and returns a failure result.
 */
export class RuleHelper {
  static id(action: Rule): ID {
    return action.id;
  }

  static alias(action: Rule): ID {
    return action.alias;
  }

  static description(action: Rule): string {
    return action.description ?? '';
  }

  static needs(action: Rule): ID[] {
    return action.needs ?? [];
  }

  static async check(action: Rule): Promise<NormalizedActionResult> {
    return this.#attempt(() => action.check());
  }

  static hasFix(action: Rule): boolean {
    return typeof action.fix === 'function';
  }

  static fix(action: Rule): Promise<NormalizedActionResult> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return action.fix ? this.#attempt(() => action.fix!()) : undefined;
  }

  static error(message: string | string[] | undefined): Error {
    if (!message) {
      return new Error('Unknown error');
    }

    if (Array.isArray(message)) {
      return new Error(message.join('\n'));
    }

    return new Error(message);
  }

  static isUnhandledException(result: NormalizedActionResult): boolean {
    const { status, message } = result;
    return status === FAILURE && (message[0] ? message[0].startsWith(UNHANDLED_EXCEPTION) : false);
  }

  static async #attempt(fn: () => Promise<ActionResult>): Promise<NormalizedActionResult> {
    try {
      const result = await fn();

      return {
        status: result.status,
        message: result.message
          ? Array.isArray(result.message)
            ? result.message
            : [result.message]
          : [],
      };
    } catch (error: unknown) {
      return {
        status: FAILURE,
        message: [UNHANDLED_EXCEPTION + `${(error as Error)?.stack ?? error}`],
      };
    }
  }
}
