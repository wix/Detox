const onSignalExit = require('signal-exit');

const DetoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
const environment = require('../../../../../utils/environment');
const logger = require('../../../../../utils/logger').child({ __filename });
const AndroidDriver = require('../AndroidDriver');

const GenyDeviceRegistryFactory = require('./GenyDeviceRegistryFactory');
const GenyCloudExec = require('./exec/GenyCloudExec');
const InstanceLifecycleService = require('./services/GenyInstanceLifecycleService');

const cleanupLogData = {
  event: 'GENYCLOUD_TEARDOWN',
};

class GenyCloudDriver extends AndroidDriver {
  /**
   * @param deviceCookie { GenycloudEmulatorCookie }
   * @param config { Object }
   */
  constructor(deviceCookie, config) {
    super(deviceCookie, config);
  }

  getExternalId() {
    const { adbName } = this.cookie.instance;
    return adbName;
  }

  getDeviceName() {
    return this.cookie.instance.toString();
  }

  async installApp(_binaryPath, _testBinaryPath) {
    const { adbName } = this.cookie.instance;
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);
    await this.appInstallHelper.install(adbName, binaryPath, testBinaryPath);
  }

  async setLocation(lat, lon) {
    await this.invocationManager.execute(DetoxGenymotionManager.setLocation(parseFloat(lat), parseFloat(lon)));
  }

  // TODO ASDASD move to the allocation driver
  static async globalInit() {
    onSignalExit((code, signal) => {
      if (signal) {
        const deviceCleanupRegistry = GenyDeviceRegistryFactory.forGlobalShutdown();
        const { rawDevices  } = deviceCleanupRegistry.readRegisteredDevicesUNSAFE();
        const instanceHandles = rawDevicesToInstanceHandles(rawDevices);
        if (instanceHandles.length) {
          reportGlobalCleanupSummary(instanceHandles);
        }
      }
    });
  }

  static async globalCleanup() {
    const deviceCleanupRegistry = GenyDeviceRegistryFactory.forGlobalShutdown();
    const { rawDevices } = await deviceCleanupRegistry.readRegisteredDevices();
    const instanceHandles = rawDevicesToInstanceHandles(rawDevices);
    if (instanceHandles.length) {
      const exec = new GenyCloudExec(environment.getGmsaasPath());
      const instanceLifecycleService = new InstanceLifecycleService(exec, null);
      await doSafeCleanup(instanceLifecycleService, instanceHandles);
    }
  }
}

async function doSafeCleanup(instanceLifecycleService, instanceHandles) {
  logger.info(cleanupLogData, 'Initiating Genymotion cloud instances teardown...');

  const deletionLeaks = [];
  const killPromises = instanceHandles.map((instanceHandle) =>
    instanceLifecycleService.deleteInstance(instanceHandle.uuid)
      .catch((error) => deletionLeaks.push({ ...instanceHandle, error })));

  await Promise.all(killPromises);
  reportGlobalCleanupSummary(deletionLeaks);
}

function reportGlobalCleanupSummary(deletionLeaks) {
  if (deletionLeaks.length) {
    logger.warn(cleanupLogData, 'WARNING! Detected a Genymotion cloud instance leakage, for the following instances:');

    deletionLeaks.forEach(({ uuid, name, error }) => {
      logger.warn(cleanupLogData, [
        `Instance ${name} (${uuid})${error ? `: ${error}` : ''}`,
        `    Kill it by visiting https://cloud.geny.io/app/instance/${uuid}, or by running:`,
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
module.exports = GenyCloudDriver;
