jest.mock('../logger/DetoxLogger');

describe('invocation call', () => {
  let logger;
  let traceInvocationCall;

  beforeEach(() => {
    logger = require('./logger');
    traceInvocationCall = require('./traceInvocationCall').bind(null, logger);
  });

  it('should trace it', async () => {
    const sectionName = 'section-name';
    const args = {
      cat: 'ws-client,ws-client-invocation',
      data: {
        foo: 'bar'
      },
      stack: expect.any(String)
    };

    const promise = Promise.resolve(42);
    const result = await traceInvocationCall(sectionName, { ...args.data }, promise);
    expect(result).toBe(42);
    expect(logger.trace.complete).toHaveBeenCalledWith(args, sectionName, promise);
  });
});
