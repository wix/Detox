const errors = require('../errors');

const cutStackTraces = require('./cutStackTraces');

describe('cutStackTraces', () => {
  it.each([
    ['DetoxError'],
    ['DetoxConfigError'],
    ['DetoxInternalError'],
    ['DetoxRuntimeError'],
  ])('should post-process known errors (e.g., %s)', async (errName) => {
    const AnError = errors[errName];
    const obj = createThrowingObject(AnError);

    /** @type {Error} */
    const anError = await obj.willThrow().catch(e => e);
    expect(anError).toBeInstanceOf(AnError);
    expect(anError.stack).not.toBe(obj.originalErrorStack);
    expect(anError.stack).not.toContain('detox/src');
  });

  it.each([
    [Error],
  ])('should not post-process non-Detox errors (e.g., %s)', async (AnError) => {
    const obj = createThrowingObject(AnError);

    /** @type {Error} */
    const anError = await obj.willThrow().catch(e => e);
    expect(anError).toBeInstanceOf(AnError);
    expect(anError.stack).toBe(obj.originalErrorStack);
    expect(anError.stack).toContain('detox/src');
  });

  it('should not much affect the original logic of wrapped methods', async () => {
    const obj = createThrowingObject(Error);
    await expect(obj.returns42()).resolves.toBe(42);
  });

  function createThrowingObject(AnError) {
    const originalError = new AnError('test error');
    const willThrow = () => { throw originalError; };
    const returns42 = () => 42;
    const result = { originalErrorStack: originalError.stack, willThrow, returns42 };
    cutStackTraces(result, ['willThrow', 'returns42']);

    return result;
  }
});
