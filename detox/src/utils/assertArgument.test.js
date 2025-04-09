const assertions = require('./assertArgument');
const { assertUndefined } = require('./assertArgument');

describe('assertEnum', () => {
  const { assertEnum } = assertions;

  it('should create an assertion function for enums', () => {
    const assertSpeed = assertEnum(['fast', 'slow']);

    expect(() => assertSpeed({ speed: 'fast' })).not.toThrow();
    expect(() => assertSpeed({ speed: 'slow' })).not.toThrow();
    expect(() => assertSpeed({ speed: 'medium' })).toThrowErrorMatchingSnapshot();
  });
});

describe('assertNormalized', () => {
  const { assertNormalized } = assertions;

  it.each([
    0,
    0.5,
    1,
    NaN
  ])('should pass for %d', (validNumber) => {
    expect(() => assertNormalized({ validNumber })).not.toThrow();
  });

  it.each([
    -0.5,
    1.01,
    Infinity,
    null,
    undefined,
    '0.5'
  ])('should throw for %j', (invalidNumber) => {
    expect(() => assertNormalized({ invalidNumber })).toThrowErrorMatchingSnapshot();
  });
});

describe('assertNumber', () => {
  const { assertNumber } = assertions;

  it.each([
    42,
    NaN,
    Infinity,
    -Infinity,
  ])('should pass for %d', (validNumber) => {
    expect(() => assertNumber({ validNumber })).not.toThrow();
  });

  it.each([
    '42',
    false,
  ])('should throw for %j', (invalidNumber) => {
    expect(() => assertNumber({ invalidNumber })).toThrowErrorMatchingSnapshot();
  });
});

describe('assertString', () => {
  const { assertString } = assertions;

  it.each([
    '',
    '123',
  ])('should pass for %d', (validString) => {
    expect(() => assertString({ validString })).not.toThrow();
  });

  it.each([
    123,
    undefined,
  ])('should throw for %j', (invalidString) => {
    expect(() => assertString({ invalidString })).toThrowErrorMatchingSnapshot();
  });
});

describe('assertDuration', () => {
  const { assertDuration } = assertions;

  it.each([
    42,
    NaN,
    Infinity,
    -Infinity,
  ])('should pass for %d', (validNumber) => {
    expect(() => assertDuration(validNumber)).not.toThrow();
  });

  it.each([
    '42',
    false,
  ])('should throw for %j', (invalidNumber) => {
    expect(() => assertDuration(invalidNumber)).toThrowErrorMatchingSnapshot();
  });
});

describe('assertPoint', () => {
  const { assertPoint } = assertions;

  it('should pass for valid point', () => {
    expect(() => assertPoint({ x: 0, y: 0 })).not.toThrow();
  });

  it.each([
    { x: 0 },
    { y: 0 },
    { x: '0', y: 0 },
    { x: 0, y: '0' },
  ])('should throw for %j', (invalidPoint) => {
    expect(() => assertPoint(invalidPoint)).toThrowErrorMatchingSnapshot();
  });
});

describe('assertUndefined', () => {
  it('should pass for undefined', () => {
    expect(() => assertUndefined(undefined)).not.toThrow();
  });

  it.each([
    'str',
    1,
    { key: 'val' }
  ])('should throw for %j', (definedValue) => {
    expect(() => assertUndefined(definedValue)).toThrowErrorMatchingSnapshot();
  });
});

describe('assertTraceDescription', () => {
  const { assertTraceDescription } = assertions;

  it.each([
    'str',
    1,
    { key: 'val' }
  ])('should return true for defined %j', (definedValue) => {
    expect(assertTraceDescription(definedValue)).toBe(true);
  });

  it('should throw for undefined', () => {
    expect(() => assertTraceDescription(undefined)).toThrowErrorMatchingSnapshot();
  });
});
