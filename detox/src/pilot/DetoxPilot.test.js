const { Pilot } = require('@wix-pilot/core');
const { DetoxFrameworkDriver } = require('@wix-pilot/detox');

const DetoxPilot = require('./DetoxPilot');

jest.mock('@wix-pilot/core');

jest.mock('@wix-pilot/detox', () => ({
  DetoxFrameworkDriver: jest.fn(),
}));

describe('DetoxPilot', () => {
  let detoxPilot;
  const INTENT = 'test something';
  const GOAL = 'test goal';
  const mockPromptHandler = jest.fn();

  beforeEach(() => {
    detoxPilot = new DetoxPilot();
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize pilot with correct parameters', () => {
      detoxPilot.init(mockPromptHandler);

      expect(Pilot).toHaveBeenCalledWith({
        frameworkDriver: expect.any(DetoxFrameworkDriver),
        promptHandler: mockPromptHandler,
      });
    });
  });

  describe('start', () => {
    it('should call pilot.start', async () => {
      detoxPilot.init(mockPromptHandler);
      await detoxPilot.start();

      expect(Pilot.prototype.start).toHaveBeenCalled();
    });
  });

  describe('perform', () => {
    it('should call pilot.perform with the given intent', async () => {
      detoxPilot.init(mockPromptHandler);
      await detoxPilot.perform(INTENT);

      expect(Pilot.prototype.perform).toHaveBeenCalledWith(INTENT);
    });

    it('should throw an error if pilot is not initialized', async () => {
      expect(() => detoxPilot.perform(INTENT)).toThrow('DetoxPilot is not initialized');
    });
  });

  describe('autopilot', () => {
    it('should call pilot.autopilot with the given goal', async () => {
      detoxPilot.init(mockPromptHandler);
      await detoxPilot.autopilot(GOAL);

      expect(Pilot.prototype.autopilot).toHaveBeenCalledWith(GOAL);
    });
  });

  describe('isInitialized', () => {
    it('should return true if pilot is initialized', () => {
      detoxPilot.init(mockPromptHandler);

      expect(detoxPilot.isInitialized()).toBe(true);
    });

    it('should return false if pilot is not initialized', () => {
      expect(detoxPilot.isInitialized()).toBe(false);
    });
  });

  describe('end', () => {
    it('should call pilot.end with the given shouldSaveInCache', async () => {
      detoxPilot.init(mockPromptHandler);
      await detoxPilot.end(true);

      expect(Pilot.prototype.end).toHaveBeenCalledWith(true);
    });

    it('should throw an error if pilot is not initialized', async () => {
      expect(() => detoxPilot.end()).toThrow('DetoxPilot is not initialized');
    });
  });

  describe('setDefaults', () => {
    it('should merge defaults into init configuration', () => {
      const testDefaults = {
        testContext: {
          someProperty: 'test-value'
        }
      };

      detoxPilot.setDefaults(testDefaults);
      detoxPilot.init(mockPromptHandler);

      expect(Pilot).toHaveBeenCalledWith({
        frameworkDriver: expect.any(DetoxFrameworkDriver),
        promptHandler: mockPromptHandler,
        testContext: {
          someProperty: 'test-value'
        }
      });
    });

    it('should work like merge - multiple setDefaults calls accumulate', () => {
      const firstDefaults = {
        testContext: {
          property1: 'value1'
        }
      };

      const secondDefaults = {
        cacheOptions: {
          property2: 'value2'
        }
      };

      detoxPilot.setDefaults(firstDefaults);
      detoxPilot.setDefaults(secondDefaults);
      detoxPilot.init(mockPromptHandler);

      expect(Pilot).toHaveBeenCalledWith({
        frameworkDriver: expect.any(DetoxFrameworkDriver),
        promptHandler: mockPromptHandler,
        testContext: {
          property1: 'value1'
        },
        cacheOptions: {
          property2: 'value2'
        }
      });
    });
  });
});
