const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const log = require('../../../../utils/logger').child({ cat: 'device' });

class AppStateResetShim {
  constructor(applesimutils) {
    this.applesimutils = applesimutils;
    this.tempDir = null;
    this.backedUpApps = new Map(); // bundleId -> tempPath
  }

  async backupApp(udid, bundleId) {
    if (!this.tempDir) {
      this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'detox-apps-'));
    }

    const appContainerPath = await this.applesimutils.getAppContainer(udid, bundleId);
    if (!appContainerPath) {
      throw new DetoxRuntimeError(`Could not find app container for bundle ID: ${bundleId}`);
    }

    const tempAppPath = path.join(this.tempDir, `${bundleId}-${Date.now()}`);
    await fs.copy(appContainerPath, tempAppPath);
    this.backedUpApps.set(bundleId, tempAppPath);

    return tempAppPath;
  }

  async restoreApp(udid, bundleId) {
    const tempAppPath = this.backedUpApps.get(bundleId);
    if (!tempAppPath) {
      throw new DetoxRuntimeError(`No backup found for bundle ID: ${bundleId}`);
    }

    // Uninstall the current app
    await this.applesimutils.uninstall(udid, bundleId);

    // Reinstall from backup
    await this.applesimutils.install(udid, tempAppPath);
  }

  async cleanup() {
    if (this.tempDir) {
      try {
        await fs.remove(this.tempDir);
        this.tempDir = null;
        this.backedUpApps.clear();
      } catch (error) {
        log.warn(error, `Failed to clean up temporary app directory`);
      }
    }
  }

  async resetMultipleApps(udid, bundleIds) {
    try {
      for (const bundleId of bundleIds) {
        await this.backupApp(udid, bundleId);
      }

      for (const bundleId of bundleIds) {
        await this.restoreApp(udid, bundleId);
      }
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = AppStateResetShim;
