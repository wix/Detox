const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const AppStateResetShim = require('./AppStateResetShim');

describe('AppStateResetShim', () => {
  let applesimutils;
  let shim;
  let tempDir;

  beforeEach(() => {
    // Mock applesimutils
    applesimutils = {
      getAppContainer: jest.fn(),
      uninstall: jest.fn().mockResolvedValue(),
      install: jest.fn().mockResolvedValue(),
    };

    shim = new AppStateResetShim(applesimutils);
  });

  afterEach(async () => {
    // Clean up any temp directories created during tests
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('backupApp', () => {
    it('should create temp directory and backup app', async () => {
      const udid = 'test-udid';
      const bundleId = 'com.test.app';
      const mockAppPath = __dirname; // Use current directory as mock app path

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);

      const result = await shim.backupApp(udid, bundleId);

      expect(result).toContain('detox-apps-');
      expect(result).toContain(bundleId);
      expect(await fs.pathExists(result)).toBe(true);

      // Verify the backup was stored
      expect(shim.backedUpApps.get(bundleId)).toBe(result);
    });

    it('should reuse existing temp directory for multiple apps', async () => {
      const udid = 'test-udid';
      const bundleId1 = 'com.test.app1';
      const bundleId2 = 'com.test.app2';
      const mockAppPath = __dirname;

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);

      const result1 = await shim.backupApp(udid, bundleId1);
      const result2 = await shim.backupApp(udid, bundleId2);

      expect(path.dirname(result1)).toBe(path.dirname(result2));
      expect(shim.backedUpApps.size).toBe(2);
    });

    it('should throw error if app container not found', async () => {
      applesimutils.getAppContainer.mockResolvedValue(null);

      await expect(shim.backupApp('test-udid', 'com.test.app'))
        .rejects.toThrow('Could not find app container for bundle ID: com.test.app');
    });
  });

  describe('restoreApp', () => {
    it('should uninstall and reinstall app from backup', async () => {
      const udid = 'test-udid';
      const bundleId = 'com.test.app';
      const mockAppPath = __dirname;

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);

      // First backup the app
      await shim.backupApp(udid, bundleId);

      // Then restore it
      await shim.restoreApp(udid, bundleId);

      expect(applesimutils.uninstall).toHaveBeenCalledWith(udid, bundleId);
      expect(applesimutils.install).toHaveBeenCalledWith(udid, expect.any(String));
    });

    it('should throw error if no backup found', async () => {
      await expect(shim.restoreApp('test-udid', 'com.test.app'))
        .rejects.toThrow('No backup found for bundle ID: com.test.app');
    });
  });

  describe('resetMultipleApps', () => {
    it('should backup and restore multiple apps as a convenience method', async () => {
      const udid = 'test-udid';
      const bundleIds = ['com.app1', 'com.app2'];
      const mockAppPath = __dirname;

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);

      // Spy on the methods and disable their actual implementations
      const backupSpy = jest.spyOn(shim, 'backupApp').mockResolvedValue();
      const restoreSpy = jest.spyOn(shim, 'restoreApp').mockResolvedValue();
      const cleanupSpy = jest.spyOn(shim, 'cleanup').mockResolvedValue();

      await shim.resetMultipleApps(udid, bundleIds);

      expect(backupSpy).toHaveBeenCalledTimes(2);
      expect(backupSpy).toHaveBeenCalledWith(udid, 'com.app1');
      expect(backupSpy).toHaveBeenCalledWith(udid, 'com.app2');

      expect(restoreSpy).toHaveBeenCalledTimes(2);
      expect(restoreSpy).toHaveBeenCalledWith(udid, 'com.app1');
      expect(restoreSpy).toHaveBeenCalledWith(udid, 'com.app2');

      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      // Restore the original implementations
      backupSpy.mockRestore();
      restoreSpy.mockRestore();
      cleanupSpy.mockRestore();
    });

    it('should cleanup even if backup fails', async () => {
      const udid = 'test-udid';
      const bundleIds = ['com.app1'];
      const mockAppPath = __dirname;

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);

      // Mock backupApp to fail
      const backupSpy = jest.spyOn(shim, 'backupApp').mockRejectedValue(new Error('Backup failed'));
      const cleanupSpy = jest.spyOn(shim, 'cleanup').mockResolvedValue();

      await expect(shim.resetMultipleApps(udid, bundleIds)).rejects.toThrow('Backup failed');

      // Should still cleanup even after failure
      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      backupSpy.mockRestore();
      cleanupSpy.mockRestore();
    });

    it('should cleanup even if restore fails', async () => {
      const udid = 'test-udid';
      const bundleIds = ['com.app1'];
      const mockAppPath = __dirname;

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);

      // Mock backupApp to succeed but restoreApp to fail
      const backupSpy = jest.spyOn(shim, 'backupApp').mockResolvedValue();
      const restoreSpy = jest.spyOn(shim, 'restoreApp').mockRejectedValue(new Error('Restore failed'));
      const cleanupSpy = jest.spyOn(shim, 'cleanup').mockResolvedValue();

      await expect(shim.resetMultipleApps(udid, bundleIds)).rejects.toThrow('Restore failed');

      // Should still cleanup even after failure
      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      backupSpy.mockRestore();
      restoreSpy.mockRestore();
      cleanupSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should remove temp directory and clear backups', async () => {
      const udid = 'test-udid';
      const bundleId = 'com.test.app';
      const mockAppPath = __dirname;

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);

      // Create a backup
      await shim.backupApp(udid, bundleId);
      const tempDirPath = shim.tempDir;

      expect(await fs.pathExists(tempDirPath)).toBe(true);
      expect(shim.backedUpApps.size).toBe(1);

      // Clean up
      await shim.cleanup();

      expect(await fs.pathExists(tempDirPath)).toBe(false);
      expect(shim.tempDir).toBeNull();
      expect(shim.backedUpApps.size).toBe(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      // Mock fs.remove to throw an error
      const originalRemove = fs.remove;
      fs.remove = jest.fn().mockRejectedValue(new Error('Permission denied'));

      // Create a backup first
      const udid = 'test-udid';
      const bundleId = 'com.test.app';
      const mockAppPath = __dirname;

      applesimutils.getAppContainer.mockResolvedValue(mockAppPath);
      await shim.backupApp(udid, bundleId);

      // Cleanup should not throw
      await expect(shim.cleanup()).resolves.not.toThrow();

      // Restore original fs.remove
      fs.remove = originalRemove;
    });
  });
});
