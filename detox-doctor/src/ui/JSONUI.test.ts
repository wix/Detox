import { MockActionRegistry, MockLogger } from '../__utils__';
import { JSONUI } from './JSONUI';

describe('JSONUI', () => {
  let actionRegistry: MockActionRegistry;
  let logger: MockLogger;
  let jsonUI: JSONUI;

  beforeEach(() => {
    actionRegistry = MockActionRegistry.twoRules();

    logger = new MockLogger();
    jsonUI = new JSONUI({
      actionRegistry,
      doctorVersion: '999.999.999',
      logger,
      options: {} as any,
    });
  });

  describe('#listRules', () => {
    it('should log the list of rules as JSON', async () => {
      await jsonUI.listRules();

      expect(JSON.parse(logger.dump())).toEqual({
        version: '999.999.999',
        rules: [
          { id: 'rule1', alias: 'first-rule', description: 'First rule' },
          { id: 'rule2', alias: 'second-rule', description: 'Second rule' },
        ],
      });
    });
  });

  describe('#promptRules', () => {
    it('should return the same array of rule IDs', async () => {
      const selectedRuleIds = ['rule1', 'rule2'];
      const result = await jsonUI.promptRules(selectedRuleIds);
      expect(result).toEqual(selectedRuleIds);
    });
  });

  describe('#printHeader', () => {
    it('should log nothing', async () => {
      await jsonUI.printHeader();
      expect(logger.dump()).toEqual('');
    });
  });
});
