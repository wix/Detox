const t = require('@babel/types');
const generator = require('../core/generator');
const {
  isNumber,
  isString,
  isBoolean,
  isPoint,
  isOneOf,
  isGreyAction,
  isGreyMatcher,
  isGreyElementInteraction,
  isArray,
  isDefined
} = require('../core/type-checks');
const { callGlobal } = require('../helpers');

const typeCheckInterfaces = {
  NSInteger: isNumber,
  CGFloat: isNumber,
  CGPoint: isPoint,
  CFTimeInterval: isNumber,
  double: isNumber,
  float: isNumber,
  NSString: isString,
  BOOL: isBoolean,
  'NSDate *': isNumber,
  GREYDirection: isOneOf(['left', 'right', 'up', 'down']),
  GREYContentEdge: isOneOf(['left', 'right', 'top', 'bottom']),
  GREYPinchDirection: isOneOf(['outward', 'inward']),
  'id<GREYAction>': isGreyAction,
  'id<GREYMatcher>': isGreyMatcher,
  'GREYElementInteraction*': isGreyElementInteraction,
  UIAccessibilityTraits: isArray,
  id: isDefined,
  UIDeviceOrientation: isOneOf(['landscape', 'portrait'])
};

const contentSanitizersForType = {
  GREYDirection: {
    type: 'NSInteger',
    name: 'sanitize_greyDirection',
    value: callGlobal('sanitize_greyDirection')
  },
  GREYContentEdge: {
    type: 'NSInteger',
    name: 'sanitize_greyContentEdge',
    value: callGlobal('sanitize_greyContentEdge')
  },
  UIAccessibilityTraits: {
    type: 'NSInteger',
    name: 'sanitize_uiAccessibilityTraits',
    value: callGlobal('sanitize_uiAccessibilityTraits')
  },
  'GREYElementInteraction*': {
    type: 'Invocation',
    name: 'sanitize_greyElementInteraction',
    value: callGlobal('sanitize_greyElementInteraction')
  },
  UIDeviceOrientation: {
    type: 'NSInteger',
    name: 'sanitize_uiDeviceOrientation',
    value: callGlobal('sanitize_uiDeviceOrientation')
  }
};

module.exports = generator({
  typeCheckInterfaces,
  contentSanitizersForFunction: {},
  contentSanitizersForType,
  supportedTypes: [
    'CFTimeInterval',
    'CGFloat',
    'CGPoint',
    'GREYContentEdge',
    'GREYDirection',
    'GREYElementInteraction*',
    'id',
    'id<GREYAction>',
    'id<GREYMatcher>',
    'NSInteger',
    'NSString *',
    'NSString',
    'NSUInteger',
    'UIAccessibilityTraits',
    '__strong NSError **',
    'CFTimeInterval',
    'CGFloat',
    'CGPoint',
    'GREYContentEdge',
    'GREYDirection',
    'GREYElementInteraction*',
    'id',
    'id<GREYAction>',
    'id<GREYMatcher>',
    'NSInteger',
    'NSString *',
    'NSString',
    'NSUInteger',
    'UIAccessibilityTraits',
    'UIDeviceOrientation'
  ],
  renameTypesMap: {
    NSUInteger: 'NSInteger',
    'NSString *': 'NSString',
    CFTimeInterval: 'CGFloat'
  },
  classValue: ({ name }) => name,
  blacklistedFunctionNames: ['init']
});
