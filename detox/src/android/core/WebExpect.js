const invoke = require('../../invoke');
const { WebExistsAssertion, WebHasTextAssertion } = require('../actions/web');
const EspressoWebDetoxApi = require('../espressoapi/web/EspressoWebDetox');
const { WebAssertionInteraction } = require('../interactions/web');

class WebExpect {
  constructor(device) {
    this._device = device;
    this._notCondition = false;
  }

  get not() {
    this._notCondition = true;
    return this;
  }
}

class WebExpectElement extends WebExpect {
  constructor(device, webElement) {
    super(device);
    this._call = invoke.callDirectly(EspressoWebDetoxApi.expect(webElement._call.value));
  }

  async toHaveText(text) {
    return await new WebAssertionInteraction(this._device, new WebHasTextAssertion(this, text)).execute();
  }

  async toExist() {
    return await new WebAssertionInteraction(this._device, new WebExistsAssertion(this)).execute();
  }
}

module.exports = {
  WebExpect,
  WebExpectElement,
};
