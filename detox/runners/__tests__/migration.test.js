describe('file migration', () => {
  let logger;

  beforeEach(() => {
    logger = jest.fn();
    require('../migration')._log = logger;
  });

  test.each([
    ['environment'],
    ['index'],
    ['reporter'],
  ])('should work for: jest-circus/%s', (moduleName) => {
    const newImpl = require(`../jest/${moduleName}`);
    expect(logger).not.toHaveBeenCalled();
    expect(require(`../jest-circus/${moduleName}`)).toBe(newImpl);
    expect(logger.mock.calls[0][0]).toMatchSnapshot();
    expect(require(`../jest-circus/${moduleName}`)).toBe(newImpl);
    expect(logger).not.toHaveBeenCalledTimes(2);
  });
});
