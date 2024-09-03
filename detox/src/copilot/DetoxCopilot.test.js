const copilot = require('detox-copilot').default;

const DetoxCopilot = require('./DetoxCopilot');
const detoxCopilotFrameworkDriver = require('./detoxCopilotFrameworkDriver');

jest.mock('detox-copilot', () => ({
  default: {
    init: jest.fn(),
    reset: jest.fn(),
    act: jest.fn(),
    assert: jest.fn(),
  },
}));

jest.mock('./detoxCopilotFrameworkDriver', () => ({}));

describe('DetoxCopilot', () => {
  let detoxCopilot;
  const mockPromptHandler = jest.fn();

  beforeEach(() => {
    detoxCopilot = new DetoxCopilot();
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize copilot with correct parameters', () => {
      detoxCopilot.init({ promptHandler: mockPromptHandler });

      expect(copilot.init).toHaveBeenCalledWith({
        frameworkDriver: detoxCopilotFrameworkDriver,
        promptHandler: mockPromptHandler,
      });
      expect(detoxCopilot.isInitialized).toBe(true);
    });
  });

  describe('resetIfNeeded', () => {
    it('should reset copilot if initialized', () => {
      detoxCopilot.isInitialized = true;
      detoxCopilot.resetIfNeeded();

      expect(copilot.reset).toHaveBeenCalled();
    });

    it('should not reset copilot if not initialized', () => {
      detoxCopilot.isInitialized = false;
      detoxCopilot.resetIfNeeded();

      expect(copilot.reset).not.toHaveBeenCalled();
    });
  });

  describe('act', () => {
    it('should call copilot.act with the given action', async () => {
      const action = 'test action';
      await detoxCopilot.act(action);

      expect(copilot.act).toHaveBeenCalledWith(action);
    });
  });

  describe('assert', () => {
    it('should call copilot.assert with the given assertion', async () => {
      const assertion = 'test assertion';
      await detoxCopilot.assert(assertion);

      expect(copilot.assert).toHaveBeenCalledWith(assertion);
    });
  });
});
