describe('External allocation driver factory', () => {
  describe('validation', () => {
    const path = '../fake/module/path';

    let factoryClass;
    beforeEach(() => {
      factoryClass = require('./ExternalAllocDriverFactory');
    });

    describe('given no allocation-driver class', () => {
      it('should throw an error', () => {
        const module = {
          DeviceAllocationDriverClass: undefined,
          DeviceDeallocationDriverClass: undefined,
        };
        expect(() => factoryClass.validateModule(module, path)).toThrowErrorMatchingSnapshot();
      });
    });

    describe('given no deallocation-driver class', () => {
      it('should throw an error', () => {
        const module = {
          DeviceAllocationDriverClass: class {},
          DeviceDeallocationDriverClass: undefined,
        };

        expect(() => factoryClass.validateModule(module, path)).toThrowErrorMatchingSnapshot();
      });
    });

    describe('given all allocation driver classes', () => {
      it('should not throw an error', () => {
        const module = {
          DeviceAllocationDriverClass: class {},
          DeviceDeallocationDriverClass: class {},
        };
        factoryClass.validateModule(module, path);
      });
    });
  });
});
