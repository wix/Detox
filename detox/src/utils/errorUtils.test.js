const _ = require('lodash');

const errorUtils = require('./errorUtils');

describe('sliceErrorStack(error, fromIndex)', () => {
  it('should clean up error stack by N first lines containing at:', () => {
    function innerFunction() { throw new Error('Source Error'); }
    function outerFunction() { innerFunction(); }
    const slicer = at => (_line) => --at < 0;
    const error0 = errorUtils.filterErrorStack(_.attempt(outerFunction), slicer(0));
    const error2 = errorUtils.filterErrorStack(_.attempt(outerFunction), slicer(1));
    const error3 = errorUtils.filterErrorStack(_.attempt(outerFunction), slicer(2));
    expect(error0.stack).toMatch(/at innerFunction/);
    expect(error0.stack).toMatch(/at outerFunction/);
    expect(error2.stack).not.toMatch(/at innerFunction/);
    expect(error2.stack).toMatch(/at outerFunction/);
    expect(error3.stack).not.toMatch(/at innerFunction/);
    expect(error3.stack).not.toMatch(/at outerFunction/);
  });

  it('should not fail if an error stack is empty', () => {
    const err = new Error();
    delete err.stack;

    errorUtils.filterErrorStack(err, () => true);
    expect(err.stack).toBe('');
  });
});

describe('replaceErrorStack(source, target)', () => {
  it('should replace error stack in the target error using the source error', () => {
    function sourceFunction() { throw new Error('Source Error'); }
    function targetFunction() { throw new Error('Target Error'); }
    const source = _.attempt(sourceFunction);
    const target = _.attempt(targetFunction);
    expect(target.stack).toMatch(/Target Error/);
    expect(target.stack).toMatch(/at targetFunction/);
    expect(target.stack).not.toMatch(/at sourceFunction/);
    expect(errorUtils.replaceErrorStack(source, target)).toBe(target);
    expect(target.stack).toMatch(/Target Error/);
    expect(target.stack).toMatch(/at sourceFunction/);
    expect(target.stack).not.toMatch(/at targetFunction/);
  });

  it('should not ruin already malformed errors', () => {
    const err1 = new Error('Source');
    const err2 = new Error('Target');
    delete err1.stack;
    delete err2.stack;

    errorUtils.replaceErrorStack(err1, err2);
    expect(err2.stack).toBe('Target');
  });
});

describe('createErrorWithUserStack()', () => {
  it('should not have /detox/src/ lines in stack', () => {
    expect(new Error().stack).toMatch(/[\\/]detox[\\/]src[\\/]/m); // sanity assertion

    expect(errorUtils.createErrorWithUserStack()).not.toContain('/detox/src/'); // POSIX
    expect(errorUtils.createErrorWithUserStack()).not.toContain('\\detox\\src\\'); // WIN32
  });
});

describe('asError(err)', () => {
  it('should passthrough Error instances', () => {
    const err = new Error();
    expect(errorUtils.asError(err)).toBe(err);
  });

  it('should wrap non-Error with Error', () => {
    const err = 'non-Error';
    expect(errorUtils.asError(err)).toBeInstanceOf(Error);
    expect(errorUtils.asError(err).message).toBe(err);
  });
});
