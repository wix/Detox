const path = require('path');

const pathUtils = require('./pathUtils');

describe('pathUtils', () => {
  describe('toSimplePath', () => {
    test('when given a path inside the current working directory, should return a relative path', () => {
      const relativePath = path.join('example', 'test.js');
      const absolutePath = path.join(process.cwd(), relativePath);
      expect(pathUtils.toSimplePath(absolutePath)).toBe(relativePath);
    });

    test('when given a path outside the current working directory, should return it as-is', () => {
      const relativePath = path.join('example', 'test.js');
      const absolutePath = path.join(process.cwd(), relativePath);
      const otherCwd = path.join(process.cwd(), 'example2');

      expect(pathUtils.toSimplePath(absolutePath, otherCwd)).toBe(absolutePath);
    });
  });
});
