const { DetoxRuntimeError } = require('../../errors');

const native = require('./native');
const web = require('./web');

module.exports = {
  id: (value) => new native.IdMatcher(value),
  label: (value) => new native.ShallowLabelMatcher(value),
  accessibilityLabel: (value) => new native.ShallowLabelMatcher(value),
  text: (value) => new native.TextMatcher(value),
  traits: (value) => new native.TraitsMatcher(value),
  type: (value) => new native.TypeMatcher(value),
  value: (value) => new native.ValueMatcher(value),

  web: {
    id: (value) => new web.IdMatcher(value),
    className: (value) => new web.ClassNameMatcher(value),
    cssSelector: (value) => new web.CssSelectorMatcher(value),
    name: (value) => new web.NameMatcher(value),
    tag: (value) => new web.TagNameMatcher(value),
    xpath: (value) => new web.XPathMatcher(value),
    href: (value) => new web.LinkTextMatcher(value),
    hrefContains: (value) => new web.PartialLinkTextMatcher(value),
    label: (_value) => { throw new DetoxRuntimeError('Label matcher is not supported on Android'); },
    value: (_value) => { throw new DetoxRuntimeError('Value matcher is not supported on Android'); },
  },

  system: {
    label: (_value) => { throw new DetoxRuntimeError('System interactions are not supported on Android, use UiDevice APIs directly instead'); },
    type: (_value) => { throw new DetoxRuntimeError('System interactions are not supported on Android, use UiDevice APIs directly instead'); },
  }
};
