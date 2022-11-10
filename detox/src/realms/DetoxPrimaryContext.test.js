describe('DetoxPrimaryContext', () => {
  /** @type {import('./DetoxPrimaryContext')} */
  let context;
  /** @type {import('./DetoxInternalsFacade')} */
  let facade;

  beforeEach(() => {
    const DetoxPrimaryContext = require('./DetoxPrimaryContext');
    context = new DetoxPrimaryContext();

    const DetoxInternalsFacade = require('./DetoxInternalsFacade');
    facade = new DetoxInternalsFacade(context);
  });

  describe('when not initialized', () => {
    it('should be inactive', () => {
      expect(facade.getStatus()).toBe('inactive');
    });

    it('should have a basic session with a random id (GUID)', () => {
      expect(facade.session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should have an empty config', () => {
      expect(facade.config).toEqual({});
    });

    it('should throw on attempt to get a worker', () => {
      expect(() => facade.worker.id).toThrowErrorMatchingSnapshot();
    });
  });
});
