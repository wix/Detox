import { describe, it, expect } from 'vitest';
import { Peer, memoryChannel } from '@detox-remote/core';

import { DetoxClientPeer } from './DetoxClientPeer';

/**
 * `DetoxClientPeer` is a typed façade over `Peer.createMethod` /
 * `createNotificationHandler` — every field is real wire behavior, not a
 * stub, so the useful test is "does the method name actually reach the
 * wire and the response actually come back", exercised over a real `Peer`
 * pair connected by an in-memory channel (no real socket).
 */
function makeClientAndServerPeers() {
  const [clientChannel, serverChannel] = memoryChannel();
  const client = new DetoxClientPeer({ peer: Peer.create(clientChannel) });
  const server = Peer.create(serverChannel);
  return { client, server };
}

describe('DetoxClientPeer', () => {
  it('wires allocateDevice to the "allocateDevice" RPC method, params in, result out', async () => {
    const { client, server } = makeClientAndServerPeers();
    let receivedMethod: string | undefined;
    let receivedParams: unknown;
    server.onRequest({
      method: 'allocateDevice',
      handler: async (params) => {
        receivedParams = params;
        receivedMethod = 'allocateDevice';
        return {
          allocationId: 'a1',
          name: 'iPhone 17',
          os: '17',
          state: 'booted',
          device: { udid: 'u1' },
        };
      },
    });

    const result = await client.allocateDevice({ type: 'ios.simulator' });

    expect(receivedMethod).toBe('allocateDevice');
    expect(receivedParams).toEqual({ type: 'ios.simulator' });
    expect(result).toEqual(expect.objectContaining({ allocationId: 'a1' }));
  });

  it('propagates a server-side error through the returned promise', async () => {
    const { client, server } = makeClientAndServerPeers();
    server.onRequest({
      method: 'bootDevice',
      handler: async () => {
        throw new Error('simulator is not bootable');
      },
    });

    await expect(client.bootDevice({ allocationId: 'a1' })).rejects.toThrow(
      'simulator is not bootable',
    );
  });

  it('wires onDeviceStateChanged as a handler for the "deviceStateChanged" notification', () => {
    const { client, server } = makeClientAndServerPeers();
    const received: unknown[] = [];
    client.onDeviceStateChanged((payload) => received.push(payload));

    server.notify({
      method: 'deviceStateChanged',
      params: { allocationId: 'a1', state: 'shutdown' },
    });

    expect(received).toEqual([{ allocationId: 'a1', state: 'shutdown' }]);
  });

  it('exposes every documented request as a callable, independently-addressed method', async () => {
    const { client, server } = makeClientAndServerPeers();
    const methodNames = [
      'allocateDevice',
      'bootDevice',
      'shutdownDevice',
      'releaseDevice',
      'installApp',
      'uninstallApp',
      'launchApp',
      'terminateApp',
      'setPermissions',
      'sendToHome',
      'openURL',
      'setLocation',
      'clearKeychain',
      'resetContentAndSettings',
      'takeScreenshot',
      'reverseTcpPort',
      'unreverseTcpPort',
      'setBiometricEnrollment',
      'matchFace',
      'unmatchFace',
      'matchFinger',
      'unmatchFinger',
      'setStatusBar',
      'resetStatusBar',
      'invoke',
      'reloadReactNative',
      'waitForBackground',
      'waitForActive',
      'foregroundApp',
      'shake',
      'setOrientation',
      'deliverPayload',
      'setSyncSettings',
      'currentStatus',
      'captureViewHierarchy',
      'generateViewHierarchyXml',
    ] as const;

    for (const name of methodNames) {
      server.onRequest({ method: name, handler: async () => ({ echoedFrom: name }) });
    }

    for (const name of methodNames) {
      const method = client[name] as (params: unknown) => Promise<unknown>;
      expect(typeof method).toBe('function');
      // Every field must be bound to ITS OWN method name, not a shared/last one.
      await expect(method({})).resolves.toEqual({ echoedFrom: name });
    }
  });
});
