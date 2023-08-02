const isValidHTTPUrl = require('./isValidHTTPUrl');

describe('isValidHTTPUrl', () => {
  it.each([
    [true, 'http://localhost'],
    [true, 'https://localhost:3428'],
    [false, 'ws://localhost:3428'],
    [false, '3428'],
    [false, 3428],
    [false, null],
  ])('should return %j for %s', (expected, url) => {
    expect(isValidHTTPUrl(url)).toBe(expected);
  });
});
