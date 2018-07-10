const { methodNameToSnakeCase } = require('../helpers');

describe('helpers', () => {
  describe('methodNameToSnakeCase', () => {
    it('should not fail with empty string', () => {
      expect(() => methodNameToSnakeCase('')).not.toThrow();
    });

    it('should return the correct snake case method name', () => {
      expect(methodNameToSnakeCase('actionForScrollInDirection:amount:xOriginStartPercentage:yOriginStartPercentage:')).toMatchSnapshot();
    });
  });
});
