describe('Allocation driver factories', () => {
  let drivers;
  let factories;
  beforeEach(() => {
    jest.mock('./DeviceAllocatorFactoryBase', () => class {});

    jest.mock('./drivers');
    drivers = require('./drivers');

    factories = require('./index');
  });

  describe('External-module', () => {
    describe('validation', () => {
      const module = {
        fake: 'module',
      };
      const path = 'fake/path';

      it('should delegate to driver\'s validation', () => {
        factories.ExternalFactory.validateConfig(module, path);
        expect(drivers.ExternalAllocDriverFactory.validateModule).toHaveBeenCalledWith(module, path);
      });
    });
  });
});
