class AdbDevicesHelper {
  constructor(adb) {
    this.adb = adb;
  }

  async lookupDevice(matchFn) {
    const { devices } = await this.adb.devices();
    for (const candidate of devices) {
      if (await matchFn(candidate)) {
        return candidate.adbName;
      }
    }
    return null;
  }
}

module.exports = AdbDevicesHelper;
