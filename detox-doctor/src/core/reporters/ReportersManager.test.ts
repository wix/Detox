import type { MockManifest } from '../../__utils__';
import { MockLogger, MockProject, MockReporter, MockRule } from '../../__utils__';

import { SUCCESS } from '../../constants';
import type { Rule } from '../../types';
import { MockActionFactory } from '../__utils__';
import { RuleRegistryImpl } from '../rule';
import { ReportersManager } from './ReportersManager';

describe('ReportersManager', () => {
  let rule: Rule;
  let logger: MockLogger;
  let project: MockProject;
  let manifest: MockManifest;
  let reporter: MockReporter;
  let actionRegistry: RuleRegistryImpl;
  let reportersManager: ReportersManager;

  beforeEach(async () => {
    logger = new MockLogger();
    project = new MockProject();
    manifest = await project.getManifest();

    const actionFactory = new MockActionFactory();
    actionRegistry = new RuleRegistryImpl({
      actionFactory,
      rules: { MockRule },
    });

    rule = actionRegistry.rules[0];

    reportersManager = new ReportersManager({
      logger,
      project,
      manifest,
      actionRegistry,
    }).register(MockReporter);

    reporter = MockReporter.instances.pop()!;
  });

  describe('#register', () => {
    it('should register a new reporter', () => {
      expect(reporter).toBeDefined();
    });
  });

  describe('#runStart', () => {
    it('should call the onRunStart method of all registered reporters', async () => {
      await reportersManager.runStart({ allRules: [] });
      expect(reporter.onRunStart).toHaveBeenCalled(); // TODO: check the output
    });
  });

  describe('#ruleStart', () => {
    it('should call the onRuleStart method of all registered reporters', async () => {
      await reportersManager.ruleStart({ rule });
      expect(reporter.onRuleStart).toHaveBeenCalled(); // TODO: check the output
    });
  });

  describe('#ruleResult', () => {
    it('should call the onRuleResult method of all registered reporters', async () => {
      await reportersManager.ruleResult({
        rule,
        checkResult: {
          status: SUCCESS,
          message: ['All is fine'],
        },
      });
      expect(reporter.onRuleResult).toHaveBeenCalled();
    });
  });

  describe('#runEnd', () => {
    it('should call the onRunEnd method of all registered reporters', async () => {
      await reportersManager.runEnd();
      expect(reporter.onRunEnd).toHaveBeenCalled();
    });
  });

  describe('#reportError', () => {
    it('should call the onRunEnd method with the reported error', async () => {
      const err = new Error('Test error');
      await reportersManager.reportError(err);
      await reportersManager.runEnd();
      expect(reporter.onRunEnd).toHaveBeenCalledWith(
        expect.objectContaining({
          unhandledErrors: [err],
        }),
      );
    });
  });
});
