describe('DetoxSession', () => {
  /**
   * @type {typeof require('./DetoxSession')}
   */
  let DetoxSession;
  /**
   * @type {typeof require('./DetoxConnection')}
   */
  let DetoxConnection;
  /**
   * @type {DetoxSession}
   */
  let session;
  let logger;

  beforeEach(() => {
    jest.mock('../utils/logger');
    logger = require('../utils/logger');

    DetoxConnection = jest.genMockFromModule('./DetoxConnection');
    DetoxSession = require('./DetoxSession');
    session = new DetoxSession('aSession');
  });

  describe('edge cases', () => {
    it('should warn on .disconnect(null)', () => {
      session.disconnect(null);
      expect(getWarning()).toMatchSnapshot();
    });

    it('should warn on .disconnect(<unknown connection>)', () => {
      session.disconnect(new DetoxConnection());
      expect(getWarning()).toMatchSnapshot();
    });

    it('should warn on non-empty app assignment', () => {
      session.app = new DetoxConnection();
      session.app = new DetoxConnection();
      expect(getWarning()).toMatchSnapshot();
    });

    it('should warn on non-empty tester assignment', () => {
      session.tester = new DetoxConnection();
      session.tester = new DetoxConnection();
      expect(getWarning()).toMatchSnapshot();
    });
  });

  function getWarning(index = 0) {
    return logger.error.mock.calls[index][0];
  }
});
