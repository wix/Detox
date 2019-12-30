describe('Adaptive runtime', () => {
  let deviceEventsEmitter;
  let setTimeoutCallback;

  let AdaptiveTimeouts;
  beforeEach(() => {
    const DeviceDriver = jest.genMockFromModule('../devices/drivers/DeviceDriverBase');
    deviceEventsEmitter = new DeviceDriver();

    setTimeoutCallback = jest.fn();

    AdaptiveTimeouts = require('./AdaptiveTimeouts');
  });

  const simulateColdBootEvent = () => {
    const internalHandler = deviceEventsEmitter.on.mock.calls[0][1];
    internalHandler();
  };

  const createUUT = () => {
    const adaptiveTimeouts = new AdaptiveTimeouts(setTimeoutCallback);
    adaptiveTimeouts.init(deviceEventsEmitter);
    return adaptiveTimeouts;
  };

  const createUUTWithConfig = (config) => {
    const adaptiveTimeouts = new AdaptiveTimeouts(config, setTimeoutCallback);
    adaptiveTimeouts.init(deviceEventsEmitter);
    return adaptiveTimeouts;
  };

  it('should register to cold-boot events upon init', () => {
    const adaptiveTimeouts = new AdaptiveTimeouts(jest.fn());
    adaptiveTimeouts.init(deviceEventsEmitter);
    expect(deviceEventsEmitter.on).toHaveBeenCalledWith('coldBootDevice', expect.any(Function));
  });

  it('should fail to init with no device events emitter', () => {
    const adaptiveTimeouts = new AdaptiveTimeouts(jest.fn());
    expect(() => adaptiveTimeouts.init()).toThrow(new Error('AdaptiveTimeouts: cannot initialize without an events emitter'));
  });

  it('should increment timeout given a cold-boot event', () => {
    const config = {
      baseTimeout: 1234,
      coldBootTimeout: 4321,
    };

    createUUTWithConfig(config);

    simulateColdBootEvent();
    expect(setTimeoutCallback).toHaveBeenCalledWith(5555);
  });

  it('should use a default timeouts config', () => {
    const defaultBaseTimeout = 60000;
    const expectedUpdatedTimeout = 300000 + defaultBaseTimeout;

    createUUT();

    simulateColdBootEvent();
    expect(setTimeoutCallback).toHaveBeenCalledWith(expectedUpdatedTimeout);
  });

  it('should update the timeouts as per user requests', async () => {
    const adaptiveTimeouts = createUUT();

    adaptiveTimeouts.updateTimeout({baseTimeout: 7777});

    expect(setTimeoutCallback).toHaveBeenCalledWith(7777);
  });

  it('should update timeouts correctly with in-effect device cold-boot', async () => {
    const config = {
      baseTimeout: 100,
      coldBootTimeout: 1000,
    };

    const adaptiveTimeouts = createUUTWithConfig(config);
    simulateColdBootEvent();

    adaptiveTimeouts.updateTimeout({baseTimeout: 200, coldBootTimeout: 2000});

    expect(setTimeoutCallback).toHaveBeenCalledWith(2200);
  });

  it('should use updated timeouts upon cold-boot', async () => {
    const config = {
      baseTimeout: 100,
      coldBootTimeout: 1000,
    };

    const adaptiveTimeouts = createUUTWithConfig(config);
    adaptiveTimeouts.updateTimeout({baseTimeout: 200, coldBootTimeout: 2000});

    setTimeoutCallback.mockReset();
    simulateColdBootEvent();

    expect(setTimeoutCallback).toHaveBeenCalledWith(2200);
  });

  it('should allow for partial timeouts update (no cold-boot value)', async () => {
    const config = {
      baseTimeout: 100,
      coldBootTimeout: 1000,
    };

    const adaptiveTimeouts = createUUTWithConfig(config);
    adaptiveTimeouts.updateTimeout({baseTimeout: 200});

    setTimeoutCallback.mockReset();
    simulateColdBootEvent();

    expect(setTimeoutCallback).toHaveBeenCalledWith(1200);
  });

  it('should allow for partial timeouts update (no base-timeout value)', async () => {
    const config = {
      baseTimeout: 100,
      coldBootTimeout: 1000,
    };

    const adaptiveTimeouts = createUUTWithConfig(config);
    adaptiveTimeouts.updateTimeout({coldBootTimeout: 2000});

    setTimeoutCallback.mockReset();
    simulateColdBootEvent();

    expect(setTimeoutCallback).toHaveBeenCalledWith(2100);
  });
});
