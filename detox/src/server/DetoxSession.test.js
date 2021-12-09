// @ts-nocheck
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

  it('should be empty by default', () => {
    expect(session.isEmpty).toBe(true);
  });

  describe('when tester joins', () => {
    beforeEach(() => {
      session.tester = new DetoxConnection();
      session.notify();
    });

    test('.notify() should not send actions', () => {
      expect(session.tester.sendAction).not.toHaveBeenCalled();
    });

    it('should not be empty', () => {
      expect(session.isEmpty).toBe(false);
    });

    describe('and then app joins', () => {
      beforeEach(() => {
        session.app = new DetoxConnection();
        session.notify();
      });

      test('.notify() should send an action only to the tester', () => {
        expect(session.app.sendAction).not.toHaveBeenCalled();
        expect(session.tester.sendAction).toHaveBeenCalledWith({
          type: 'appConnected',
        });
      });

      test('.notify() should not send actions twice', () => {
        session.notify();
        expect(session.app.sendAction).not.toHaveBeenCalled();
        expect(session.tester.sendAction).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when app joins', () => {
    beforeEach(() => {
      session.app = new DetoxConnection();
      session.notify();
    });

    it('should not be empty', () => {
      expect(session.isEmpty).toBe(false);
    });

    test('should not send actions', () => {
      expect(session.app.sendAction).not.toHaveBeenCalled();
    });

    describe('and then tester joins', () => {
      beforeEach(() => {
        session.tester = new DetoxConnection();
        session.notify();
      });

      test('should not send action to anyone', () => {
        // because app has no logic to process it
        // and tester already knows it is joining the session

        expect(session.tester.sendAction).not.toHaveBeenCalled();
        expect(session.app.sendAction).not.toHaveBeenCalled();
      });
    });
  });

  describe('when both tester and app joined', () => {
    beforeEach(() => {
      session.tester = new DetoxConnection();
      session.app = new DetoxConnection();
      session.notify();
      session.tester.sendAction.mockReset();
      session.app.sendAction.mockReset();
    });

    it('.notify() should send action only to the app when the tester disconnects', () => {
      const { app, tester } = session;
      session.disconnect(tester);
      session.notify();

      expect(tester.sendAction).not.toHaveBeenCalled();
      expect(app.sendAction).toHaveBeenCalledWith({
        type: 'testerDisconnected',
        messageId: -1,
      });
    });

    it('.notify() should send action only to the tester when the app disconnects', () => {
      const { app, tester } = session;
      session.disconnect(app);
      session.notify();

      expect(app.sendAction).not.toHaveBeenCalled();
      expect(tester.sendAction).toHaveBeenCalledWith({
        type: 'appDisconnected'
      });
    });

    it('.notify() should not send action to anyone if both disconnect simulatenously', () => {
      const { app, tester } = session;
      session.app = null;
      session.tester = null;
      session.notify();
      expect(app.sendAction).not.toHaveBeenCalled();
      expect(tester.sendAction).not.toHaveBeenCalled();
      expect(session.isEmpty).toBe(true);
    });

    it('should be empty if both disconnect', () => {
      expect(session.isEmpty).toBe(false);
      session.app = null;
      expect(session.isEmpty).toBe(false);
      session.tester = null;
      expect(session.isEmpty).toBe(true);
    });
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

    it('should warn on (already) empty app deassignment', () => {
      session.app = null;
      expect(getWarning()).toMatchSnapshot();
    });

    it('should warn on non-empty tester assignment', () => {
      session.tester = new DetoxConnection();
      session.tester = new DetoxConnection();
      expect(getWarning()).toMatchSnapshot();
    });

    it('should warn on (already) empty tester deassignment', () => {
      session.tester = null;
      expect(getWarning()).toMatchSnapshot();
    });
  });

  function getWarning(index = 0) {
    return logger.error.mock.calls[index][0];
  }
});
