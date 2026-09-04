/**
 * Contract-adjacent log phrases: frozen 013 greps the connection log for
 * `allocateDevice — query` under the rpc, and `specs/helpers/relay.ts` finds
 * which node holds a device by its `allocateDevice — ready: <id>` line. A
 * rename dies here, in `yarn test`, not deep into an accept run.
 */
import { describe, it, expect, afterEach } from 'vitest';
import type { DeviceInfo, SimulatorOps } from '@detox-remote/driver-ios';

import { DetoxServerImpl } from '../DetoxServerImpl';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import type { ConnectionTrace } from '../ConnectionRecorder';
import { iosHost, type IosHost } from './_ios-harness';

/** The one ctx field the allocate handler needs here. */
interface TestCtx {
  onUndo?: (fn: () => void) => void;
}

type Handler<P, R> = (params: P, ctx: TestCtx) => Promise<R>;

const hosts: IosHost[] = [];
afterEach(async () => {
  for (const host of hosts.splice(0)) await host.close().catch(() => undefined);
});

describe('the log phrases the frozen suites and helpers grep', () => {
  it('an allocation narrates `allocateDevice — query` (frozen 013) and `allocateDevice — ready: <id>` (the relay helper)', async () => {
    const devices: DeviceInfo[] = [
      { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS', name: 'iOS 26.5' } } as DeviceInfo,
    ];
    const simulatorOps = {
      list: async () => devices,
      boot: async () => true,
      shutdown: async () => true,
    } as unknown as SimulatorOps;
    const host = iosHost(simulatorOps);
    hosts.push(host);

    const lines: string[] = [];
    const trace = { narrate: (_signal: unknown, _level: unknown, message: string) => lines.push(message) } as unknown as ConnectionTrace;
    let allocate!: Handler<{ type: string }, { allocationId: string }>;
    const peer = new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          if (prop === 'onAllocateDevice') return (handler: typeof allocate) => (allocate = handler);
          return () => {};
        },
      },
    ) as DetoxServerPeer;
    new DetoxServerImpl({ serverPeer: peer, driverHost: host.host, trace });

    await allocate({ type: 'ios.simulator' }, { onUndo: () => {} });
    expect(lines.some((line) => line.includes('allocateDevice — query'))).toBe(true);
    expect(lines.some((line) => line.includes('allocateDevice — ready: udid-1'))).toBe(true);
  });
});
