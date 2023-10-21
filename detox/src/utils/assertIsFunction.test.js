const assertIsFunction = require('./assertIsFunction');

describe('assertIsFunction', function() {
  test.each([
    ['function() { return 42; }'],
    ['function(x) { return x; }'],
    ['function(x = () => {}) { return x; }'],
    ['function() { return x => x; }'],
    ['() => {}'],
    ['x => x'],
    ['(x = () => {}) => x'],
    ['function*() { yield 42; }'],
  ])(`given a valid function string %s should return it`, (fn) => {
    expect(assertIsFunction(fn)).toBe(fn);
  });

  test.each([
    ['function() { return 42; /* forgot to close the function'],
    ['x = () => {}'],
  ])(`given an invalid function string %s should throw`, (fn) => {
    expect(() => assertIsFunction(fn)).toThrow();
  });
});
