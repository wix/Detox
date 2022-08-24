jest.mock('../logger/DetoxLogger');

describe('Trace util', () => {
  let trace;
  let traceCall;
  // @ts-ignore
  const logger = () => require('../logger/DetoxLogger').instances[0];

  beforeEach(() => {
    ({ trace, traceCall } = require('./trace'));
  });

  it('should log { ph: B } event', () => {
    const event = {
      name: 'event-name',
      args: { arg1: 'val1' },
    };

    trace.startSection(event.name, event.args);
    expect(logger().trace).toHaveBeenCalledWith(
      expect.objectContaining({ arg1: 'val1', trace: traceShape({ ph: 'B' }) }),
      'event-name'
    );
  });

  it('should log { ph: E } event', () => {
    const section = {
      name: 'section-name',
      args: { arg1: 'val1' },
    };

    trace.startSection(section.name, section.args);
    trace.endSection(section.name, section.args);
    expect(logger().trace).toHaveBeenCalledWith(
      expect.objectContaining({ arg1: 'val1', trace: { ph: 'E', tid: expect.any(Number) } }),
      'end'
    );
  });

  describe('trace-call function', () => {
    it('should trace a successful function', async () => {
      const functionCall = () => 42;

      expect(traceCall('42-call', functionCall)).toBe(42);
      expect(logger().trace).toHaveBeenCalledWith(
        expect.objectContaining({ trace: traceShape({ ph: 'B' }) }),
        '42-call'
      );
      expect(logger().trace).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, trace: traceShape({ ph: 'E' }) }),
        'end'
      );
    });

    it('should trace a failed function call', async () => {
      const error = new Error('error mock');
      const functionCall = () => Promise.reject(error);

      await expect(traceCall('error-call', functionCall)).rejects.toThrowError(error);
      expect(logger().trace).toHaveBeenCalledWith(
        expect.objectContaining({ trace: traceShape({ ph: 'B' }) }),
        'error-call'
      );
      expect(logger().trace).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error, trace: traceShape({ ph: 'E' }) }),
        'end'
      );
    });
  });

  function traceShape({ ph = expect.any(String), tid = expect.any(Number) } = {}) {
    return expect.objectContaining({ ph, tid });
  }
});
