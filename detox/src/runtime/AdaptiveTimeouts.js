const defaultConfig = {
  baseTimeout: 60000,
  coldBootTimeout: 300000,
};

class AdaptiveTimeouts {
  constructor(userConfig, setTimeoutFn) {
    if (!setTimeoutFn) {
      setTimeoutFn = userConfig;
      userConfig = {};
    }

    const config = Object.assign({}, defaultConfig, userConfig);
    this._baseTimeout = config.baseTimeout;
    this._coldBootTimeout = config.coldBootTimeout;
    this._setTimeoutFn = setTimeoutFn;
    this._coldBooted = false;

    this._onColdBootDevice = this._onColdBootDevice.bind(this);
  }

  init(deviceEventsEmitter) {
    if (!deviceEventsEmitter) {
      throw new Error('AdaptiveTimeouts: cannot initialize without an events emitter');
    }
    deviceEventsEmitter.on('coldBootDevice', this._onColdBootDevice);
  }

  updateTimeout({baseTimeout = this._baseTimeout, coldBootTimeout = this._coldBootTimeout}) {
    this._baseTimeout = baseTimeout;
    this._coldBootTimeout = coldBootTimeout;

    const updatedTimeout = (this._coldBooted ? this._baseTimeout + this._coldBootTimeout : this._baseTimeout);
    this._setTimeoutFn(updatedTimeout);
  }

  _onColdBootDevice() {
    this._coldBooted = true;
    this._setTimeoutFn(this._baseTimeout + this._coldBootTimeout);
  }
}

module.exports = AdaptiveTimeouts;
