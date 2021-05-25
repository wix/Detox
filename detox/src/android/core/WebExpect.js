const invoke = require('../../invoke');
const { WebExistsAssertion, WebHasTextAssertion } = require('../actions/web');
const EspressoWebDetoxApi = require('../espressoapi/web/EspressoWebDetox');
const { WebAssertionInteraction } = require('../interactions/web');

class WebExpect {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;
    this._notCondition = false;
  }

  get not() {
    this._notCondition = true;
    return this;
  }
}

class WebExpectElement extends WebExpect {
  constructor(invocationManager, webElement) {
    super(invocationManager);
    this._call = invoke.callDirectly(EspressoWebDetoxApi.expect(webElement._call.value));
  }

  async toHaveText(text) {
    return await new WebAssertionInteraction(this._invocationManager, new WebHasTextAssertion(this, text)).execute();
  }

  async toExist() {
    return await new WebAssertionInteraction(this._invocationManager, new WebExistsAssertion(this)).execute();
  }
}

module.exports = {
  WebExpect,
  WebExpectElement,
};
