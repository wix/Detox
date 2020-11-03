const isValidWebsocketURL = require('./isValidWebsocketURL');

describe('isValidWebsocketURL', () => {
  it.each([
    [true, 'ws://localhost'],
    [true, 'wss://localhost:3428'],
    [false, 'http://localhost:3428'],
    [false, '3428'],
    [false, 3428],
    [false, null],
  ])('should return %j for %s', (expected, url) => {
    expect(isValidWebsocketURL(url)).toBe(expected);
  });
});
