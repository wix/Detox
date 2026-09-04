/**
 * Install-by-blob, the handler half (spec 007): wire validation of the
 * `blob` param, the absent-blob transfer failure that cues the client's one
 * transparent re-upload, and the happy path — a REAL store entry (zipped by
 * the same `ditto -c -k --keepParent` recipe the client uses) unpacked to a
 * fresh temp dir, installed, and disposed in all endings.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';

import { describe, it, expect, afterEach } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';
import type { InstallAppParams } from '@detox-remote/protocol';
import type { DeviceInfo } from '@detox-remote/driver-ios';

import { DetoxServerImpl } from '../DetoxServerImpl';
import { BlobStore } from '../BlobStore';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import { iosHost, type IosHost } from './_ios-harness';

/** Every driver host a test builds (spec 015): closed after each so its per-device gateways release. */
const blobHosts: IosHost[] = [];
afterEach(async () => {
  for (const host of blobHosts.splice(0)) await host.close().catch(() => undefined);
});
import type { SimulatorOps, InstallAppArgs } from '@detox-remote/driver-ios';

const run = promisify(execFile);

type UndoFn = () => void | Promise<void>;
interface HandlerCtx {
  signal?: AbortSignal;
  progress?: (value: unknown) => void;
  onUndo?: (fn: UndoFn) => void;
}
type Handler<P, R> = (params: P, ctx: HandlerCtx) => Promise<R>;

interface AllocateResponse {
  allocationId: string;
  device: { udid: string };
}

interface MakeServerOptions {
  blobStore?: BlobStore;
  install?: (args: InstallAppArgs) => Promise<void>;
}

interface MadeServer {
  allocate: Handler<AllocateRequest, AllocateResponse>;
  install: Handler<InstallAppParams, void>;
}

interface AllocateRequest {
  type: string;
}

/** The two handlers this file needs, captured off the registration Proxy. */
function makeServer(options: MakeServerOptions): MadeServer {
  const handlers = new Map<string, Handler<never, unknown>>();
  const peer = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop.startsWith('on')) {
          const key = prop[2].toLowerCase() + prop.slice(3);
          return (handler: Handler<never, unknown>) => handlers.set(key, handler);
        }
        return () => {};
      },
    },
  ) as DetoxServerPeer;
  const devices = [
    { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } },
  ] as DeviceInfo[];
  const simulatorOps = {
    list: async () => devices,
    boot: async () => true,
    shutdown: async () => true,
    terminate: async () => undefined,
    install: options.install ?? (async () => undefined),
    creatableDeviceType: async () => undefined,
    rawDevices: async () => [],
    deleteDevice: async () => undefined,
  } as unknown as SimulatorOps;
  const host = iosHost(simulatorOps);
  blobHosts.push(host);
  new DetoxServerImpl({
    serverPeer: peer,
    driverHost: host.host,
    blobStore: options.blobStore,
  });
  const call = <P, R>(key: string): Handler<P, R> => {
    return async (params, ctx) => {
      const handler = handlers.get(key);
      if (!handler) throw new Error(`${key} handler was never registered`);
      const undo: UndoFn[] = [];
      try {
        return (await handler(params as never, { ...ctx, onUndo: (fn) => undo.push(fn) })) as R;
      } catch (err) {
        for (let i = undo.length - 1; i >= 0; i--) {
          try {
            await undo[i]();
          } catch {
            /* reported by the peer in production, irrelevant here */
          }
        }
        throw err;
      }
    };
  };
  return {
    allocate: call<AllocateRequest, AllocateResponse>('allocateDevice'),
    install: call<InstallAppParams, void>('installApp'),
  };
}

/** A real zip of a real .app directory, stored into a real BlobStore. */
async function storeBundleBlob(store: BlobStore): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-blob-fixture-'));
  const appDir = path.join(dir, 'Fixture.app');
  await mkdir(appDir);
  await writeFile(path.join(appDir, 'Info.plist'), '<plist/>');
  await writeFile(path.join(appDir, 'Fixture'), 'binary');
  const zip = path.join(dir, 'app.zip');
  await run('ditto', ['-c', '-k', '--keepParent', appDir, zip]);
  const bytes = await readFile(zip);
  const hex = createHash('sha256').update(bytes).digest('hex');
  await store.put(hex, Readable.from([bytes]), bytes.length);
  return hex;
}

async function freshStore(): Promise<BlobStore> {
  return BlobStore.open({ root: await mkdtemp(path.join(tmpdir(), 'detox-blob-ibb-')) });
}

describe('installApp by blob — the handler half', () => {
  it.skipIf(process.platform !== 'darwin')(
    'unpacks the store entry to a temp dir, installs, and disposes the temp tree',
    async () => {
    const store = await freshStore();
    const hex = await storeBundleBlob(store);
    const installed: string[] = [];
    const { allocate, install } = makeServer({
      blobStore: store,
      install: async ({ appPath }) => {
        // The unpack tree must be alive AT install time…
        expect(existsSync(appPath)).toBe(true);
        expect(appPath.endsWith('.app')).toBe(true);
        // …and never the immutable store entry itself.
        expect(appPath).not.toBe(store.pathOf(hex));
        installed.push(appPath);
      },
    });
    const allocation = await allocate({ type: 'ios.simulator' }, {});
    await install(
      { allocationId: allocation.allocationId, blob: { algo: 'sha256', hex } },
      {},
    );
    expect(installed).toHaveLength(1);
    // …and disposed in all endings: gone after the handler.
    expect(existsSync(installed[0])).toBe(false);
    // The store entry survives — it was read, not consumed.
    expect(store.has(hex)).toBe(true);
    },
  );

  it('a blob the store does not hold answers DETOX_APP_TRANSFER_FAILED — the re-upload cue', async () => {
    const store = await freshStore();
    const { allocate, install } = makeServer({ blobStore: store });
    const allocation = await allocate({ type: 'ios.simulator' }, {});
    await expect(
      install(
        { allocationId: allocation.allocationId, blob: { algo: 'sha256', hex: '0'.repeat(64) } },
        {},
      ),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
    });
  });

  /**
   * @issue DTX-6104
   * The blob store is content-blind at admission — it holds junk under an
   * honest hash — so non-archive bytes are judged at unpack, not upload,
   * and answer the same `DETOX_APP_TRANSFER_FAILED` the URL form uses for
   * a broken transfer.
   */
  it('bytes that are not an installable archive are judged at INSTALL time, typed 2016', async () => {
    const store = await freshStore();
    const junk = Buffer.from('not a zip at all');
    const hex = createHash('sha256').update(junk).digest('hex');
    await store.put(hex, Readable.from([junk]), junk.length);
    const { allocate, install } = makeServer({ blobStore: store });
    const allocation = await allocate({ type: 'ios.simulator' }, {});
    await expect(
      install({ allocationId: allocation.allocationId, blob: { algo: 'sha256', hex } }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED });
    // The failed install never poisons the store: the bytes stay, honestly named.
    expect(store.has(hex)).toBe(true);
  });

  /**
   * @issue DTX-2015
   * `algo` exists so a second digest algorithm is a value on the wire,
   * never a new route: anything other than `sha256` — and a hex that
   * doesn't fit the digest shape — is the caller's typed mistake, not a
   * dispatch to code that doesn't exist yet.
   */
  it('refuses a foreign algo and a malformed hex as the caller\'s mistake (2011)', async () => {
    const store = await freshStore();
    const { allocate, install } = makeServer({ blobStore: store });
    const allocation = await allocate({ type: 'ios.simulator' }, {});
    // JSON `null` reads as "absent", answered typed — never a raw TypeError
    // off `null.algo`.
    await expect(
      install(
        { allocationId: allocation.allocationId, blob: null as never },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    await expect(
      install(
        { allocationId: allocation.allocationId, blob: { algo: 'md5', hex: '0'.repeat(64) } },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    await expect(
      install(
        { allocationId: allocation.allocationId, blob: { algo: 'sha256', hex: 'nope' } },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
  });

  /**
   * @issue DTX-6001
   * `blobStore` is optional on `DetoxServerImplDeps`, for the same reason as
   * `appGateway`: an embedder that did not start the store gets a typed
   * `DETOX_NOT_IMPLEMENTED` refusal from `installApp` by blob rather than a
   * server that pretends the lane exists.
   */
  it('a server with no store refuses typed, never pretends', async () => {
    const { allocate, install } = makeServer({});
    const allocation = await allocate({ type: 'ios.simulator' }, {});
    await expect(
      install(
        { allocationId: allocation.allocationId, blob: { algo: 'sha256', hex: '0'.repeat(64) } },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED });
  });
});
