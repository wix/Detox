const log = require('detox/src/utils/logger').child({ cat: 'device,device-allocation' });

const DEVICE_LOOKUP = { event: 'HARMONY_DEVICE_LOOKUP' };

class FreeHarmonyDeviceFinder {
  constructor(hdc, deviceRegistry) {
    this.hdc = hdc;
    this.deviceRegistry = deviceRegistry;
  }

  async findFreeDevice(deviceQuery) {
    const targets = await this.hdc.listTargets();
    const takenDevices = this.deviceRegistry.getTakenDevicesSync();

    for (const candidate of targets) {
      if (takenDevices.includes(candidate)) {
        log.debug(DEVICE_LOOKUP, `Device ${candidate} is already taken, skipping...`);
        continue;
      }
      if (deviceQuery && !new RegExp(deviceQuery).test(candidate)) {
        log.debug(DEVICE_LOOKUP, `Device ${candidate} does not match "${deviceQuery}"`);
        continue;
      }
      log.debug(DEVICE_LOOKUP, `Found a matching & free device ${candidate}`);
      return candidate;
    }
    return null;
  }
}

class HarmonyAttachedAllocDriver {
  constructor({ detoxSession }) {
    const HDC = require('./HDC');
    const DeviceRegistry = require('detox/src/devices/allocation/DeviceRegistry');

    this._hdc = new HDC();
    this._deviceRegistry = new DeviceRegistry({ sessionId: detoxSession.id });
    this._freeDeviceFinder = new FreeHarmonyDeviceFinder(this._hdc, this._deviceRegistry);
  }

  async init() {
    await this._deviceRegistry.unregisterZombieDevices();
  }

  async allocate(deviceConfig) {
    const hdcNameQuery = deviceConfig.device.hdcName;
    const hdcName = await this._deviceRegistry.registerDevice(
      () => this._freeDeviceFinder.findFreeDevice(hdcNameQuery),
    );

    if (!hdcName) {
      const DetoxRuntimeError = require('detox/src/errors/DetoxRuntimeError');
      throw new DetoxRuntimeError({
        message: `No free HarmonyOS device matching "${hdcNameQuery}". Run \`hdc list targets\` to verify connectivity.`,
      });
    }

    return { id: hdcName, hdcName, name: hdcName };
  }

  async free(cookie) {
    await this._deviceRegistry.unregisterDevice(cookie.hdcName);
  }
}

module.exports = HarmonyAttachedAllocDriver;
