class WebInteraction {
  /**
   * @param device { RuntimeDevice }
   */
  constructor(device) {
    this._call = undefined;
    this._device = device;
  }

  async execute() {
    return this._device.selectedApp.invoke(this._call);
  }
}

class ActionInteraction extends WebInteraction {
  constructor(device, action) {
    super(device);
    this._call = action._call;
  }
}

class WebAssertionInteraction extends WebInteraction {
  constructor(device, assertion) {
    super(device);
    this._call = assertion._call;
  }
}

module.exports = {
  WebInteraction,
  ActionInteraction,
  WebAssertionInteraction,
};
