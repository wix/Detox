const generator = require('../core/generator');
const { callGlobal } = require('../helpers');

const { isNumber, isString, isBoolean, isArray, isDefined } = require('../core/type-checks');

const typeCheckInterfaces = {
  'ArrayList<String>': isArray,
  'ArrayList<Object>': isArray,
  'Matcher<View>': null, // isOfClass('Matcher') would be better,
  boolean: isBoolean,
  Double: isNumber,
  Integer: isNumber,
  String: isString,
  ViewAction: null, // there are optional view actions
  ViewInteraction: null,
  WebElement: null,
  'Atom<List<ElementReference>>': null
};

const contentSanitizersForFunction = {
  scrollInDirection: {
    argumentName: 'direction',
    newType: 'String',
    name: 'sanitize_android_direction',
    value: callGlobal('sanitize_android_direction')
  },
  scrollInDirectionStaleAtEdge: {
    argumentName: 'direction',
    newType: 'String',
    name: 'sanitize_android_direction',
    value: callGlobal('sanitize_android_direction')
  },
  swipeInDirection: {
    argumentName: 'direction',
    newType: 'String',
    name: 'sanitize_android_direction',
    value: callGlobal('sanitize_android_direction')
  },
  scrollToEdge: {
    argumentName: 'edge',
    newType: 'String',
    name: 'sanitize_android_edge',
    value: callGlobal('sanitize_android_edge')
  },
  'Matcher<View>': {
    type: 'String',
    name: 'sanitize_matcher',
    value: callGlobal('sanitize_matcher')
  }
};

const contentSanitizersForType = {
  'Matcher<View>': {
    type: 'Invocation',
    name: 'sanitize_matcher',
    value: callGlobal('sanitize_matcher')
  }
};

module.exports = generator({
  typeCheckInterfaces,
  contentSanitizersForFunction,
  contentSanitizersForType,
  supportedTypes: [
    'ArrayList<String>',
    'ArrayList<Object>',
    'boolean',
    'double',
    'Double',
    'float',
    'Float',
    'int',
    'Integer',
    'Matcher<View>',
    'String',
    'ViewAction',
    'ViewInteraction',
    'WebElement',
    'Atom<List<ElementReference>>'
  ],
  renameTypesMap: {
    int: 'Integer', // TODO: add test
    double: 'Double',
    ViewInteraction: 'Invocation',
    WebInteraction: 'Invocation',
    WebElement: 'Invocation',
    'Atom<List<ElementReference>>': 'Invocation'
  },
  classValue: ({ package: pkg, name }) => `${pkg}.${name}`
});
