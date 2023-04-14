const invoke = require('../../invoke');
const { WebMatcher } = require('../core/WebMatcher');
const DetoxWebMatcherApi = require('../espressoapi/web/DetoxWebAtomMatcher');

class IdMatcher extends WebMatcher {
  constructor(id) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForId(id));
  }
}

class ClassNameMatcher extends WebMatcher {
  constructor(className) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForClassName(className));
  }
}

class CssSelectorMatcher extends WebMatcher {
  constructor(cssSelector) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForCssSelector(cssSelector));
  }
}

class NameMatcher extends WebMatcher {
  constructor(name) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForName(name));
  }
}

class XPathMatcher extends WebMatcher {
  constructor(xpath) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForXPath(xpath));
  }
}

class LinkTextMatcher extends WebMatcher {
  constructor(linkText) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForLinkText(linkText));
  }
}

class PartialLinkTextMatcher extends WebMatcher {
  constructor(partialLinkText) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForPartialLinkText(partialLinkText));
  }
}

class TagNameMatcher extends WebMatcher {
  constructor(tag) {
    super();
    this._call = invoke.callDirectly(DetoxWebMatcherApi.matcherForTagName(tag));
  }
}

module.exports = {
  IdMatcher,
  ClassNameMatcher,
  CssSelectorMatcher,
  NameMatcher,
  XPathMatcher,
  LinkTextMatcher,
  PartialLinkTextMatcher,
  TagNameMatcher
};
