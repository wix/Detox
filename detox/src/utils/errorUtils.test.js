const _ = require('lodash');

const errorUtils = require('./errorUtils');

describe('sliceErrorStack(error, fromIndex)', () => {
  it('should clean up error stack by N first lines containing at:', () => {
    function innerFunction() { throw new Error('Source Error'); }
    function outerFunction() { innerFunction(); }
    function attemptFunction() {
      try { outerFunction(); } catch (e) { console.error('err', e); return e; }
    }

    const slicer = at => (_line) => --at < 0;
    const error0 = errorUtils.filterErrorStack(attemptFunction(), slicer(1));
    const error2 = errorUtils.filterErrorStack(attemptFunction(), slicer(2));
    const error3 = errorUtils.filterErrorStack(attemptFunction(), slicer(3));
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

  function sourceFunction() { throw new Error('Source Error message'); }
  function targetFunction() { throw new Error('Target Error message'); }

  it('should return the target error', () => {
    const source = _.attempt(sourceFunction);
    const target = _.attempt(targetFunction);
    expect(errorUtils.replaceErrorStack(source, target)).toBe(target);
  });

  it('should replace error stack in the target error using the source error', () => {
    const source = _.attempt(sourceFunction);
    const target = _.attempt(targetFunction);

    errorUtils.replaceErrorStack(source, target);
    expect(target.stack).toMatch(/Target Error message/);
    expect(target.stack).toMatch(/at sourceFunction/);
    expect(target.stack).not.toMatch(/at targetFunction/);
  });

  it('should not trim down stack-frames from a (native) stack-trace reported as the message', () => {
    const nativeStacktrace = 'Target native error:\n  at native.stack.Class.method()';
    const source = _.attempt(sourceFunction);
    const target = new Error(nativeStacktrace);

    errorUtils.replaceErrorStack(source, target);
    expect(target.stack).toMatch(nativeStacktrace);
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
