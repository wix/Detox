const FIELD_NAME_ID = 'id';
const FIELD_NAME_DATA = 'data';

class DeviceListReadonly {
  constructor(devices = []) {
    this._devices = devices;
    this._indices = new Map(devices.map(DeviceListReadonly._getId));
  }

  getIds() {
    return [...this._indices.keys()];
  }

  [Symbol.iterator]() {
    return this._devices[Symbol.iterator]();
  }

  /**
   * @param {string} deviceId
   * @returns {boolean}
   */
  includes(deviceId) {
    return this._indices.has(deviceId);
  }

  /**
   * @returns {[string, number]}
   */
  static _getId(device, index) {
    return [device[FIELD_NAME_ID], index];
  }
}

class DeviceList extends DeviceListReadonly {
  filter(predicate) {
    return new DeviceListReadonly(this._devices.filter(predicate));
  }

  add(deviceId, data) {
    if (this._indices.has(deviceId)) {
      const index = this._indices.get(deviceId);
      this._devices[index][FIELD_NAME_DATA] = data;
    } else {
      this._indices.set(deviceId, this._devices.push({
        [FIELD_NAME_ID]: deviceId,
        [FIELD_NAME_DATA]: data,
      }) - 1);
    }
  }

  delete(deviceId) {
    if (this._indices.has(deviceId)) {
      const index = this._indices.get(deviceId);
      this._devices.splice(index, 1);
      this._indices.delete(deviceId);
    }
  }
}

module.exports = DeviceList;
