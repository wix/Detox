const isPromise = require('./isPromise');

describe('isPromise', () => {
  it.each([
    [true, 'a new promise', new Promise(() => {})],
    [true, 'a resolved promise', Promise.resolve()],
    [false, 'a function', () => {}],
    [false, 'a promise-like object', { then: () => {}, catch: () => {}, finally: () => {} }],
    [false, 'undefined', undefined],
  ])('should return %j for %s', (expected, _comment, arg) => {
    expect(isPromise(arg)).toBe(expected);
  });
});
