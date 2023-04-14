// @ts-nocheck
const errors = require('../errors');

const wrapWithStackTraceCutter = require('./wrapWithStackTraceCutter');

describe('wrapWithStackTraceCutter', () => {
  it.each([
    ['DetoxError'],
    ['DetoxConfigError'],
    ['DetoxInternalError'],
    ['DetoxRuntimeError'],
  ])('should post-process known errors (e.g., %s)', async (errName) => {
    const ErrorClass = errors[errName];
    const obj = createThrowingObject(ErrorClass);

    /** @type {Error} */
    const anError = await obj.willThrow().catch(e => e);
    expect(anError).toBeInstanceOf(ErrorClass);
    expect(anError.stack).toMatch(/test error/);
    expect(anError.stack).toMatch(/^\s*at \S+ \(\S+\)$/m);
    expect(anError.stack).not.toBe(obj.originalErrorStack);
    expect(anError.stack).not.toContain('detox/src');
  });

  it.each([
    [Error],
  ])('should not post-process non-Detox errors (e.g., %s)', async (ErrorClass) => {
    const obj = createThrowingObject(ErrorClass);

    /** @type {Error} */
    const anError = await obj.willThrow().catch(e => e);
    expect(anError).toBeInstanceOf(ErrorClass);
    expect(anError.stack).toBe(obj.originalErrorStack);
    expect(anError.stack).toMatch(/detox[\\/]src/m);
  });

  it('should not much affect the original logic of wrapped methods', async () => {
    const obj = createThrowingObject(Error);
    await expect(obj.returns42()).resolves.toBe(42);
  });

  function createThrowingObject(ErrorClass) {
    const originalError = new ErrorClass('test error');
    const willThrow = () => { throw originalError; };
    const returns42 = () => 42;
    const result = { originalErrorStack: originalError.stack, willThrow, returns42 };
    wrapWithStackTraceCutter(result, ['willThrow', 'returns42']);

    return result;
  }
});
