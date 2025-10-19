const cp = require('child_process');

jest.mock('../../../../../utils/fsext');
jest.mock('../../../../../utils/logger');
jest.mock('../../../../common/drivers/ios/tools/AppleSimUtils');

/** @type {*} */
const { getDetoxAppsCachePath } = require('../../../../../utils/environment');
/** @type {*} */
const AppleSimUtils = require('../../../../common/drivers/ios/tools/AppleSimUtils');

describe('SimulatorAppCache', () => {
  let applesimutils;
  let appCache;
  let fse;
  let SimulatorAppCache;

  const deviceId = 'test-device-123';
  const bundleId = 'com.test.app';
  const mockAppPath = '/mock/app/path';

  beforeEach(() => {
    applesimutils = new AppleSimUtils();
    applesimutils.install.mockResolvedValue();

    // Mock fsext functions
    fse = jest.requireMock('../../../../../utils/fsext');
    fse.ensureDir.mockResolvedValue();
    fse.copy.mockResolvedValue();
    fse.remove.mockResolvedValue();

    SimulatorAppCache = require('./SimulatorAppCache');
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

  describe('add', () => {
    const binaryPath = '/path/to/app/binary.app';

    it('should successfully add app to cache from binary path', async () => {
      await appCache.add(deviceId, bundleId, binaryPath);

      expect(fse.ensureDir).toHaveBeenCalled();
      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(fse.copy).toHaveBeenCalledWith(binaryPath, expect.stringContaining(`${bundleId}.app`));
    });

    it('should remove existing cache before copying', async () => {
      await appCache.add(deviceId, bundleId, binaryPath);

      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(fse.copy).toHaveBeenCalledWith(binaryPath, expect.stringContaining(`${bundleId}.app`));
    });
  });

  describe('backup', () => {
    beforeEach(() => {
      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);
    });

    it('should successfully back up app to cache', async () => {
      await appCache.backup(deviceId, bundleId);

      expect(applesimutils.getAppContainer).toHaveBeenCalledWith(deviceId, bundleId);
      expect(fse.ensureDir).toHaveBeenCalled();
      expect(fse.copy).toHaveBeenCalledWith(mockAppPath, expect.stringContaining(`${bundleId}.app`));
    });

    it('should remove existing cache before copying', async () => {
      await appCache.backup(deviceId, bundleId);

      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(fse.copy).toHaveBeenCalled();
    });

    it('should throw error when app not found on device', async () => {
      applesimutils.getAppContainer.mockImplementation(async () => cp.execSync('node -e process.exitCode=1'));
      await expect(appCache.backup(deviceId, bundleId)).rejects.toMatchSnapshot();
    });
  });

  describe('restore', () => {
    it('should successfully restore app from cache', async () => {
      fse.exists.mockResolvedValue(true);

      await appCache.restore(deviceId, bundleId);

      expect(fse.exists).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
      expect(applesimutils.install).toHaveBeenCalledWith(deviceId, expect.stringContaining(`${bundleId}.app`));
    });

    it('should throw error when cache not found', async () => {
      fse.exists.mockResolvedValue(false);

      await expect(appCache.restore(deviceId, bundleId)).rejects.toMatchSnapshot();
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
      await appCache.remove(deviceId, bundleId);

      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(`${bundleId}.app`));
    });

    it('should handle removal errors gracefully', async () => {
      fse.remove.mockRejectedValue(new Error('Removal failed'));

      await expect(appCache.remove(deviceId, bundleId)).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clean up entire device cache', async () => {
      await appCache.cleanup(deviceId);

      expect(fse.remove).toHaveBeenCalledWith(expect.stringContaining(deviceId));
    });

    it('should handle cleanup errors gracefully', async () => {
      fse.remove.mockRejectedValue(new Error('Cleanup failed'));

      await expect(appCache.cleanup(deviceId)).resolves.not.toThrow();
    });
  });

  describe('cleanupOnce', () => {
    it('should clean up device cache on first call', async () => {
      await appCache.cleanupOnce(deviceId);

      expect(fse.remove).toHaveBeenCalled();
    });

    it('should not clean up device cache on subsequent calls', async () => {
      await appCache.cleanupOnce(deviceId);
      await appCache.cleanupOnce(deviceId);

      expect(fse.remove).toHaveBeenCalledTimes(1);
    });
  });
});
