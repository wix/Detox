/**
 * @typedef {import('../../../../common/drivers/android/cookies').AndroidDeviceCookie} AndroidDeviceCookie
 * @typedef {import('../../../../common/drivers/android/cookies').EmulatorDeviceCookie} EmulatorDeviceCookie
 * @typedef {import('../../../../common/drivers/android/tools/DeviceHandle')} DeviceHandle
 */

const _ = require('lodash');

const PIDService = require('../../../../../utils/PIDService');
const log = require('../../../../../utils/logger').child({ cat: 'device,device-allocation' });
const { isPortTaken } = require('../../../../../utils/netUtils');
const adbPortRegistry = require('../../../../common/drivers/android/AdbPortRegistry');
const AndroidAllocDriver = require('../AndroidAllocDriver');

const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');

const READY_ENTRY_STARTUP_GRACE_PERIOD_MS = 60 * 1000;

class EmulatorAllocDriver extends AndroidAllocDriver {
  /**
   * @param {object} options
   * @param {import('../../../../common/drivers/android/exec/ADB')} options.adb
   * @param {import('./AVDValidator')} options.avdValidator
   * @param {DetoxInternals.RuntimeConfig} options.detoxConfig
   * @param {import('../../../DeviceRegistry')} options.deviceRegistry
   * @param {DetoxInternals.SessionState} options.detoxSession
   * @param {import('./FreeEmulatorFinder')} options.freeDeviceFinder
   * @param {import('./FreePortFinder')} options.freePortFinder
   * @param {import('./EmulatorLauncher')} options.emulatorLauncher
   * @param {import('./EmulatorVersionResolver')} options.emulatorVersionResolver
   * @param {import('../../../../../utils/PIDService')} [options.pidService]
   */
  constructor({
    adb,
    avdValidator,
    detoxConfig,
    deviceRegistry,
    detoxSession,
    freeDeviceFinder,
    freePortFinder,
    emulatorVersionResolver,
    emulatorLauncher,
    pidService = new PIDService(),
  }) {
    super({ adb });
    this._avdValidator = avdValidator;
    this._deviceRegistry = deviceRegistry;
    this._sessionId = detoxSession.id;
    this._emulatorVersionResolver = emulatorVersionResolver;
    this._emulatorLauncher = emulatorLauncher;
    this._freeDeviceFinder = freeDeviceFinder;
    this._freePortFinder = freePortFinder;
    this._pidService = pidService;
    this._shouldShutdown = detoxConfig.behavior.cleanup.shutdownDevice;
    this._fixAvdConfigIniSkinNameIfNeeded = _.memoize(this._fixAvdConfigIniSkinNameIfNeeded.bind(this));
  }

  async init() {
    await this._deviceRegistry.unregisterZombieDevices();
    await this._getLiveAdbServerEntries();
  }

  /**
   * @param deviceConfig
   * @returns {Promise<EmulatorDeviceCookie>}
   */
  async allocate(deviceConfig) {
    const avdName = deviceConfig.device.avdName;
    const useSeparateAdbServers = deviceConfig.useSeparateAdbServers === true;

    await this._avdValidator.validate(avdName, deviceConfig.headless);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName, deviceConfig.headless);

    let adbServerPort;
    let adbName;

    await this._deviceRegistry.registerDevice(async () => {
      const candidates = await this._getAllDevices(useSeparateAdbServers);
      const device = await this._freeDeviceFinder.findFreeDevice(candidates, avdName);

      if (device) {
        adbName = device.adbName;
        adbServerPort = device.adbServerPort;
        await this._markAdbServerReady(adbName, adbServerPort);
      } else {
        const port = await this._freePortFinder.findFreePort();

        adbName = `emulator-${port}`;
        adbServerPort = await this._getFreeAdbServerPort(useSeparateAdbServers);
        await this._reserveAdbServerPort(adbName, adbServerPort);

        try {
          await this._emulatorLauncher.launch({
            bootArgs: deviceConfig.bootArgs,
            gpuMode: deviceConfig.gpuMode,
            headless: deviceConfig.headless,
            readonly: deviceConfig.readonly,
            avdName,
            adbName,
            port,
            adbServerPort,
          });
          await this._markAdbServerReady(adbName, adbServerPort);
        } catch (e) {
          await this._unregisterAdbServerPort(adbName);
          throw e;
        }
      }

      return adbName;
    });

    return {
      id: adbName,
      adbName,
      name: `${adbName} (${avdName})`,
      adbServerPort,
    };
  }

  /**
   * @param {AndroidDeviceCookie} deviceCookie
   * @param {{ deviceConfig: Detox.DetoxSharedAndroidDriverConfig }} configs
   * @returns {Promise<AndroidDeviceCookie>}
   */
  async postAllocate(deviceCookie, configs) {
    const { adbName } = deviceCookie;

    await this._emulatorLauncher.awaitEmulatorBoot(adbName);
    await this._adb.apiLevel(adbName);
    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.unlockScreen(adbName);
    await super.postAllocate(deviceCookie, configs);

    return deviceCookie;
  }

  /**
   * @param cookie {AndroidDeviceCookie}
   * @param options {Partial<import('../../AllocationDriverBase').DeallocOptions>}
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    const { adbName } = cookie;

    if (options.shutdown) {
      const didShutdown = await this._doShutdown(adbName);
      await this._deviceRegistry.unregisterDevice(adbName);

      if (didShutdown) {
        await this._unregisterAdbServerPort(adbName);
      }
    } else {
      await this._deviceRegistry.releaseDevice(adbName);
    }
  }

  async cleanup() {
    if (this._shouldShutdown) {
      const devices = await this._getAllDevices(true, { sessionId: this._sessionId });
      const actualEmulators = devices.map((device) => device.adbName);
      const sessionDevices = await this._deviceRegistry.readSessionDevices();
      const emulatorsToShutdown = _.intersection(sessionDevices.getIds(), actualEmulators);
      const shutdownPromises = emulatorsToShutdown.map(async (adbName) => {
        const didShutdown = await this._doShutdown(adbName);
        if (didShutdown) {
          await this._unregisterAdbServerPort(adbName);
        }
      });
      await Promise.all(shutdownPromises);
    }

    await this._deviceRegistry.unregisterSessionDevices();
  }

  /**
   * @param {string} adbName
   * @return {Promise<boolean>}
   */
  async _doShutdown(adbName) {
    try {
      await this._emulatorLauncher.shutdown(adbName);
      return true;
    } catch (err) {
      log.warn({ err }, `Failed to shutdown emulator ${adbName}`);
      return false;
    }
  }

  async _fixAvdConfigIniSkinNameIfNeeded(avdName, isHeadless) {
    const rawBinaryVersion = await this._emulatorVersionResolver.resolve(isHeadless);
    const binaryVersion = _.get(rawBinaryVersion, 'major');
    return await patchAvdSkinConfig(avdName, binaryVersion);
  }

  /**
   * @param {boolean} useSeparateAdbServers
   * @returns {Promise<DeviceHandle[]>}
   * @private
   */
  async _getAllDevices(useSeparateAdbServers, options = {}) {
    const adbServers = await this._getRunningAdbServers(useSeparateAdbServers, options);
    return (await this._adb.devices({}, adbServers)).devices;
  }

  /**
   * @param {boolean} useSeparateAdbServers
   * @returns {Promise<number[]>}
   * @private
   */
  async _getRunningAdbServers(useSeparateAdbServers = true, options = {}) {
    const ports = [this._adb.defaultServerPort];

    if (useSeparateAdbServers) {
      const customPorts = (await this._getReusableAdbServerEntries(options)).map(({ port }) => port);
      ports.push(...customPorts);
    }

    return _.uniq(ports);
  }

  async _getFreeAdbServerPort(useSeparateAdbServers) {
    if (!useSeparateAdbServers) {
      return this._adb.defaultServerPort;
    }

    const takenPorts = new Set((await this._getLiveAdbServerEntries()).map(({ port }) => port));

    for (let port = this._adb.defaultServerPort + 1; ; port++) {
      if (takenPorts.has(port)) {
        continue;
      }

      if (!(await isPortTaken(port))) {
        return port;
      }
    }
  }

  async _getReusableAdbServerEntries({ sessionId } = {}) {
    return (await this._getLiveAdbServerEntries({ sessionId })).filter((entry) => entry.state === 'ready');
  }

  async _getLiveAdbServerEntries({ sessionId } = {}) {
    const entries = await adbPortRegistry.entries();
    const validEntries = [];

    for (const entry of entries) {
      if (sessionId != null && entry.sessionId !== sessionId) {
        continue;
      }

      const ownerAlive = await this._isAdbEntryOwnedByLiveProcess(entry);

      if (entry.state === 'reserved') {
        if (!ownerAlive) {
          await adbPortRegistry.release(entry.adbName);
          continue;
        }

        // A live reservation is enough to block port reuse, even before the emulator
        // becomes visible via `adb devices`.
        validEntries.push(entry);
        continue;
      }

      const isReadyEntryInStartupGrace = this._isReadyEntryInStartupGracePeriod(entry);
      if (!(await isPortTaken(entry.port))) {
        if (ownerAlive && isReadyEntryInStartupGrace) {
          validEntries.push(entry);
        } else {
          await adbPortRegistry.release(entry.adbName);
        }
        continue;
      }

      try {
        const { devices } = await this._adb.devices({}, [entry.port]);
        if (devices.some((device) => device.adbName === entry.adbName)) {
          validEntries.push(entry);
          continue;
        }
      } catch (err) {
        // Ignore transient adb probing failures and keep the reservation owned by the live session.
        validEntries.push(entry);
        continue;
      }

      if (ownerAlive && isReadyEntryInStartupGrace) {
        validEntries.push(entry);
      } else {
        await adbPortRegistry.release(entry.adbName);
      }
    }

    return validEntries;
  }

  async _reserveAdbServerPort(adbName, adbServerPort) {
    if (adbServerPort !== this._adb.defaultServerPort) {
      await adbPortRegistry.reserve(adbName, {
        pid: this._pidService.getPid(),
        port: adbServerPort,
        sessionId: this._sessionId,
      });
    }
  }

  async _markAdbServerReady(adbName, adbServerPort) {
    if (adbServerPort !== this._adb.defaultServerPort) {
      await adbPortRegistry.markReady(adbName, {
        pid: this._pidService.getPid(),
        port: adbServerPort,
        sessionId: this._sessionId,
      });
    }
  }

  async _unregisterAdbServerPort(adbName) {
    await adbPortRegistry.release(adbName, { sessionId: this._sessionId });
  }

  async _isAdbEntryOwnedByLiveProcess(entry) {
    try {
      return this._pidService.isAlive(entry.pid);
    } catch (err) {
      log.warn({ err, entry }, 'Failed to validate owner process for adb server entry');
      return false;
    }
  }

  _isReadyEntryInStartupGracePeriod(entry) {
    return entry.state === 'ready' && Date.now() - entry.updatedAt < READY_ENTRY_STARTUP_GRACE_PERIOD_MS;
  }
}

module.exports = EmulatorAllocDriver;
