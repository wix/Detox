import { MockActionRegistry, MockLogger } from '../__utils__';
import { FAILURE, SKIPPED, SUCCESS } from '../constants';
import { DefaultReporter } from './DefaultReporter';

jest.mock('chalk', () => ({
  gray: (text: string) => `gray(${text})`,
  blue: (text: string) => `blue(${text})`,
  red: (text: string) => `red(${text})`,
  green: (text: string) => `green(${text})`,
  yellow: (text: string) => `yellow(${text})`,
}));

describe('DefaultReporter', () => {
  let logger: MockLogger;
  let actionRegistry: MockActionRegistry;
  let defaultReporter: DefaultReporter;

  beforeEach(() => {
    logger = new MockLogger();
    actionRegistry = MockActionRegistry.twoRules();
    defaultReporter = new DefaultReporter({ logger });
  });

  describe('#onRunStart', () => {
    it('should log the start of the run', () => {
      defaultReporter.onRunStart({ ts: 0, allRules: actionRegistry.getRules() });
      expect(logger.dump()).toMatchInlineSnapshot(`
        "Running rules...
        "
      `);
    });
  });

  describe('#onRuleStart', () => {
    it('should log the start of a rule', () => {
      defaultReporter.onRuleStart({
        ts: 1000,
        rule: actionRegistry.getRules()[0],
      });

      expect(logger.debug).toHaveBeenCalledWith('Started rule: first-rule');
    });
  });

  describe('#onRuleResult', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const onRuleResult = ({ status, checkResult, fixResult, checkResult2 }: any) => {
      defaultReporter.onRuleResult({
        ts: 1000,
        status,
        rule: actionRegistry.getRules()[0],
        checkResult,
        fixResult,
        checkResult2,
      });
    };

    it('should log a successful rule result', () => {
      onRuleResult({
        status: SUCCESS,
        checkResult: {
          status: SUCCESS,
          message: ['Rule passed'],
        },
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "green(✔ first-rule)
          └── Rule passed"
      `);
    });

    it('should log a failed rule result', () => {
      onRuleResult({
        status: FAILURE,
        checkResult: {
          status: FAILURE,
          message: ['Rule failed'],
        },
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "red(✖ first-rule)
          └── Rule failed"
      `);
    });

    it('should log a skipped rule result', () => {
      onRuleResult({
        status: SKIPPED,
        checkResult: {
          status: SKIPPED,
          message: ['Rule skipped'],
        },
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "yellow(⏏ first-rule)
          └── Rule skipped"
      `);
    });

    it('should log a fixed rule result', () => {
      onRuleResult({
        status: SUCCESS,
        checkResult: {
          status: FAILURE,
          message: ['Rule failed'],
        },
        fixResult: {
          status: SUCCESS,
          message: ['Rule fixed'],
        },
        checkResult2: {
          status: SUCCESS,
          message: ['Rule passed'],
        },
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "green(✔ first-rule)
          └── Rule fixed"
      `);
    });

    it('should log an unsuccessful fix rule', () => {
      onRuleResult({
        status: FAILURE,
        checkResult: {
          status: FAILURE,
          message: ['Rule failed\nHere is why\nDid you try this?'],
        },
        fixResult: {
          status: FAILURE,
          message: ['Fix failed\nDunno why'],
        },
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "red(✖ first-rule)
          ├── Rule failed
          │   Here is why
          │   Did you try this?
          └── Fix failed
              Dunno why"
      `);
    });

    it('should log a pseudo-successful fix', () => {
      onRuleResult({
        status: FAILURE,
        checkResult: {
          status: FAILURE,
          message: ['Rule failed'],
        },
        fixResult: {
          status: SUCCESS,
          message: ['Fix succeeded'],
        },
        checkResult2: {
          status: FAILURE,
          message: ['Rule failed'],
        },
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "red(✖ first-rule)
          ├── Fix succeeded
          ├── ⚠ The fix was not successful.
          └── Rule failed"
      `);
    });
  });

  describe('#onRunComplete', () => {
    beforeEach(() => {
      defaultReporter.onRunStart({ ts: 0, allRules: actionRegistry.getRules() });
    });

    it('should log the end of a successful run', () => {
      const firstRule = actionRegistry.getRules()[0];
      defaultReporter.onRunEnd({
        allResults: new Map([
          [
            firstRule,
            {
              ts: 1000,
              status: SUCCESS,
              rule: firstRule,
              checkResult: {
                status: SUCCESS,
                message: ['Rule passed'],
              },
            },
          ],
        ]),
        numFailed: 0,
        numPassed: 1,
        numSkipped: 0,
        numTotal: 0,
        success: true,
        ts: 1200,
        unhandledErrors: [],
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "Running rules...


        Rules Summary
        -------------
        Execution time: blue(1200ms)
        green(1) rules passed
        red(0) rules failed
        yellow(0) rules skipped

        Detox Doctor completed successfully."
      `);
    });

    it('should log the end of an unsuccessful run', () => {
      const firstRule = actionRegistry.getRules()[0];
      defaultReporter.onRunEnd({
        allResults: new Map([
          [
            firstRule,
            {
              ts: 1000,
              status: FAILURE,
              rule: firstRule,
              checkResult: {
                status: FAILURE,
                message: ['Rule failed'],
              },
            },
          ],
        ]),
        numFailed: 1,
        numPassed: 0,
        numSkipped: 0,
        numTotal: 0,
        success: true,
        ts: 1200,
        unhandledErrors: [],
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "Running rules...


        Rules Summary
        -------------
        Execution time: blue(1200ms)
        green(0) rules passed
        red(1) rules failed
        yellow(0) rules skipped

        Failed Rules
        ------------
        - red(first-rule)
          - gray(First rule)

        Please review and address the issues before running the tests again."
      `);
    });

    it('should log the end of a broken run (due to an unknown error)', () => {
      defaultReporter.onRunEnd({
        allResults: new Map(),
        numFailed: 0,
        numPassed: 0,
        numSkipped: 0,
        numTotal: 0,
        success: false,
        ts: 1200,
        unhandledErrors: [],
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "Running rules...


        Rules Summary
        -------------
        Execution time: blue(1200ms)
        green(0) rules passed
        red(0) rules failed
        yellow(0) rules skipped

        Detox Doctor failed for an unknown reason."
      `);
    });

    it('should log the end of a broken run (due to a known error)', () => {
      defaultReporter.onRunEnd({
        allResults: new Map(),
        numFailed: 0,
        numPassed: 0,
        numSkipped: 0,
        numTotal: 0,
        success: false,
        ts: 1200,
        unhandledErrors: [new Error('Simulated error')],
      });

      expect(logger.dump()).toMatchInlineSnapshot(`
        "Running rules...


        Rules Summary
        -------------
        Execution time: blue(1200ms)
        green(0) rules passed
        red(0) rules failed
        yellow(0) rules skipped

        Detox Doctor failed due to an unhandled error:
        Error: Simulated error
        "
      `);
    });
  });
});
