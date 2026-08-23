import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

interface AllocateParams {
  device: { type: string };
}

interface InstallParams {
  udid: string;
  appPath: string;
}

interface AppOperationParams {
  udid: string;
  bundleId: string;
}

interface FreeParams {
  udid: string;
}

describe('device provisioning simulation', () => {
  it('runs full allocate → install → launch → terminate → free flow', async () => {
    const [driverCh, serverCh] = memoryChannel();
    const driver = Peer.create(driverCh);
    const server = Peer.create(serverCh);

    const serverState = { allocated: new Set<string>(), installed: new Map<string, string>() };

    server.onRequest({
      method: 'allocate',
      handler: async (params, ctx) => {
        const { device } = params as AllocateParams;
        ctx.progress({ stage: 'searching', device: device.type });
        ctx.progress({ stage: 'booting' });
        const udid = `UDID-${Date.now()}`;
        serverState.allocated.add(udid);
        return { udid };
      },
    });

    server.onRequest({
      method: 'install',
      handler: async (params) => {
        const { udid, appPath } = params as InstallParams;
        if (!serverState.allocated.has(udid)) throw new Error('Device not allocated');
        serverState.installed.set(udid, appPath);
        return { success: true };
      },
    });

    server.onRequest({
      method: 'launch',
      handler: async (params) => {
        const { udid, bundleId } = params as AppOperationParams;
        if (!serverState.allocated.has(udid)) throw new Error('Device not allocated');
        server.notify({ method: 'appConnected', params: { udid, bundleId } });
        return { pid: 12345 };
      },
    });

    server.onRequest({
      method: 'terminate',
      handler: async (params) => {
        const { udid, bundleId } = params as AppOperationParams;
        return { terminated: true, udid, bundleId };
      },
    });

    server.onRequest({
      method: 'free',
      handler: async (params) => {
        const { udid } = params as FreeParams;
        serverState.allocated.delete(udid);
        serverState.installed.delete(udid);
        return { freed: true };
      },
    });

    const receivedNotifications: Array<{ method: string; params: unknown }> = [];
    driver.onNotify({
      method: 'appConnected',
      handler: (params) => receivedNotifications.push({ method: 'appConnected', params }),
    });

    const progressEvents: unknown[] = [];
    const allocResult = await driver.request<{ udid: string }>({
      method: 'allocate',
      params: { device: { type: 'iPhone 14' } },
      onProgress: (v) => progressEvents.push(v),
    });

    expect(progressEvents).toEqual([
      { stage: 'searching', device: 'iPhone 14' },
      { stage: 'booting' },
    ]);
    expect(allocResult.udid).toMatch(/^UDID-/);

    const { udid } = allocResult;

    const installResult = await driver.request<{ success: boolean }>({
      method: 'install',
      params: { udid, appPath: '/path/to/app.app' },
    });
    expect(installResult.success).toBe(true);

    const launchResult = await driver.request<{ pid: number }>({
      method: 'launch',
      params: { udid, bundleId: 'com.example.app' },
    });
    expect(launchResult.pid).toBe(12345);
    expect(receivedNotifications).toEqual([
      { method: 'appConnected', params: { udid, bundleId: 'com.example.app' } },
    ]);

    const termResult = await driver.request<{ terminated: boolean }>({
      method: 'terminate',
      params: { udid, bundleId: 'com.example.app' },
    });
    expect(termResult.terminated).toBe(true);

    const freeResult = await driver.request<{ freed: boolean }>({
      method: 'free',
      params: { udid },
    });
    expect(freeResult.freed).toBe(true);
    expect(serverState.allocated.size).toBe(0);
  });
});
