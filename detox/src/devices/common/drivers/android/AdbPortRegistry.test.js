const fs = require('fs-extra');

const tempfile = require('../../../../utils/tempfile');

describe('AdbPortRegistry', () => {
  let AdbPortRegistry;
  let lockfilePath;
  let registry;

  beforeEach(() => {
    ({ AdbPortRegistry } = require('./AdbPortRegistry'));
    lockfilePath = tempfile('.test');
    registry = new AdbPortRegistry({ lockfilePath });
  });

  afterEach(async () => {
    await fs.remove(lockfilePath);
  });

  it('should reserve a device with owner metadata', async () => {
    await registry.reserve('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });

    expect(registry.getPort('emulator-5554')).toEqual(5038);
    await expect(registry.entries()).resolves.toEqual([
      expect.objectContaining({
        adbName: 'emulator-5554',
        pid: 101,
        port: 5038,
        sessionId: 'session-a',
        state: 'reserved',
      }),
    ]);
  });

  it('should mark an owned entry as ready', async () => {
    await registry.reserve('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });

    await registry.markReady('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });

    await expect(registry.entries()).resolves.toEqual([
      expect.objectContaining({
        adbName: 'emulator-5554',
        pid: 101,
        port: 5038,
        sessionId: 'session-a',
        state: 'ready',
      }),
    ]);
  });

  it('should transfer ownership when a different session marks an entry as ready', async () => {
    await registry.reserve('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });

    await registry.markReady('emulator-5554', { pid: 202, port: 5038, sessionId: 'session-b' });

    await expect(registry.entries()).resolves.toEqual([
      expect.objectContaining({
        adbName: 'emulator-5554',
        pid: 202,
        port: 5038,
        sessionId: 'session-b',
        state: 'ready',
      }),
    ]);
  });

  it('should persist entries across registry instances', async () => {
    await registry.reserve('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });

    const anotherRegistry = new AdbPortRegistry({ lockfilePath });
    await expect(anotherRegistry.entries()).resolves.toEqual([
      expect.objectContaining({
        adbName: 'emulator-5554',
        port: 5038,
        sessionId: 'session-a',
      }),
    ]);
  });

  it('should release only when ownership matches', async () => {
    await registry.reserve('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });

    await registry.release('emulator-5554', { sessionId: 'session-b' });
    expect(registry.getPort('emulator-5554')).toEqual(5038);

    await registry.release('emulator-5554', { sessionId: 'session-a' });
    expect(registry.getPort('emulator-5554')).toBeUndefined();
  });

  it('should release all devices for a session', async () => {
    await registry.reserve('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });
    await registry.reserve('emulator-5556', { pid: 102, port: 5039, sessionId: 'session-b' });

    await registry.releaseSession('session-a');

    await expect(registry.entries()).resolves.toEqual([
      expect.objectContaining({
        adbName: 'emulator-5556',
        sessionId: 'session-b',
      }),
    ]);
  });

  it('should reset the registry', async () => {
    await registry.reserve('emulator-5554', { pid: 101, port: 5038, sessionId: 'session-a' });

    await registry.reset();

    expect(registry.getPort('emulator-5554')).toBeUndefined();
    await expect(registry.entries()).resolves.toEqual([]);
  });
});
