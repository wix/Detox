const WebElementApi = require('../espressoapi/web/WebElement');
const WebExpectApi = require('../espressoapi/web/WebExpect');
const simpleAtoms = require('../espressoapi/web/simpleAtoms');

class WebAction {
}

class WebTapAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.tap(element._call);
  }
}

class WebTypeTextAction extends WebAction {
  constructor(element, text) {
    super();
    this._call = WebElementApi.typeText(element._call, text);
  }
}

class WebReplaceTextAction extends WebAction {
  constructor(element, text) {
    super();
    this._call = WebElementApi.replaceText(element._call, text);
  }
}

class WebClearTextAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.clearText(element._call);
  }
}

class WebScrollToViewAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.scrollToView(element._call);
  }
}

class WebGetTextAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.getText(element._call);
  }
}

class WebRunScriptAction extends WebAction {
  constructor(element, script) {
    super();
    this._call = WebElementApi.runScript(element._call, script);
  }
}

class WebRunScriptWithArgsAction extends WebAction {
  constructor(element, script, args) {
    super();
    this._call = WebElementApi.runScriptWithArgs(element._call, script, args);
  }
}

class WebGetCurrentUrlAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.getCurrentUrl(element._call);
  }
}

class WebGetTitleAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.getTitle(element._call);
  }
}

class WebFocusAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.runScript(element._call, simpleAtoms.focus);
  }
}

class WebSelectAllText extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.runScript(element._call, simpleAtoms.selectElementContents);
  }
}

class WebMoveCursorEnd extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.runScript(element._call, simpleAtoms.moveCursorToEnd);
  }
}

class WebExistsAssertion extends WebAction {
  constructor(webExpect) {
    super();
    if (webExpect._notCondition) {
      this._call = WebExpectApi.toNotExist(webExpect._call);
    } else {
      this._call = WebExpectApi.toExist(webExpect._call);
    }
  }
}

class WebHasTextAssertion extends WebAction {
  constructor(webExpect, text) {
    super();
    if (webExpect._notCondition) {
      this._call = WebExpectApi.toNotHaveText(webExpect._call, text);
    } else {
      this._call = WebExpectApi.toHaveText(webExpect._call, text);
    }
  }
}

module.exports = {
  WebAction,
  WebTapAction,
  WebTypeTextAction,
  WebReplaceTextAction,
  WebClearTextAction,
  WebScrollToViewAction,
  WebGetTextAction,
  WebRunScriptAction,
  WebRunScriptWithArgsAction,
  WebGetCurrentUrlAction,
  WebGetTitleAction,
  WebFocusAction,
  WebSelectAllText,
  WebMoveCursorEnd,
  WebExistsAssertion,
  WebHasTextAssertion,
};
