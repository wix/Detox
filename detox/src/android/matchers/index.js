const native = require('./native');
const web = require('./web');

module.exports = {
  accessibilityLabel: (value) => new native.LabelMatcher(value),
  id: (value) => new native.IdMatcher(value),
  label: (value) => new native.LabelMatcher(value),
  text: (value) => new native.TextMatcher(value),
  traits: (value) => new native.TraitsMatcher(value),
  type: (value) => new native.TypeMatcher(value),
  value: (value) => new native.ValueMatcher(value),

  className: (value) => new web.ClassNameMatcher(value),
  cssSelector: (value) => new web.CssSelectorMatcher(value),
  htmlId: (value) => new web.IdMatcher(value),
  linkText: (value) => new web.LinkTextMatcher(value),
  name: (value) => new web.NameMatcher(value),
  partialLinkText: (value) => new web.PartialLinkTextMatcher(value),
  tag: (value) => new web.TagNameMatcher(value),
  xpath: (value) => new web.XPathMatcher(value),
};
