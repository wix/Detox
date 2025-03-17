jest.mock('@wix-pilot/core', () => {
  return {
    Pilot: jest.fn().mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      perform: jest.fn().mockResolvedValue(undefined),
      autopilot: jest.fn().mockResolvedValue(undefined),
      extendAPICatalog: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

jest.mock('@wix-pilot/detox', () => ({
  DetoxFrameworkDriver: jest.fn()
}));

const DetoxPilot = require('./DetoxPilot');

describe('DetoxPilot', () => {
  let detoxPilot;
  const INTENT = 'test something';
  const GOAL = 'test goal';
  const mockPromptHandler = jest.fn();
  let mockPilotInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    detoxPilot = new DetoxPilot();

    detoxPilot.init(mockPromptHandler);
    mockPilotInstance = detoxPilot.pilot;
  });

  describe('init', () => {
    it('should initialize pilot with correct parameters', () => {
      const detoxPilot = new DetoxPilot();
      detoxPilot.init(mockPromptHandler);

      const Pilot = require('@wix-pilot/core').Pilot;
      expect(Pilot).toHaveBeenCalledWith({
        frameworkDriver: expect.any(Object),
        promptHandler: mockPromptHandler,
      });

      const DetoxFrameworkDriver = require('@wix-pilot/detox').DetoxFrameworkDriver;
      expect(DetoxFrameworkDriver).toHaveBeenCalled();
      expect(detoxPilot.isInitialized()).toBe(true);
    });
  });

  describe('start', () => {
    it('should call pilot.start', async () => {
      await detoxPilot.start();
      expect(mockPilotInstance.start).toHaveBeenCalled();
    });

    it('should throw an error if pilot is not initialized', async () => {
      const uninitializedPilot = new DetoxPilot();
      expect(() => uninitializedPilot.start()).toThrow('DetoxPilot is not initialized');
    });
  });

  describe('perform', () => {
    it('should call pilot.perform with the given intent', async () => {
      await detoxPilot.perform(INTENT);
      expect(mockPilotInstance.perform).toHaveBeenCalledWith(INTENT);
    });

    it('should throw an error if pilot is not initialized', async () => {
      const uninitializedPilot = new DetoxPilot();
      expect(() => uninitializedPilot.perform(INTENT)).toThrow('DetoxPilot is not initialized');
    });
  });

  describe('autopilot', () => {
    it('should call pilot.autopilot with the given goal', async () => {
      await detoxPilot.autopilot(GOAL);
      expect(mockPilotInstance.autopilot).toHaveBeenCalledWith(GOAL);
    });

    it('should throw an error if pilot is not initialized', async () => {
      const uninitializedPilot = new DetoxPilot();
      expect(() => uninitializedPilot.autopilot(GOAL)).toThrow('DetoxPilot is not initialized');
    });
  });

  describe('extendAPICatalog', () => {
    const categories = { category: 'test' };
    const context = { context: 'test' };

    it('should call pilot.extendAPICatalog with the given parameters', async () => {
      await detoxPilot.extendAPICatalog(categories, context);
      expect(mockPilotInstance.extendAPICatalog).toHaveBeenCalledWith(categories, context);
    });

    it('should throw an error if pilot is not initialized', async () => {
      const uninitializedPilot = new DetoxPilot();
      expect(() => uninitializedPilot.extendAPICatalog(categories, context)).toThrow('DetoxPilot is not initialized');
    });
  });

  describe('isInitialized', () => {
    it('should return true if pilot is initialized', () => {
      expect(detoxPilot.isInitialized()).toBe(true);
    });

    it('should return false if pilot is not initialized', () => {
      const uninitializedPilot = new DetoxPilot();
      expect(uninitializedPilot.isInitialized()).toBe(false);
    });
  });

  describe('end', () => {
    it('should call pilot.end with the given shouldSaveInCache', async () => {
      await detoxPilot.end(true);
      expect(mockPilotInstance.end).toHaveBeenCalledWith(true);
    });

    it('should throw an error if pilot is not initialized', async () => {
      const uninitializedPilot = new DetoxPilot();
      expect(() => uninitializedPilot.end()).toThrow('DetoxPilot is not initialized');
    });
  });
});

describe('DetoxPilot with missing dependencies', () => {
  let DetoxPilot;

  beforeEach(() => {
    jest.resetAllMocks();

    jest.doMock('@wix-pilot/core', () => {
      throw new Error('Cannot find module \'@wix-pilot/core\'');
    });

    jest.doMock('@wix-pilot/detox', () => {
      throw new Error('Cannot find module \'@wix-pilot/detox\'');
    });

    // require the module again after the mocks have been set
    DetoxPilot = require('./DetoxPilot');
  });

  it('should return false when checking if it is initialized', () => {
    const detoxPilot = new DetoxPilot();
    expect(detoxPilot.isInitialized()).toBe(false);
  });

  describe('init with missing dependencies', () => {
    it('should throw a descriptive error when @wix-pilot/core is not installed', () => {
      const detoxPilot = new DetoxPilot();
      const mockPromptHandler = jest.fn();

      // Override mock to make only the detox-driver module missing
      jest.doMock('@wix-pilot/detox', () => ({
        DetoxFrameworkDriver: jest.fn()
      }));

      expect(() => {
        detoxPilot.init(mockPromptHandler);
      }).toThrow('Failed to load @wix-pilot/core.Please install @wix-pilot/core as it\'s a peer dependency: npm install --save-dev @wix-pilot/core');
    });

    it('should throw a descriptive error when @wix-pilot/detox is not installed', () => {
      const detoxPilot = new DetoxPilot();
      const mockPromptHandler = jest.fn();

      // Override mock to make only the core module missing
      jest.doMock('@wix-pilot/core', () => ({
        Pilot: jest.fn()
      }));

      expect(() => {
        detoxPilot.init(mockPromptHandler);
      }).toThrow('Failed to load @wix-pilot/detox.Please install @wix-pilot/detox as it\'s a peer dependency: npm install --save-dev @wix-pilot/detox');
    });
  });
});
