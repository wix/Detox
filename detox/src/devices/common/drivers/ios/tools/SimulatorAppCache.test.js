jest.mock('../../../../../utils/fsext');
jest.mock('../../../../../utils/environment');
jest.mock('../../../../../utils/logger');
jest.mock('../../../../../errors');
jest.mock('../../../../common/drivers/ios/tools/AppleSimUtils');

/** @type {*} */
const { getDetoxAppsCachePath } = require('../../../../../utils/environment');
/** @type {*} */
const AppleSimUtils = require('../../../../common/drivers/ios/tools/AppleSimUtils');

const SimulatorAppCache = require('./SimulatorAppCache');

describe('SimulatorAppCache', () => {
  let applesimutils;
  let appCache;
  let fse;

  const deviceId = 'test-device-123';
  const bundleId = 'com.test.app';
  const mockAppPath = '/mock/app/path';

  beforeEach(() => {
    applesimutils = new AppleSimUtils();
    applesimutils.uninstall.mockResolvedValue();
    applesimutils.install.mockResolvedValue();

    // Mock fsext functions
    fse = jest.requireMock('../../../../../utils/fsext');
    fse.ensureDir.mockResolvedValue();
    fse.copy.mockResolvedValue();
    fse.exists.mockResolvedValue(false);
    fse.remove.mockResolvedValue();

    appCache = new SimulatorAppCache({ applesimutils });
  });

  describe('constructor', () => {
    it('should use default cache path when rootDir not provided', () => {
      expect(appCache.rootDir).toBe(getDetoxAppsCachePath());
    });

    it('should use custom rootDir when provided', () => {
      const customPath = '/custom/cache/path';
      const customCache = new SimulatorAppCache({ applesimutils, rootDir: customPath });
      expect(customCache.rootDir).toBe(customPath);
    });
  });

  describe('pull', () => {
    beforeEach(() => {
      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);
    });

    it('should successfully pull app to cache', async () => {
      const result = await appCache.pull(deviceId, bundleId);

      expect(applesimutils.getAppContainer).toHaveBeenCalledWith(deviceId, bundleId);
      expect(fse.ensureDir).toHaveBeenCalled();
      expect(fse.copy).toHaveBeenCalledWith(mockAppPath, expect.stringContaining(`${bundleId}.app`));
      expect(result).toContain(`${bundleId}.app`);
    });

    it('should remove existing cache before copying', async () => {
      await appCache.pull(deviceId, bundleId);

      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(fse.copy).toHaveBeenCalled();
    });

    it('should throw error when app not found on device', async () => {
      applesimutils.getAppContainer.mockResolvedValue(null);

      await expect(appCache.pull(deviceId, bundleId)).rejects.toThrow(
        `App with bundle ID '${bundleId}' is not installed on this device (${deviceId})`
      );
    });
  });

  describe('push', () => {
    beforeEach(() => {
      fse.exists.mockResolvedValue(true);
    });

    it('should successfully push app from cache', async () => {
      await appCache.push(deviceId, bundleId);

      expect(fse.exists).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(applesimutils.uninstall).toHaveBeenCalledWith(deviceId, bundleId);
      expect(applesimutils.install).toHaveBeenCalledWith(deviceId, expect.stringContaining(`${bundleId}.app`));
    });

    it('should throw error when cache not found', async () => {
      fse.exists.mockResolvedValue(false);

      await expect(appCache.push(deviceId, bundleId)).rejects.toThrow(
        `No backup found for bundle ID '${bundleId}' on device ${deviceId}`
      );
    });
  });

  describe('exists', () => {
    it('should return true when app exists in cache', async () => {
      fse.exists.mockResolvedValue(true);

      const result = await appCache.exists(deviceId, bundleId);

      expect(fse.exists).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(result).toBe(true);
    });

    it('should return false when app does not exist in cache', async () => {
      fse.exists.mockResolvedValue(false);

      const result = await appCache.exists(deviceId, bundleId);

      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove app from cache when it exists', async () => {
      fse.exists.mockResolvedValue(true);

      await appCache.remove(deviceId, bundleId);

      expect(fse.exists).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
    });

    it('should not throw error when app does not exist', async () => {
      fse.exists.mockResolvedValue(false);

      await expect(appCache.remove(deviceId, bundleId)).resolves.not.toThrow();
    });

    it('should handle removal errors gracefully', async () => {
      fse.exists.mockResolvedValue(true);
      fse.remove.mockImplementation(() => {
        throw new Error('Removal failed');
      });

      await expect(appCache.remove(deviceId, bundleId)).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clean up entire device cache', async () => {
      fse.exists.mockResolvedValue(true);

      await appCache.cleanup(deviceId);

      expect(fse.exists).toHaveBeenCalledWith(expect.stringContaining(deviceId));
      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(deviceId));
    });

    it('should not throw error when device cache does not exist', async () => {
      fse.exists.mockResolvedValue(false);

      await expect(appCache.cleanup(deviceId)).resolves.not.toThrow();
    });

    it('should handle cleanup errors gracefully', async () => {
      fse.exists.mockResolvedValue(true);
      fse.remove.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      await expect(appCache.cleanup(deviceId)).resolves.not.toThrow();
    });
  });
});
