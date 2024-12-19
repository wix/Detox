const copilot = require('detox-copilot').default;

const DetoxCopilot = require('./DetoxCopilot');
const detoxCopilotFrameworkDriver = require('./detoxCopilotFrameworkDriver');

jest.mock('detox-copilot', () => ({
  default: {
    init: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(false),
    start: jest.fn(),
    end: jest.fn(),
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
    it.skip('should initialize copilot with correct parameters', () => {
      detoxCopilot.init(mockPromptHandler);

      expect(copilot.init).toHaveBeenCalledWith({
        frameworkDriver: detoxCopilotFrameworkDriver,
        promptHandler: mockPromptHandler,
      });
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
