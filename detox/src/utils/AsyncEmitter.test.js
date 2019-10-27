const AsyncEmitter = require('./AsyncEmitter');
const noop = () => {};
const sleep = require('./sleep');

describe('AsyncEmitter', () => {
  const REGISTERED_EVENT = 'aRegisteredEvent';
  const NOT_REGISTERED_EVENT = 'aNotRegisteredEvent';
  let emitter;

  beforeEach(() => {
    emitter = new AsyncEmitter({ events: [REGISTERED_EVENT], onError: noop });
  });

  describe('edge cases', () => {
    it('should fail to subscribe to non-registered events', () => {
      expect(() => emitter.on(NOT_REGISTERED_EVENT, () => {})).toThrowError(/subscribe to a non-existent/);
    });

    it('should fail to unsubscribe from non-registered events', () => {
      expect(() => emitter.off(NOT_REGISTERED_EVENT, () => {})).toThrowError(/unsubscribe from a non-existent/);
    });

    it('should not throw on attempt to remove a non-existent listener', () => {
      expect(() => emitter.off(REGISTERED_EVENT, () => {})).not.toThrow();
    });

    it('should not throw on attempt to emit event, when there are no listeners', () => {
      expect(() => emitter.emit(REGISTERED_EVENT, {})).not.toThrow();
    });
  });

  it('should wait for subscribers to finish #1', async () => {
    const listener = jest.fn().mockImplementation(() => new Promise(noop));

    emitter.on(REGISTERED_EVENT, listener);
    const emitPromise = emitter.emit(REGISTERED_EVENT, 100500);
    const timeoutPromise = sleep(0).then(() => 'timeout');

    const race = await Promise.race([emitPromise, timeoutPromise]);

    expect(listener).toHaveBeenCalledWith(100500);
    expect(race).toBe('timeout');
  });

  it('should wait for subscribers to finish #2', async () => {
    const listener1 = jest.fn().mockImplementation(async () => {});
    const listener2 = jest.fn().mockImplementation(async () => {});

    emitter.on(REGISTERED_EVENT, listener1);
    emitter.on(REGISTERED_EVENT, listener2);

    await emitter.emit(REGISTERED_EVENT, 42);
    expect(listener1).toHaveBeenCalledWith(42);
    expect(listener2).toHaveBeenCalledWith(42);
  });

  it('should not wait for unregistered listeners', async () => {
    const listener = jest.fn();

    emitter.on(REGISTERED_EVENT, listener);
    emitter.off(REGISTERED_EVENT, listener);

    await emitter.emit(REGISTERED_EVENT, {});
    expect(listener).not.toHaveBeenCalled();
  });

  it('should pass errors from listeners', async () => {
    const onError = jest.fn();
    const testError = new Error();

    emitter = new AsyncEmitter({ events: [REGISTERED_EVENT], onError });
    emitter.on(REGISTERED_EVENT, () => { throw testError; });
    await emitter.emit(REGISTERED_EVENT, 42);

    expect(onError).toHaveBeenCalledWith({
      error: testError,
      eventName: REGISTERED_EVENT,
      eventObj: 42,
    });
  });

  it('should unregister all listeners with .off()', async () => {
    const listener = jest.fn();

    emitter = new AsyncEmitter({ events: [REGISTERED_EVENT] });
    emitter.on(REGISTERED_EVENT, listener);
    emitter.off();
    await emitter.emit(REGISTERED_EVENT, 42);

    expect(listener).not.toHaveBeenCalled();
  });
});
