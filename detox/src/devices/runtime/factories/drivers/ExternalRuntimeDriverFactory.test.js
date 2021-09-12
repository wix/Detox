describe('External runtime-driver factory', () => {
  describe('validation', () => {
    const path = '../fake/path';

    let factoryClass;
    beforeEach(() => {
      jest.mock('./RuntimeDriverFactoryBase');
      factoryClass = require('./ExternalRuntimeDriverFactory');
    });

    describe('given module with no runtime-driver class', () => {
      it('should throw an error', () => {
        const module = {
          RuntimeDriverClass: undefined,
        };
        expect(() => factoryClass.validateConfig(module, path)).toThrowErrorMatchingSnapshot();
      });
    });

    describe('given a valid module', () => {
      it('should not throw', () => {
        const module = {
          RuntimeDriverClass: class {},
        };
        factoryClass.validateConfig(module, path);
      });
    });
  });
});
