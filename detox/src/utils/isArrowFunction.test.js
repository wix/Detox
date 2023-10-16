const isArrowFunction = require('./isArrowFunction');

describe('isArrowFunction', () => {
  test.each([
    [() => {}, true],
    [x => x, true],
    [(x = () => {}) => x, true],
    [async()=>{}, true],
    [async x => x, true],
    [function*() { yield 42; }, false],
    [function(x = () => {}) { return x; }, false],
    [function() { return x => x; }, false],
  ])(`given %s should return %s`, (fn, expected) => {
    expect(isArrowFunction(fn.toString())).toBe(expected);
  });
});
