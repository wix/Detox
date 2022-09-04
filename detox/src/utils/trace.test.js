jest.mock('../logger/DetoxLogger');

describe('Trace util', () => {
  let trace;
  let traceCall;
  // @ts-ignore
  const logger = () => require('../logger/DetoxLogger').instances[0];

  beforeEach(() => {
    ({ trace, traceCall } = require('./trace'));
  });

  it('startSection -> logger.trace.begin(...)', () => {
    const event = {
      msg: 'event-name',
      args: { arg1: 'val1' },
    };

    trace.startSection(event.msg, event.args);
    expect(logger().trace.begin).toHaveBeenCalledWith(
      event.args,
      event.msg
    );
  });

  it('endSection -> logger.trace.end(...)', () => {
    const section = {
      msg: 'section-name',
      args: { arg1: 'val1' },
    };

    trace.endSection(section.msg, section.args);
    expect(logger().trace.end).toHaveBeenCalledWith(section.args);
  });

  it('should trace a successful function', async () => {
    const functionCall = () => 42;

    expect(traceCall('42-call', functionCall)).toBe(42);
    expect(logger().trace.complete).toHaveBeenCalledWith('42-call', functionCall);
  });
});
