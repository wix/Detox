import { MockActionRegistry, MockLogger } from '../__utils__';
import { ConsoleUI } from './ConsoleUI';

jest.mock('chalk', () => {
  return {
    blue: (text: string) => `blue(${text})`,
    bold: (text: string) => `bold(${text})`,
  };
});
jest.mock('inquirer', () => {
  return { prompt: jest.fn() };
});

describe('ConsoleUI', () => {
  let actionRegistry: MockActionRegistry;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let inquirer: jest.Mocked<typeof import('inquirer').default>;
  let logger: MockLogger;
  let consoleUI: ConsoleUI;

  beforeEach(() => {
    inquirer = jest.requireMock('inquirer');
    actionRegistry = new MockActionRegistry();
    actionRegistry.getRules.mockReturnValue([
      { id: 'rule1', alias: 'first-rule', description: 'First rule' },
      { id: 'rule2', alias: 'second-rule', description: 'Second rule' },
    ]);

    logger = new MockLogger();
    consoleUI = new ConsoleUI({
      actionRegistry,
      doctorVersion: '999.999.999',
      logger,
      options: {
        format: 'plain',
        color: false,
      } as any,
    });
  });

  describe('#listRules', () => {
    it('should log the list of rules', async () => {
      await consoleUI.listRules();
      expect(logger.dump()).toMatchInlineSnapshot(`
        "Welcome to bold(detox-doctor)@blue(999.999.999) !
        Below you can find the available rules:

        blue(first-rule) (id: blue(rule1))
        	First rule

        blue(second-rule) (id: blue(rule2))
        	Second rule
        "
      `);
    });
  });

  describe('#promptRules', () => {
    beforeEach(() => {
      inquirer.prompt.mockReturnValue({ choices: ['first-rule'] } as any);
    });

    it('should prompt the user to select rules', async () => {
      await consoleUI.promptRules(['first-rule']);

      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          choices: [
            { name: 'first-rule', value: 'first-rule', default: true },
            { name: 'second-rule', value: 'second-rule', default: false },
          ],
        }),
      ]);
    });
  });

  describe('#printHeader', () => {
    it('should log detox-doctor version', async () => {
      await consoleUI.printHeader();
      expect(logger.dump()).toMatchInlineSnapshot(`
        "Detox Doctor (999.999.999)
        ------------"
      `);
    });
  });
});
