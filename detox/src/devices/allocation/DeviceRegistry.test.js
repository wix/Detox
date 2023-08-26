const fs = require('fs-extra');
const tempfile = require('tempfile');

const DeviceRegistry = require('./DeviceRegistry');  // Adjust the path to your actual file

describe('DeviceRegistry', () => {
  const session1 = 'session1';

  let lockfilePath;
  let registry;

  beforeEach(() => {
    lockfilePath = tempfile('.test');
    registry = new DeviceRegistry({
      lockfilePath,
      sessionId: session1,
    });
  });

  afterEach(async () => {
    await fs.remove(lockfilePath);
  });

  it('should be initialized correctly', async () => {
    expect(registry.lockFilePath).toBe(lockfilePath);
    const sessionDevices = await registry.readSessionDevices();
    expect([...sessionDevices]).toEqual([]);
  });

  it('should register a device', async () => {
    const deviceId = 'device1';
    const registeredDeviceId = await registry.registerDevice(() => deviceId);
    expect(registeredDeviceId).toBe(deviceId); // Check if it returns the registered deviceId

    const sessionDevices = await registry.readSessionDevices();
    expect(sessionDevices.getIds()).toEqual([deviceId]);
  });

  it('should unregister a device', async () => {
    const deviceId = 'device1';
    await registry.registerDevice(() => deviceId);
    await registry.unregisterDevice(() => deviceId);
    const sessionDevices = await registry.readSessionDevices();
    expect(sessionDevices.getIds()).toEqual([]);
  });

  it('should reset the device registry', async () => {
    await registry.registerDevice(() => 'device1');
    await registry.reset();
    const devices = await registry.readSessionDevices();
    expect(devices.getIds()).toEqual([]);
  });

  describe('when there are multiple sessions', () => {
    const session2 = 'session2';
    let registry2;

    beforeEach(() => {
      registry2 = new DeviceRegistry({
        lockfilePath,
        sessionId: session2,
      });
    });

    it('should not see devices from other sessions', async () => {
      await registry.registerDevice(() => 'device1');
      await registry2.registerDevice(() => 'device2');
      const devices1 = await registry.readSessionDevices();
      const devices2 = await registry2.readSessionDevices();
      expect(devices1.getIds()).toEqual(['device1']);
      expect(devices2.getIds()).toEqual(['device2']);
    });

    it('should see taken devices from all sessions', async () => {
      expect.assertions(2);

      await registry.registerDevice(() => 'device1');
      await registry.registerDevice(() => 'device2');
      await registry.releaseDevice(() => 'device1');

      await registry2.registerDevice(() => 'device3');
      await registry2.registerDevice(() => 'device4');
      await registry2.releaseDevice(() => 'device3');

      let taken1, taken2;
      await registry.releaseDevice(() => {
        taken1 = registry.getTakenDevicesSync();
        expect(taken1.getIds().sort()).toEqual(['device2', 'device3', 'device4']);
      });

      await registry2.releaseDevice(() => {
        taken2 = registry2.getTakenDevicesSync();
        expect(taken2.getIds().sort()).toEqual(['device1', 'device2', 'device4']);
      });
    });

    it('should unregister only from the current session', async () => {
      expect.assertions(2);

      await registry.registerDevice(() => 'device1');
      await registry.registerDevice(() => 'device2');
      await registry2.registerDevice(() => 'device3');
      await registry2.registerDevice(() => 'device4');

      await registry.unregisterSessionDevices();
      const devices1 = await registry.readSessionDevices();
      const devices2 = await registry2.readSessionDevices();

      expect(devices1.getIds()).toEqual([]);
      expect(devices2.getIds()).toEqual(['device3', 'device4']);
    });
  });
});

