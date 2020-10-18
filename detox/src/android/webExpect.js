const invoke = require('../invoke');
const DetoxWebActionsApi = require('./espressoapi/web/DetoxWebAtomAction');
const DetoxWebAssertionApi = require('./espressoapi/web/DetoxWebAssertion');
const EspressoWebDetoxApi = require('./espressoapi/web/EspressoWebDetox');
const DetoxWebMatcherApi = require('./espressoapi/web/DetoxWebAtomMatcher');
const {
  IdMatcher
} = require('./webMatcher');

function call(maybeAFunction) {
  return maybeAFunction instanceof Function ? maybeAFunction() : maybeAFunction;
}

class WebInteraction {
  constructor(invocationManager) {
    this._call = undefined;
    this._invocationManager = invocationManager;
  }

  async execute() {
    const resultObj = await this._invocationManager.execute(this._call);
    return resultObj ? resultObj.result : undefined;
  }
}

class ActionInteraction extends WebInteraction {
  constructor(invocationManager, element, action) {
    super(invocationManager);
    this._call = EspressoWebDetoxApi.perform(call(element._call), action._call);
  }
}

class WebAction {
}

class WebTapAction extends WebAction {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxWebActionsApi.click());
  }
}


class WebViewElement {
  constructor(invocationManager, emitter, matcher) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this._originalMatcher = matcher;
  }

   async _find(webViewMatcher) {
    if (webViewMatcher !== undefined) {
      this._call = invoke.call(invoke.EspressoWeb, 'onWebView', webViewMatcher._call);
    }
    this._call = invoke.call(invoke.EspressoWeb, 'onWebView');
  }

  element(webMatcher) {
    return new WebElement(this._invocationManager, this._emitter, webMatcher)
  }
}

class WebElement {
  constructor(invocationManager, emitter, matcher) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this._originalMatcher = matcher;

    this.element = this.element.bind(this);
  }

  element(webMatcher) {
    return new WebElement(this._invocationManager, this._emitter, webMatcher)
  }

  async tap() {
    return await new ActionInteraction(this._invocationManager, this, new WebTapAction()).execute();
  }
}

class WebExpect {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;
  }

  get not() {
    this._notCondition = true;
    return this;
  }
}

class WebExpectElement extends WebExpect {
  constructor(invocationManager, element) {
    super(invocationManager);
    this._element = element;
  }
}

class WaitFor {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;
  }
}

class AndroidWebExpect {
  constructor({ invocationManager, emitter }) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;

    this.by = {
      id: value => new IdMatcher(value),
    };

    this.getWebView = this.getWebView.bind(this);
    this.expect = this.expect.bind(this);
    // this.waitFor = this.waitFor.bind(this);
  }

  async getWebView(webViewMatcher) {
    const webViewElement = new WebViewElement(this._invocationManager, this._emitter);
    await webViewElement._find(webViewMatcher);
    return webViewElement;
  }

  expect(webElement) {
    return new WebExpectElement(this._invocationManager, this._emitter)
  }
}

module.exports = AndroidWebExpect;