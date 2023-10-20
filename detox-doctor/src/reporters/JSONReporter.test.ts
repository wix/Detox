import { MockActionRegistry, MockLogger } from '../__utils__';
import { FAILURE, SKIPPED, SUCCESS } from '../constants';
import type { Reporter$OnRuleResultParams, Rule } from '../types';
import type { DetoxDoctorJSONReport } from './JSONReporter';
import { JSONReporter } from './JSONReporter';

describe('JSONReporter', () => {
  let logger: MockLogger;
  let actionRegistry: MockActionRegistry;
  let jsonReporter: JSONReporter;

  beforeEach(() => {
    logger = new MockLogger();
    actionRegistry = MockActionRegistry.twoRules();
    jsonReporter = new JSONReporter({ logger });
  });

  describe('#onRunStart', () => {
    it('should log the start of the run', () => {
      jsonReporter.onRunStart({ ts: 0, allRules: actionRegistry.getRules() });
      expect(logger.dump('log')).toBe('');
      expect(logger.dumpJSON('debug')).toEqual([{ event: 'run-start', ts: 0 }]);
    });
  });

  describe('#onRuleStart', () => {
    it('should log the start of a rule', () => {
      jsonReporter.onRuleStart({
        ts: 1000,
        rule: actionRegistry.getRules()[0],
      });

      expect(logger.dump('log')).toBe('');
      expect(logger.dumpJSON('debug')).toEqual([
        {
          alias: 'first-rule',
          event: 'rule-start',
          ts: 1000,
        },
      ]);
    });
  });

  describe('#onRuleResult', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const onRuleResult = ({ status, checkResult, fixResult, checkResult2 }: any) => {
      jsonReporter.onRuleResult({
        ts: 1000,
        status,
        rule: actionRegistry.getRules()[0],
        checkResult,
        fixResult,
        checkResult2,
      });
    };

    it('should log a rule result', () => {
      onRuleResult({
        status: SUCCESS,
        checkResult: {
          status: SUCCESS,
          message: ['Rule passed'],
        },
      });

      expect(logger.dumpJSON('debug')).toMatchInlineSnapshot(`
        [
          {
            "alias": "first-rule",
            "event": "rule-result",
            "status": "success",
            "ts": 1000,
          },
        ]
      `);
      expect(logger.dump('log')).toBe('');
    });
  });

  describe('#onRunComplete', () => {
    beforeEach(() => {
      jsonReporter.onRunStart({ ts: 0, allRules: actionRegistry.getRules() });
      logger.clear('debug');
    });

    it('should log the end of a successful run', () => {
      const firstRule = actionRegistry.getRules()[0];
      jsonReporter.onRunEnd({
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
        numTotal: 1,
        success: true,
        ts: 1200,
        unhandledErrors: [],
      });

      expect(logger.dump('debug')).toBe('');
      expect(logger.dumpJSON('log')).toMatchInlineSnapshot(`
        [
          {
            "duration": 1200,
            "event": "detox-doctor-report",
            "numFailed": 0,
            "numPassed": 1,
            "numSkipped": 0,
            "numTotal": 1,
            "results": [
              {
                "message": "Rule passed",
                "rule": {
                  "alias": "first-rule",
                  "description": "First rule",
                },
                "status": "success",
              },
            ],
            "success": true,
            "unhandledErrors": [],
            "version": 1,
          },
        ]
      `);
    });

    it('should log the end of an unsuccessful run', () => {
      const rule1 = MockActionRegistry.aRule('successful');
      const rule2 = MockActionRegistry.aRule('failed');
      const rule3 = MockActionRegistry.aRule('skipped');
      const rule4 = MockActionRegistry.aRule('fixed');
      const rule5 = MockActionRegistry.aRule('bad-fix');
      const rule6 = MockActionRegistry.aRule('pseudo-fix');
      const rule7 = MockActionRegistry.aRule('skipped-fix');

      jsonReporter.onRunEnd({
        ts: 4000,
        allResults: new Map<Rule, Reporter$OnRuleResultParams>([
          [
            rule1,
            {
              ts: 1000,
              rule: rule1,
              status: SUCCESS,
              checkResult: {
                status: SUCCESS,
                message: ['Rule passed'],
              },
            },
          ],
          [
            rule2,
            {
              ts: 1500,
              rule: rule2,
              status: FAILURE,
              checkResult: {
                status: FAILURE,
                message: ['Rule failed'],
              },
            },
          ],
          [
            rule3,
            {
              ts: 2000,
              rule: rule3,
              status: SKIPPED,
              checkResult: {
                status: SKIPPED,
                message: ['Rule skipped'],
              },
            },
          ],
          [
            rule4,
            {
              ts: 2500,
              rule: rule4,
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
            },
          ],
          [
            rule5,
            {
              ts: 3000,
              rule: rule5,
              status: FAILURE,
              checkResult: {
                status: FAILURE,
                message: ['Rule failed'],
              },
              fixResult: {
                status: FAILURE,
                message: ['Fix failed'],
              },
            },
          ],
          [
            rule6,
            {
              ts: 3500,
              rule: rule6,
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
            },
          ],
          [
            rule7,
            {
              ts: 3500,
              rule: rule6,
              status: FAILURE,
              checkResult: {
                status: FAILURE,
                message: ['Rule failed'],
              },
              fixResult: {
                status: SKIPPED,
                message: [],
              },
            },
          ],
        ]),
        numFailed: 3,
        numPassed: 2,
        numSkipped: 2,
        numTotal: 7,
        success: true,
        unhandledErrors: [],
      });

      expect(logger.dump('debug')).toBe('');
      expect(logger.dumpJSON('log')).toMatchInlineSnapshot(`
        [
          {
            "duration": 4000,
            "event": "detox-doctor-report",
            "numFailed": 3,
            "numPassed": 2,
            "numSkipped": 2,
            "numTotal": 7,
            "results": [
              {
                "message": "Rule passed",
                "rule": {
                  "alias": "rule-successful",
                  "description": "A successful rule",
                },
                "status": "success",
              },
              {
                "message": "Rule failed",
                "rule": {
                  "alias": "rule-failed",
                  "description": "A failed rule",
                },
                "status": "failure",
              },
              {
                "message": "Rule skipped",
                "rule": {
                  "alias": "rule-skipped",
                  "description": "A skipped rule",
                },
                "status": "skipped",
              },
              {
                "message": "Rule fixed",
                "rule": {
                  "alias": "rule-fixed",
                  "description": "A fixed rule",
                },
                "status": "success",
              },
              {
                "message": "Rule failed
        Fix failed",
                "rule": {
                  "alias": "rule-bad-fix",
                  "description": "A bad-fix rule",
                },
                "status": "failure",
              },
              {
                "message": "Fix succeeded
        ⚠ The fix was not successful.
        Rule failed",
                "rule": {
                  "alias": "rule-pseudo-fix",
                  "description": "A pseudo-fix rule",
                },
                "status": "failure",
              },
              {
                "message": "",
                "rule": {
                  "alias": "rule-pseudo-fix",
                  "description": "A pseudo-fix rule",
                },
                "status": "failure",
              },
            ],
            "success": true,
            "unhandledErrors": [],
            "version": 1,
          },
        ]
      `);
    });

    it('should log the end of a broken run (due to an unknown error)', () => {
      jsonReporter.onRunEnd({
        allResults: new Map(),
        numFailed: 0,
        numPassed: 0,
        numSkipped: 0,
        numTotal: 0,
        success: false,
        ts: 1200,
        unhandledErrors: [],
      });

      expect(logger.dump('debug')).toBe('');
      expect(logger.dumpJSON('log')).toEqual([
        {
          duration: 1200,
          event: 'detox-doctor-report',
          numFailed: 0,
          numPassed: 0,
          numSkipped: 0,
          numTotal: 0,
          results: [],
          success: false,
          unhandledErrors: [],
          version: 1,
        },
      ]);
    });

    it('should log the end of a broken run (due to a known error)', () => {
      jsonReporter.onRunEnd({
        allResults: new Map(),
        numFailed: 0,
        numPassed: 0,
        numSkipped: 0,
        numTotal: 0,
        success: false,
        ts: 1200,
        unhandledErrors: [new Error('Simulated error')],
      });

      expect(logger.dump('debug')).toBe('');
      expect(logger.dumpJSON('log')).toEqual([
        {
          event: 'detox-doctor-report',
          version: 1,
          duration: 1200,
          numFailed: 0,
          numPassed: 0,
          numSkipped: 0,
          numTotal: 0,
          results: [],
          success: false,
          unhandledErrors: [expect.stringContaining('Simulated error')],
        } as DetoxDoctorJSONReport,
      ]);
    });
  });
});
