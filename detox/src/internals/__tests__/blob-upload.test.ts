/**
 * The client half of the blob lane in isolation (spec 007): bundle
 * validation, the deterministic archive+hash recipe, and the
 * probe-then-upload protocol against a real loopback stub.
 */
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { describe, it, expect } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';

import { BlobLaneClient, archiveAppBundle, ensureBlobUploaded } from '../blob-upload';
import { startBlobLaneStub } from './helpers/blob-lane-stub';
import { makeAppBundleFixture } from './helpers/app-bundle-fixture';

describe('archiveAppBundle', () => {
  it('archives a real .app directory and hashes it DETERMINISTICALLY', async () => {
    const bundle = await makeAppBundleFixture();
    try {
      const first = await archiveAppBundle(bundle.appPath);
      const second = await archiveAppBundle(bundle.appPath);
      try {
        expect(first.hex).toMatch(/^[0-9a-f]{64}$/);
        // Same unchanged tree → same archive bytes → same hash. This is what
        // makes a returning build a hash check instead of a transfer.
        expect(second.hex).toBe(first.hex);
        expect(first.bytes).toBeGreaterThan(0);
      } finally {
        await first.dispose();
        await second.dispose();
      }
    } finally {
      await bundle.dispose();
    }
  });

  it('a changed tree is a different build — the hash moves', async () => {
    const bundle = await makeAppBundleFixture('Changing', 'v1');
    const other = await makeAppBundleFixture('Changing', 'v2');
    try {
      const first = await archiveAppBundle(bundle.appPath);
      const second = await archiveAppBundle(other.appPath);
      try {
        expect(second.hex).not.toBe(first.hex);
      } finally {
        await first.dispose();
        await second.dispose();
      }
    } finally {
      await bundle.dispose();
      await other.dispose();
    }
  });

  it('refuses anything that is not an existing .app directory, client-side (2011)', async () => {
    await expect(archiveAppBundle('/tmp/definitely-missing.app')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    await expect(archiveAppBundle('/tmp/not-a-bundle')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    const bundle = await makeAppBundleFixture();
    try {
      // A FILE ending in .app is still not a bundle directory.
      const file = `${bundle.appPath}/Info.plist`;
      await expect(archiveAppBundle(file)).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      });
    } finally {
      await bundle.dispose();
    }
  });

  /**
   * @issue DTX-3001
   * A pre-aborted signal is checked before any judgment about the path: the
   * caller already left, and "your path is wrong" must not displace their
   * reason for leaving.
   */
  it('a pre-aborted signal wins over every other judgment', async () => {
    const aborted = AbortSignal.abort(new Error('left already'));
    await expect(
      archiveAppBundle('/tmp/definitely-missing.app', { signal: aborted }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
  });
});

describe('ensureBlobUploaded', () => {
  it('probes first and uploads once; a returning build never re-uploads', async () => {
    const stub = await startBlobLaneStub();
    const bundle = await makeAppBundleFixture();
    try {
      const lane = new BlobLaneClient({
        url: stub.url,
        headers: { Authorization: 'Bearer test-token' },
      });
      const blob = await archiveAppBundle(bundle.appPath);
      try {
        const messages: string[] = [];
        await ensureBlobUploaded(lane, blob, { narrate: (m) => messages.push(m) });
        expect(stub.requests.map((r) => r.method)).toEqual(['HEAD', 'PUT']);
        // The lane carries the SAME credentials as the command channel.
        expect(stub.requests[0].authorization).toBe('Bearer test-token');
        expect(messages.join('\n')).toMatch(/upload/i);

        // Second time: the hash hit makes it one HEAD, no PUT.
        const secondMessages: string[] = [];
        await ensureBlobUploaded(lane, blob, { narrate: (m) => secondMessages.push(m) });
        expect(stub.requests.map((r) => r.method)).toEqual(['HEAD', 'PUT', 'HEAD']);
        expect(secondMessages.join('\n')).toMatch(/already/i);
      } finally {
        await blob.dispose();
      }
    } finally {
      await stub.close();
      await bundle.dispose();
    }
  });

  it('a vanished archive file fails the PUT typed — the request never hangs half-sent', async () => {
    const stub = await startBlobLaneStub();
    const bundle = await makeAppBundleFixture();
    try {
      const lane = new BlobLaneClient({ url: stub.url });
      const blob = await archiveAppBundle(bundle.appPath);
      // The temp archive dies between hash and upload (a parallel cleanup, a
      // tmp reaper): the body stream errors, and the failure surfaces typed.
      await blob.dispose();
      await expect(ensureBlobUploaded(lane, blob)).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
      });
    } finally {
      await stub.close();
      await bundle.dispose();
    }
  });

  it('an unreachable server is a typed transfer failure, not a raw socket error', async () => {
    const bundle = await makeAppBundleFixture();
    try {
      const blob = await archiveAppBundle(bundle.appPath);
      try {
        // Port 9 (discard) on loopback: nothing listens there.
        const lane = new BlobLaneClient({ url: 'ws://127.0.0.1:9' });
        await expect(ensureBlobUploaded(lane, blob)).rejects.toMatchObject({
          code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
        });
      } finally {
        await blob.dispose();
      }
    } finally {
      await bundle.dispose();
    }
  });

  it('a refused upload and a hostile probe status both surface typed (2016)', async () => {
    // A hand-rolled lane that 507s every PUT and 500s every HEAD, to pin the
    // client's reading of statuses outside the happy vocabulary.
    let headStatus = 404;
    const putStatus = 507;
    const server = createServer((req, res) => {
      req.resume();
      res.statusCode = req.method === 'HEAD' ? headStatus : putStatus;
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    const bundle = await makeAppBundleFixture();
    try {
      const lane = new BlobLaneClient({ url: `ws://127.0.0.1:${String(port)}` });
      const blob = await archiveAppBundle(bundle.appPath);
      try {
        await expect(ensureBlobUploaded(lane, blob)).rejects.toMatchObject({
          code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
          details: { reason: expect.stringContaining('507') },
        });
        headStatus = 500;
        await expect(ensureBlobUploaded(lane, blob)).rejects.toMatchObject({
          code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
          details: { reason: expect.stringContaining('500') },
        });
      } finally {
        await blob.dispose();
      }
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await bundle.dispose();
    }
  });
});
