import { instantiateMaybeClass } from './instantiateMaybeClass';

describe('instantiateMaybeClass', () => {
  it('should throw on non-functions', () => {
    expect(() => instantiateMaybeClass(42)).toThrow(TypeError);
  });

  it('should throw on bad constructors (Error)', () => {
    expect(() =>
      instantiateMaybeClass(
        class {
          constructor() {
            throw new Error('some error');
          }
        },
      ),
    ).toThrow(/some error/);
  });

  it('should throw on bad constructors (TypeError)', () => {
    expect(() =>
      instantiateMaybeClass(
        class {
          constructor() {
            throw new TypeError('whatever');
          }
        },
      ),
    ).toThrow(/whatever/);
  });

  it('should create instances of classes', () => {
    expect(
      instantiateMaybeClass(
        class {
          x = 1;
        },
      ),
    ).toEqual({ x: 1 });
  });

  it('should create instances of functions', () => {
    expect(instantiateMaybeClass(() => ({ x: 2 }))).toEqual({ x: 2 });
  });
});
