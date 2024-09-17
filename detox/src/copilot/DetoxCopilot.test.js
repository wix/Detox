const copilot = require('detox-copilot').default;

const DetoxCopilot = require('./DetoxCopilot');
const detoxCopilotFrameworkDriver = require('./detoxCopilotFrameworkDriver');

jest.mock('detox-copilot', () => ({
  default: {
    init: jest.fn(),
    reset: jest.fn(),
    perform: jest.fn(),
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
      detoxCopilot.init(mockPromptHandler);

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

  describe('perform', () => {
    it('should call copilot.perform with the given intent', async () => {
      const intent = 'test something';
      await detoxCopilot.perform(intent);

      expect(copilot.perform).toHaveBeenCalledWith(intent);
    });
  });
});
