const mapLongPressArguments = require('./mapLongPressArguments');
describe('mapLongPressArguments', () => {
  it('should return `{ point: { x: 1, y: 2 }, duration: 3 }` for `{ x: 1, y: 2 }, 3`', () => {
    expect(mapLongPressArguments({ x: 1, y: 2 }, 3)).toEqual({ point: { x: 1, y: 2 }, duration: 3 });
  });

  it('should return `{ point: { x: 1, y: 2 }, duration: null }` for `{ x: 1, y: 2 }`', () => {
    expect(mapLongPressArguments({ x: 1, y: 2 })).toEqual({ point: { x: 1, y: 2 }, duration: null });
  });

  it('should return `{ point: null, duration: 3 }` for `3`', () => {
    expect(mapLongPressArguments(3)).toEqual({ point: null, duration: 3 });
  });

  it('should return `{ point: null, duration: null }` for no arguments', () => {
    expect(mapLongPressArguments()).toEqual({ point: null, duration: null });
  });

  it('should throw for invalid point', () => {
    expect(() => mapLongPressArguments({ x: 1 })).toThrowError('point should be an object with x and y properties, but got {"x":1}');
  });

  it('should throw for invalid duration', () => {
    expect(() => mapLongPressArguments({ x: 1, y: 2 }, '3')).toThrowError('duration should be a number, but got 3 (string)');
  });
});
