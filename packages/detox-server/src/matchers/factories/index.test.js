describe('Matchers factories', () => {
  let factories;
  beforeEach(() => {
    factories = require('./index');
  });

  describe('External-module', () => {
    describe('given module with missing matchers class', () => {
      it('should throw an error', () => {
        const module = {
          ExpectClass: undefined,
        };
        expect(() => factories.External.validateModule(module, 'fake/path')).toThrowErrorMatchingSnapshot();
      });
    });

    describe('given proper module', () => {
      it('should not throw an error', () => {
        const module = {
          ExpectClass: class {},
        };
        factories.External.validateModule(module, 'fake/path');
      });
    });
  });
});
