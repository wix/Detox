describe('file migration', () => {
  let logger;

  beforeEach(() => {
    logger = jest.fn();
    require('../migration')._log = logger;
  });

  test.each([
    ['environment', 'testEnvironment'],
    ['index'],
    ['reporter'],
  ])('should work for: jest-circus/%s', (oldModuleName, newModuleName = oldModuleName) => {
    const newImpl = require(`../jest/${newModuleName}`);
    expect(logger).not.toHaveBeenCalled();
    expect(require(`../jest-circus/${oldModuleName}`)).toBe(newImpl);
    expect(logger.mock.calls[0][0]).toMatchSnapshot();
    expect(require(`../jest-circus/${oldModuleName}`)).toBe(newImpl);
    expect(logger).not.toHaveBeenCalledTimes(2);
  });
});
