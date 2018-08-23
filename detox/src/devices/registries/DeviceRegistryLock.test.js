const fs = require('fs-extra');
const tempfile = require('tempfile');
const DeviceRegistryLock = require('./DeviceRegistryLock');
const sleep = require('../../utils/sleep');

describe('DeviceRegistryLock', () => {
  let lockFilePath;
  let lockRetryOptions;
  let registryLock;

  beforeEach(() => {
    lockFilePath = tempfile('.lock');
    lockRetryOptions = {
      interval: 100,
      retries: 1,
    };

    registryLock = new DeviceRegistryLock({ lockFilePath, lockRetryOptions });
  });

  afterEach(async () => {
    await registryLock.unlock();
    await fs.remove(lockFilePath);
  });

  it('should work with default dependencies too', async () => {
    registryLock = new DeviceRegistryLock();

    await registryLock.lock();
    expect(registryLock.busyDevices).toEqual(expect.any(Set));
    await registryLock.unlock();
  });

  describe('for the first time', () => {
    it('should create an empty "[]" lock file on lock', async () => {
      expect(await fs.exists(lockFilePath)).toBe(false);
      await registryLock.lock();

      expect(await fs.exists(lockFilePath)).toBe(true);
      expect(await fs.readFile(lockFilePath, 'utf-8')).toBe('[]');
    });

    describe('if the lock file already exists', () => {
      beforeEach(async () => fs.writeFile(lockFilePath, '["existing"]'));

      it('should read it, but should not overwrite it with a blank array', async () => {
        await registryLock.lock();

        expect(await fs.readFile(lockFilePath, 'utf-8')).toBe('["existing"]');
        expect(registryLock.busyDevices).toEqual(new Set(["existing"]));
      });
    });
  });

  describe('in unlocked state', () => {
    it('should throw exception on attempt to read .busyDevices', () => {
      expect(() => registryLock.busyDevices).toThrowErrorMatchingSnapshot();
    });
  });

  describe('in locked state', () => {
    beforeEach(async () => registryLock.lock());

    it('should return set of .busyDevices', () => {
      expect(registryLock.busyDevices).toEqual(new Set());
    });

    it('should write changes to .busyDevices set back to file on unlock', async () => {
      registryLock.busyDevices.add('UDID');
      await registryLock.unlock();
      expect(await fs.readFile(lockFilePath, 'utf-8')).toBe('["UDID"]');
    });

    describe('if locking it again', () => {
      describe('if there is a number of retries', () => {
        beforeEach(() => {
          lockRetryOptions.retries = 3;
        });

        it('should wait till .unlock() on attempt to .lock() again', async () => {
          const lockPromise = registryLock.lock();
          await sleep(50);
          await registryLock.unlock();
          await lockPromise;
        });
      });

      describe('if there are no retries', () => {
        it('should throw exception on timeout', async () => {
          await expect(registryLock.lock()).rejects.toThrowErrorMatchingSnapshot();
        });
      });
    });
  });
});

