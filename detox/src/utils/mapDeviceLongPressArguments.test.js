const mapDeviceLongPressArguments = require('./mapDeviceLongPressArguments');
describe('mapDeviceLongPressArguments', () => {
  it('should return `{ point: { x: 1, y: 2 }, duration: 3, shouldIgnoreStatusBar: false }` for `{ x: 1, y: 2 }, 3, false`', () => {
    expect(mapDeviceLongPressArguments({ x: 1, y: 2 }, 3, false)).toEqual({ point: { x: 1, y: 2 }, duration: 3, shouldIgnoreStatusBar: false });
  });

  it('should return `{ point: { x: 1, y: 2 }, duration: 3, shouldIgnoreStatusBar: null }` for `{ x: 1, y: 2 }, 3`', () => {
    expect(mapDeviceLongPressArguments({ x: 1, y: 2 }, 3)).toEqual({ point: { x: 1, y: 2 }, duration: 3, shouldIgnoreStatusBar: null });
  });

  it('should return `{ point: { x: 1, y: 2 }, duration: null, shouldIgnoreStatusBar: null }` for `{ x: 1, y: 2 }`', () => {
    expect(mapDeviceLongPressArguments({ x: 1, y: 2 })).toEqual({ point: { x: 1, y: 2 }, duration: null, shouldIgnoreStatusBar: null });
  });

  it('should return `{ point: null, duration: 2, shouldIgnoreStatusBar: true }` for `true`', () => {
    expect(mapDeviceLongPressArguments(2, true)).toEqual({ point: null, duration: 2, shouldIgnoreStatusBar: true });
  });

  it('should return `{ point: null, duration: 3, shouldIgnoreStatusBar: null }` for `3`', () => {
    expect(mapDeviceLongPressArguments(3)).toEqual({ point: null, duration: 3, shouldIgnoreStatusBar: null });
  });

  it('should return `{ point: null, duration: null, shouldIgnoreStatusBar: true }` for `true`', () => {
    expect(mapDeviceLongPressArguments(true)).toEqual({ point: null, duration: null, shouldIgnoreStatusBar: true });
  });

  it('should return `{ point: null, duration: null, shouldIgnoreStatusBar: null }` for no arguments', () => {
    expect(mapDeviceLongPressArguments()).toEqual({ point: null, duration: null, shouldIgnoreStatusBar: null });
  });

  it('should throw for invalid point', () => {
    expect(() => mapDeviceLongPressArguments({ x: 1 })).toThrowError('point should be an object with x and y properties, but got {"x":1}');
  });

  it('should throw for invalid duration', () => {
    expect(() => mapDeviceLongPressArguments({ x: 1, y: 2 }, '3')).toThrowError('duration should be a number, but got 3 (string)');
  });

  it('should throw for invalid shouldIgnoreStatusBar', () => {
    expect(() => mapDeviceLongPressArguments({ x: 1, y: 2 }, 3, 'true')).toThrowError('shouldIgnoreStatusBar should be a boolean, but got true (string)');
  });

  it('should return `{ point: { x: 1, y: 2 }, duration: null, shouldIgnoreStatusBar: true }` for `{ x: 1, y: 2 }, true`', () => {
    expect(mapDeviceLongPressArguments({ x: 1, y: 2 }, true))
    .toEqual({ point: { x: 1, y: 2 }, duration: null, shouldIgnoreStatusBar: true });
  });

  it('should return `{ point: { x: 1, y: 2 }, duration: null, shouldIgnoreStatusBar: false }` for `{ x: 1, y: 2 }, false`', () => {
    expect(mapDeviceLongPressArguments({ x: 1, y: 2 }, false))
    .toEqual({ point: { x: 1, y: 2 }, duration: null, shouldIgnoreStatusBar: false });
  });

  it('should throw when providing point, boolean, and extra argument', () => {
    expect(() => mapDeviceLongPressArguments({ x: 1, y: 2 }, true, 'extra'))
    .toThrowError();
  });

  it('should throw when providing duration, boolean, and extra argument', () => {
    expect(() => mapDeviceLongPressArguments(1000, true, 'extra'))
    .toThrowError();
  });
});
