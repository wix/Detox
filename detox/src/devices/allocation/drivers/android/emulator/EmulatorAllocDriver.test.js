describe('EmulatorAllocDriver', () => {
  let EmulatorAllocDriver;
  let adbPortRegistry;
  let isPortTaken;
  let pidService;
  let adb;
  let avdValidator;
  let deviceRegistry;
  let freeDeviceFinder;
  let freePortFinder;
  let emulatorLauncher;
  let emulatorVersionResolver;
  let uut;

  beforeEach(() => {
    jest.resetModules();

    jest.doMock('../../../../../utils/netUtils', () => ({
      isPortTaken: jest.fn(),
    }));
    isPortTaken = require('../../../../../utils/netUtils').isPortTaken;
    isPortTaken.mockResolvedValue(false);

    jest.doMock('../../../../common/drivers/android/AdbPortRegistry', () => ({
      entries: jest.fn(),
      reserve: jest.fn(),
      markReady: jest.fn(),
      release: jest.fn(),
      releaseSession: jest.fn(),
      getPort: jest.fn(),
    }));
    adbPortRegistry = require('../../../../common/drivers/android/AdbPortRegistry');
    adbPortRegistry.entries.mockResolvedValue([]);

    jest.doMock('./patchAvdSkinConfig', () => ({
      patchAvdSkinConfig: jest.fn(),
    }));

    adb = {
      defaultServerPort: 5037,
      devices: jest.fn().mockResolvedValue({ devices: [] }),
    };

    avdValidator = {
      validate: jest.fn().mockResolvedValue(undefined),
    };

    deviceRegistry = {
      registerDevice: jest.fn(async (getDeviceId) => getDeviceId()),
      unregisterDevice: jest.fn().mockResolvedValue(undefined),
      releaseDevice: jest.fn().mockResolvedValue(undefined),
      readSessionDevices: jest.fn().mockResolvedValue({ getIds: () => [] }),
      unregisterSessionDevices: jest.fn().mockResolvedValue(undefined),
    };

    freeDeviceFinder = {
      findFreeDevice: jest.fn().mockResolvedValue(null),
    };

    freePortFinder = {
      findFreePort: jest.fn().mockResolvedValue(10000),
    };

    emulatorLauncher = {
      launch: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
    };

    emulatorVersionResolver = {
      resolve: jest.fn().mockResolvedValue({ major: 36 }),
    };

    pidService = {
      getPid: jest.fn().mockReturnValue(111),
      isAlive: jest.fn().mockReturnValue(true),
    };

    EmulatorAllocDriver = require('./EmulatorAllocDriver');
    uut = new EmulatorAllocDriver({
      adb,
      avdValidator,
      detoxConfig: {
        behavior: {
          cleanup: {
            shutdownDevice: true,
          },
        },
      },
      deviceRegistry,
      detoxSession: { id: 'session-a' },
      freeDeviceFinder,
      freePortFinder,
      emulatorLauncher,
      emulatorVersionResolver,
      pidService,
    });
  });

  it('should reuse an emulator registered on a custom adb server', async () => {
    const existingDevice = { adbName: 'emulator-5556', adbServerPort: 5038 };
    adbPortRegistry.entries.mockResolvedValue([{ adbName: 'emulator-5556', pid: 222, port: 5038, sessionId: 'session-b', state: 'ready' }]);
    pidService.isAlive.mockImplementation((pid) => pid === 111);
    isPortTaken.mockResolvedValue(true);
    adb.devices.mockImplementation(async (_options, ports = [5037]) => {
      if (JSON.stringify(ports) === JSON.stringify([5038])) {
        return { devices: [existingDevice] };
      }

      if (JSON.stringify(ports) === JSON.stringify([5037, 5038])) {
        return { devices: [existingDevice] };
      }

      return { devices: [] };
    });
    freeDeviceFinder.findFreeDevice.mockResolvedValue(existingDevice);

    const result = await uut.allocate({
      device: { avdName: 'Pixel_3a_API_36' },
      useSeparateAdbServers: true,
    });

    expect(adbPortRegistry.markReady).toHaveBeenCalledWith('emulator-5556', {
      pid: 111,
      port: 5038,
      sessionId: 'session-a',
    });
    expect(emulatorLauncher.launch).not.toHaveBeenCalled();
    expect(result.adbServerPort).toBe(5038);
  });

  it('should allocate a new adb server port while skipping registered and taken ports', async () => {
    adbPortRegistry.entries.mockResolvedValue([{ adbName: 'emulator-5556', pid: 111, port: 5038, sessionId: 'session-a', state: 'ready' }]);
    adb.devices.mockImplementation(async (_options, ports = [5037]) => {
      if (JSON.stringify(ports) === JSON.stringify([5038])) {
        return { devices: [{ adbName: 'emulator-5556', adbServerPort: 5038 }] };
      }

      if (JSON.stringify(ports) === JSON.stringify([5037, 5038])) {
        return { devices: [] };
      }

      return { devices: [] };
    });
    isPortTaken
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await uut.allocate({
      device: { avdName: 'Pixel_3a_API_36' },
      useSeparateAdbServers: true,
    });

    expect(emulatorLauncher.launch).toHaveBeenCalledWith(expect.objectContaining({
      adbName: 'emulator-10000',
      adbServerPort: 5040,
      port: 10000,
    }));
    expect(adbPortRegistry.reserve).toHaveBeenCalledWith('emulator-10000', {
      pid: 111,
      port: 5040,
      sessionId: 'session-a',
    });
    expect(adbPortRegistry.markReady).toHaveBeenCalledWith('emulator-10000', {
      pid: 111,
      port: 5040,
      sessionId: 'session-a',
    });
  });

  it('should unregister stale registry entries when their owner process is dead', async () => {
    adbPortRegistry.entries.mockResolvedValue([{ adbName: 'emulator-5556', pid: 222, port: 5038, sessionId: 'session-b', state: 'ready' }]);
    pidService.isAlive.mockImplementation((pid) => pid === 111);

    await expect(uut._getRunningAdbServers(true)).resolves.toEqual([5037]);
    expect(adbPortRegistry.release).toHaveBeenCalledWith('emulator-5556');
  });

  it('should keep ready entries reusable when their owner process is dead but the emulator is still reachable', async () => {
    const existingDevice = { adbName: 'emulator-5556', adbServerPort: 5038 };
    adbPortRegistry.entries.mockResolvedValue([{ adbName: 'emulator-5556', pid: 222, port: 5038, sessionId: 'session-b', state: 'ready' }]);
    pidService.isAlive.mockImplementation((pid) => pid === 111);
    isPortTaken.mockResolvedValue(true);
    adb.devices.mockImplementation(async (_options, ports = [5037]) => {
      if (JSON.stringify(ports) === JSON.stringify([5038])) {
        return { devices: [existingDevice] };
      }

      if (JSON.stringify(ports) === JSON.stringify([5037, 5038])) {
        return { devices: [existingDevice] };
      }

      return { devices: [] };
    });

    await expect(uut._getRunningAdbServers(true)).resolves.toEqual([5037, 5038]);
    expect(adbPortRegistry.release).not.toHaveBeenCalled();
  });

  it('should unregister stale ready entries when their port is gone after the startup grace period', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(61_000);
    adbPortRegistry.entries.mockResolvedValue([{
      adbName: 'emulator-5556',
      pid: 111,
      port: 5038,
      sessionId: 'session-b',
      state: 'ready',
      updatedAt: 0,
    }]);

    await expect(uut._getRunningAdbServers(true)).resolves.toEqual([5037]);
    expect(adbPortRegistry.release).toHaveBeenCalledWith('emulator-5556');
    nowSpy.mockRestore();
  });

  it('should unregister stale ready entries when adb no longer reports the expected device after the startup grace period', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(61_000);
    adbPortRegistry.entries.mockResolvedValue([{
      adbName: 'emulator-5556',
      pid: 111,
      port: 5038,
      sessionId: 'session-b',
      state: 'ready',
      updatedAt: 0,
    }]);
    isPortTaken.mockResolvedValue(true);
    adb.devices.mockResolvedValue({ devices: [] });

    await expect(uut._getRunningAdbServers(true)).resolves.toEqual([5037]);
    expect(adbPortRegistry.release).toHaveBeenCalledWith('emulator-5556');
    nowSpy.mockRestore();
  });

  it('should keep live reserved entries blocked but not reusable', async () => {
    adbPortRegistry.entries.mockResolvedValue([{ adbName: 'emulator-5556', pid: 111, port: 5038, sessionId: 'session-b', state: 'reserved' }]);

    await expect(uut._getRunningAdbServers(true)).resolves.toEqual([5037]);
    await expect(uut._getFreeAdbServerPort(true)).resolves.toEqual(5039);
    expect(adbPortRegistry.release).not.toHaveBeenCalled();
  });

  it('should rethrow launch failures and release the reserved adb server port', async () => {
    emulatorLauncher.launch.mockRejectedValue(new Error('launch failed'));

    await expect(uut.allocate({
      device: { avdName: 'Pixel_3a_API_36' },
      useSeparateAdbServers: true,
    })).rejects.toThrow('launch failed');

    expect(adbPortRegistry.reserve).toHaveBeenCalledWith('emulator-10000', {
      pid: 111,
      port: 5038,
      sessionId: 'session-a',
    });
    expect(adbPortRegistry.release).toHaveBeenCalledWith('emulator-10000', { sessionId: 'session-a' });
  });

  it('should cleanup only custom adb servers owned by the current session', async () => {
    adbPortRegistry.entries.mockResolvedValue([
      { adbName: 'emulator-5556', pid: 111, port: 5038, sessionId: 'session-a', state: 'ready' },
      { adbName: 'emulator-5558', pid: 111, port: 5039, sessionId: 'session-b', state: 'ready' },
    ]);
    adb.devices.mockImplementation(async (_options, ports = [5037]) => {
      if (JSON.stringify(ports) === JSON.stringify([5038])) {
        return { devices: [{ adbName: 'emulator-5556', adbServerPort: 5038 }] };
      }

      if (JSON.stringify(ports) === JSON.stringify([5037, 5038])) {
        return { devices: [{ adbName: 'emulator-5556', adbServerPort: 5038 }] };
      }

      return { devices: [] };
    });
    deviceRegistry.readSessionDevices.mockResolvedValue({
      getIds: () => ['emulator-5556'],
    });

    await uut.cleanup();

    expect(emulatorLauncher.shutdown).toHaveBeenCalledWith('emulator-5556');
    expect(adb.devices).not.toHaveBeenCalledWith({}, [5037, 5038, 5039]);
    expect(adbPortRegistry.release).toHaveBeenCalledWith('emulator-5556', { sessionId: 'session-a' });
    expect(adbPortRegistry.releaseSession).not.toHaveBeenCalled();
    expect(deviceRegistry.unregisterSessionDevices).toHaveBeenCalled();
  });

  it('should preserve custom adb server entries when cleanup does not shutdown devices', async () => {
    const noShutdownDriver = new EmulatorAllocDriver({
      adb,
      avdValidator,
      detoxConfig: {
        behavior: {
          cleanup: {
            shutdownDevice: false,
          },
        },
      },
      deviceRegistry,
      detoxSession: { id: 'session-a' },
      freeDeviceFinder,
      freePortFinder,
      emulatorLauncher,
      emulatorVersionResolver,
      pidService,
    });

    await noShutdownDriver.cleanup();

    expect(emulatorLauncher.shutdown).not.toHaveBeenCalled();
    expect(adbPortRegistry.release).not.toHaveBeenCalled();
    expect(adbPortRegistry.releaseSession).not.toHaveBeenCalled();
    expect(deviceRegistry.unregisterSessionDevices).toHaveBeenCalled();
  });
});
