// @ts-nocheck
describe('Instrumentation arguments', () => {
  const mockEncodeBase64Fn = (arg) => `base64Mocked(${arg})`;

  let uut;
  beforeEach(() => {
    let encoding;
    jest.mock('../../../../../utils/encoding');
    encoding = require('../../../../../utils/encoding');
    encoding.encodeBase64.mockImplementation(mockEncodeBase64Fn);

    uut = require('./instrumentationArgs');
  });

  it('should prepare arguments with no-args', () => {
    const result = uut.prepareInstrumentationArgs({});
    expect(result.args).toEqual([]);
  });

  it('should prepare arguments with base-64 encoding', () => {
    const args = {
      mockMe: 'this',
      andMockMe: 'that',
    };
    const expectedArgs = [
      ...expectedArgEncoded('mockMe', 'this'),
      ...expectedArgEncoded('andMockMe', 'that'),
    ];
    const result = uut.prepareInstrumentationArgs(args);
    expect(result.args).toEqual(expectedArgs);
  });

  it('should stringify non-string values', () => {
    const args = {
      'object-arg': {
        such: 'wow',
        much: 'amaze',
        very: 111,
      },
      'string-arg': 'text, with commas-and-dashes,',
    };
    const expectedArgs = [
      ...expectedArgEncoded('object-arg', '{"such":"wow","much":"amaze","very":111}'),
      ...expectedArgEncoded('string-arg', 'text, with commas-and-dashes,'),
    ];
    const result = uut.prepareInstrumentationArgs(args);
    expect(result.args).toEqual(expectedArgs);
  });

  // Ref: https://developer.android.com/studio/test/command-line#AMOptionsSyntax
  it('should whitelist reserved instrumentation args with respect to base64 encoding', async () => {
    const args = {
      // Free arg
      'user-arg': 'merry christ-nukah',

      // Reserved instrumentation args
      'class': 'class-value',
      'package': 'package-value',
      'func': 'func-value',
      'unit': 'unit-value',
      'size': 'size-value',
      'perf': 'perf-value',
      'debug': 'debug-value',
      'log': 'log-value',
      'emma': 'emma-value',
      'coverageFile': 'coverageFile-value',
    };

    const result = uut.prepareInstrumentationArgs(args);
    expect(result.args).toEqual([
      ...expectedArgEncoded('user-arg', 'merry christ-nukah'),
      ...expectedArgUnencoded('class', 'class-value'),
      ...expectedArgUnencoded('package', 'package-value'),
      ...expectedArgUnencoded('func', 'func-value'),
      ...expectedArgUnencoded('unit', 'unit-value'),
      ...expectedArgUnencoded('size', 'size-value'),
      ...expectedArgUnencoded('perf', 'perf-value'),
      ...expectedArgUnencoded('debug', 'debug-value'),
      ...expectedArgUnencoded('log', 'log-value'),
      ...expectedArgUnencoded('emma', 'emma-value'),
      ...expectedArgUnencoded('coverageFile', 'coverageFile-value'),
    ]);
  });

  it('should collect and separately return reserved instrumentation args', async () => {
    const args = {
      'class': 'class-value',
      'package': 'package-value',
    };
    const result = uut.prepareInstrumentationArgs(args);
    expect(result.usedReservedArgs).toEqual(Object.keys(args));
  });

  it('should whitelist args with \'detox\' prefix with respect to base64 encoding', () => {
    const args = {
      mockMe: 'this',
      detoxMockMe: 'that',
    };
    const expectedArgs = [
      ...expectedArgEncoded('mockMe', 'this'),
      ...expectedArgUnencoded('detoxMockMe', 'that'),
    ];
    const result = uut.prepareInstrumentationArgs(args);
    expect(result.args).toEqual(expectedArgs);
  });

  const expectedArgEncoded = (key, value) => (['-e', key, mockEncodeBase64Fn(value)]);
  const expectedArgUnencoded = (key, value) => (['-e', key, value]);
});
