const { DetoxRuntimeError } = require('../../../../../errors');
const Timer = require('../../../../../utils/Timer');
const logger = require('../../../../../utils/logger').child({ cat: 'device' });
const GenycloudEmulatorCookie = require('../../../../cookies/GenycloudEmulatorCookie');
const AllocationDriverBase = require('../../AllocationDriverBase');
const retry = require("../../../../../utils/retry");
// const symbols = require('../../../../../realms/symbols');
// const DeviceRegistry = require('../../../../DeviceRegistry');
// const GenyDeviceRegistryFactory = require('./GenyDeviceRegistryFactory');

class GenyAllocDriver extends AllocationDriverBase {
  /**
   * @param {object} options
   * @param {import('../../../../common/drivers/android/exec/ADB')} options.adb
   * @param {import('./GenyRecipeQuerying')} options.recipeQuerying
   * @param {import('./GenyInstanceAllocationHelper')} options.allocationHelper
   * @param {import('./GenyInstanceLauncher')} options.instanceLauncher
   */
  constructor({ adb, recipeQuerying, allocationHelper, instanceLauncher }) {
    super();

    this._adb = adb;
    this._recipeQuerying = recipeQuerying;
    this._instanceLauncher = instanceLauncher;
    this._instanceAllocationHelper = allocationHelper;
    this._launchInfo = {};
    this._busyInstances = new Set();
    this._freeInstances = new Set();
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<GenycloudEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    const deviceQuery = deviceConfig.device;
    const recipe = await this._recipeQuerying.getRecipeFromQuery(deviceQuery);
    this._assertRecipeIsDefined(deviceQuery, recipe);

    for (const instance of this._freeInstances) {
      const recipeMatches = instance.recipe.uuid === recipe.uuid;
      if (recipeMatches) {
        this._freeInstances.delete(instance);
        this._busyInstances.add(instance);
        return new GenycloudEmulatorCookie(instance);
      }
    }

    const instance = await this._instanceLifecycleService.createInstance(recipe.uuid);
    this._launchInfo[instance.uuid] = { isNew };
    return new GenycloudEmulatorCookie(instance);
  }

  /**
   * @param {GenycloudEmulatorCookie} cookie
   * @returns {Promise<void>}
   */
  async postAllocate(cookie) {
    const { instance } = cookie;
    const { isNew } = this._launchInfo[instance.uuid];
    const readyInstance = cookie.instance = await this._instanceLauncher.launch(instance, isNew);

    const { adbName } = readyInstance;
    await Timer.run(20000, 'waiting for device to respond', async () => {
      await this._adb.disableAndroidAnimations(adbName);
      await this._adb.setWiFiToggle(adbName, true);
      await this._adb.apiLevel(adbName);
    });
  }

  async _waitForInstanceBoot(instance) {
    if (instance.isOnline()) {
      return instance;
    }

    const options = {
      backoff: 'none',
      retries: 25,
      interval: 5000,
      initialSleep: 45000,
    };

    return await retry(options, async () => {
      const _instance = await this._instanceLookupService.getInstance(instance.uuid);
      if (!_instance.isOnline()) {
        throw new DetoxRuntimeError(`Timeout waiting for instance ${instance.uuid} to be ready`);
      }
      return _instance;
    });
  }

  async _adbConnectIfNeeded(instance) {
    if (!instance.isAdbConnected()) {
      instance = await this._instanceLifecycleService.adbConnectInstance(instance.uuid);
    }
    return instance;
  }
  /**
   * @param cookie { GenycloudEmulatorCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    const { instance } = cookie;

    await this._instanceAllocationHelper.deallocateDevice(instance.uuid);

    if (options.shutdown) {
      await this._instanceLauncher.shutdown(instance);
    }
  }

  _assertRecipeIsDefined(deviceQuery, recipe) {
    if (!recipe) {
      throw new DetoxRuntimeError({
        message: `No Genymotion-Cloud template found to match the configured lookup query: ${JSON.stringify(deviceQuery)}`,
        hint: `Revisit your detox configuration. Genymotion templates list is available at: https://cloud.geny.io/recipes#custom`,
      });
    }
  }
}

const GENYCLOUD_TEARDOWN = {
  event: 'GENYCLOUD_TEARDOWN',
};

class GenyGlobalLifecycleHandler {
  constructor({ deviceCleanupRegistry, instanceLifecycleService }) {
    /** @private */
    this._deviceCleanupRegistry = deviceCleanupRegistry;
    /** @private */
    this._instanceLifecycleService = instanceLifecycleService;
  }

  // TODO: distribute this logic to the drivers
  async globalInit() {
    // if (!this._behaviorConfig.init.keepLockFile) {
    //   return;
    // }
    //
    // const DeviceRegistry = require('../devices/DeviceRegistry');
    //
    // const deviceType = this[symbols.config].device.type;
    //
    // switch (deviceType) {
    //   case 'ios.none':
    //   case 'ios.simulator':
    //     await DeviceRegistry.forIOS().reset();
    //     break;
    //   case 'android.attached':
    //   case 'android.emulator':
    //   case 'android.genycloud':
    //     await DeviceRegistry.forAndroid().reset();
    //     break;
    // }
    //
    // if (deviceType === 'android.genycloud') {
    //   const GenyDeviceRegistryFactory = require('../devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
    //   await GenyDeviceRegistryFactory.forGlobalShutdown().reset();
    // }
  }

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
  logger.info(GENYCLOUD_TEARDOWN, 'Initiating Genymotion SaaS instances teardown...');

  const deletionLeaks = [];
  const killPromises = instanceHandles.map((instanceHandle) =>
    instanceLifecycleService.deleteInstance(instanceHandle.uuid)
      .catch((error) => deletionLeaks.push({ ...instanceHandle, error })));

  await Promise.all(killPromises);
  reportGlobalCleanupSummary(deletionLeaks);
}

function reportGlobalCleanupSummary(deletionLeaks) {
  if (deletionLeaks.length) {
    logger.warn(GENYCLOUD_TEARDOWN, 'WARNING! Detected a Genymotion SaaS instance leakage, for the following instances:');

    deletionLeaks.forEach(({ uuid, name, error }) => {
      logger.warn(GENYCLOUD_TEARDOWN, [
        `Instance ${name} (${uuid})${error ? `: ${error}` : ''}`,
        `    Kill it by visiting https://cloud.geny.io/instance/${uuid}, or by running:`,
        `    gmsaas instances stop ${uuid}`,
      ].join('\n'));
    });

    logger.info(GENYCLOUD_TEARDOWN, 'Instances teardown completed with warnings');
  } else {
    logger.info(GENYCLOUD_TEARDOWN, 'Instances teardown completed successfully');
  }
}

function rawDevicesToInstanceHandles(rawDevices) {
  return rawDevices.map((rawDevice) => ({
    uuid: rawDevice.id,
    name: rawDevice.data.name,
  }));
}

module.exports = GenyAllocDriver;
