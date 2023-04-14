const logger = require('../../utils/logger').child({ cat: 'device' });

const cleanupLogData = {
  event: 'GENYCLOUD_TEARDOWN',
};

class GenyGlobalLifecycleHandler {
  constructor({ deviceCleanupRegistry, instanceLifecycleService }) {
    /** @private */
    this._deviceCleanupRegistry = deviceCleanupRegistry;
    /** @private */
    this._instanceLifecycleService = instanceLifecycleService;
  }

  async globalInit() {}

  emergencyCleanup() {
    const { rawDevices } = this._deviceCleanupRegistry.readRegisteredDevicesUNSAFE();
    const instanceHandles = rawDevicesToInstanceHandles(rawDevices);
    if (instanceHandles.length) {
      reportGlobalCleanupSummary(instanceHandles);
    }
  }

  async globalCleanup() {
    const { rawDevices } = await this._deviceCleanupRegistry.readRegisteredDevices();
    const instanceHandles = rawDevicesToInstanceHandles(rawDevices);
    if (instanceHandles.length) {
      await doSafeCleanup(this._instanceLifecycleService, instanceHandles);
    }
  }
}

async function doSafeCleanup(instanceLifecycleService, instanceHandles) {
  logger.info(cleanupLogData, 'Initiating Genymotion SaaS instances teardown...');

  const deletionLeaks = [];
  const killPromises = instanceHandles.map((instanceHandle) =>
    instanceLifecycleService.deleteInstance(instanceHandle.uuid)
      .catch((error) => deletionLeaks.push({ ...instanceHandle, error })));

  await Promise.all(killPromises);
  reportGlobalCleanupSummary(deletionLeaks);
}

function reportGlobalCleanupSummary(deletionLeaks) {
  if (deletionLeaks.length) {
    logger.warn(cleanupLogData, 'WARNING! Detected a Genymotion SaaS instance leakage, for the following instances:');

    deletionLeaks.forEach(({ uuid, name, error }) => {
      logger.warn(cleanupLogData, [
        `Instance ${name} (${uuid})${error ? `: ${error}` : ''}`,
        `    Kill it by visiting https://cloud.geny.io/instance/${uuid}, or by running:`,
        `    gmsaas instances stop ${uuid}`,
      ].join('\n'));
    });

    logger.info(cleanupLogData, 'Instances teardown completed with warnings');
  } else {
    logger.info(cleanupLogData, 'Instances teardown completed successfully');
  }
}

function rawDevicesToInstanceHandles(rawDevices) {
  return rawDevices.map((rawDevice) => ({
    uuid: rawDevice.id,
    name: rawDevice.data.name,
  }));
}

module.exports = GenyGlobalLifecycleHandler;
