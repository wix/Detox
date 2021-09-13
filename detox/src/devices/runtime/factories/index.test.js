describe('Runtime device factories', () => {
  let drivers;
  let factories;
  beforeEach(() => {
    jest.mock('../RuntimeDevice');
    jest.mock('./drivers');
    drivers = require('./drivers');

    factories = require('./index');
  });

  describe('external-module', () => {
    describe('validation', () => {
      const module = {
        fake: 'module',
      };
      const path = 'fake/path';

      it('should delegate to driver\'s validation', () => {
        factories.ExternalFactory.validateModule(module, path);
        expect(drivers.ExternalRuntimeDriverFactory.validateModule).toHaveBeenCalledWith(module, path);
      });
    });
  });
});
