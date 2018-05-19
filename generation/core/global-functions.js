// Globally declared helpers
// Each function needs to end with }// END function_name so that it can be
// dynamically included while generating

function sanitize_android_direction(direction) {
  switch (direction) {
    case 'left':
      return 1;
    case 'right':
      return 2;
    case 'up':
      return 3;
    case 'down':
      return 4;
    default:
      throw new Error(`direction must be a 'left'/'right'/'up'/'down', got ${direction}`);
  }
} // END sanitize_android_direction

function sanitize_android_edge(edge) {
  switch (edge) {
    case 'left':
      return 1;
    case 'right':
      return 2;
    case 'top':
      return 3;
    case 'bottom':
      return 4;
    default:
      throw new Error(`edge must be a 'left'/'right'/'top'/'bottom', got ${edge}`);
  }
} // END sanitize_android_edge

function sanitize_greyDirection(action) {
  switch (action) {
    case 'left':
      return 1;
    case 'right':
      return 2;
    case 'up':
      return 3;
    case 'down':
      return 4;

    default:
      throw new Error(`GREYAction.GREYDirection must be a 'left'/'right'/'up'/'down', got ${action}`);
  }
} // END sanitize_greyDirection

function sanitize_greyContentEdge(action) {
  switch (action) {
    case 'left':
      return 0;
    case 'right':
      return 1;
    case 'top':
      return 2;
    case 'bottom':
      return 3;

    default:
      throw new Error(`GREYAction.GREYContentEdge must be a 'left'/'right'/'top'/'bottom', got ${action}`);
  }
} // END sanitize_greyContentEdge

function sanitize_uiAccessibilityTraits(value) {
  let traits = 0;
  for (let i = 0; i < value.length; i++) {
    switch (value[i]) {
      case 'button':
        traits |= 1;
        break;
      case 'link':
        traits |= 2;
        break;
      case 'header':
        traits |= 4;
        break;
      case 'search':
        traits |= 8;
        break;
      case 'image':
        traits |= 16;
        break;
      case 'selected':
        traits |= 32;
        break;
      case 'plays':
        traits |= 64;
        break;
      case 'key':
        traits |= 128;
        break;
      case 'text':
        traits |= 256;
        break;
      case 'summary':
        traits |= 512;
        break;
      case 'disabled':
        traits |= 1024;
        break;
      case 'frequentUpdates':
        traits |= 2048;
        break;
      case 'startsMedia':
        traits |= 4096;
        break;
      case 'adjustable':
        traits |= 8192;
        break;
      case 'allowsDirectInteraction':
        traits |= 16384;
        break;
      case 'pageTurn':
        traits |= 32768;
        break;
      default:
        throw new Error(
          `Unknown trait '${value[i]}', see list in https://facebook.github.io/react-native/docs/accessibility.html#accessibilitytraits-ios`
        );
    }
  }

  return traits;
} // END sanitize_uiAccessibilityTraits

function sanitize_matcher(matcher) {
  const originalMatcher = typeof matcher._call === 'function' ? matcher._call() : matcher._call;
  return originalMatcher.type ? originalMatcher.value : originalMatcher;
} // END sanitize_matcher

function sanitize_greyElementInteraction(value) {
  return {
    type: 'Invocation',
    value
  };
} // END sanitize_greyElementInteraction

function sanitize_uiDeviceOrientation(value) {
  const orientationMapping = {
    landscape: 3, // top at left side landscape
    portrait: 1 // non-reversed portrait
  };

  return orientationMapping[value];
} // END sanitize_uiDeviceOrientation

module.exports = {
  sanitize_greyDirection,
  sanitize_greyContentEdge,
  sanitize_uiAccessibilityTraits,
  sanitize_android_direction,
  sanitize_android_edge,
  sanitize_matcher,
  sanitize_greyElementInteraction,
  sanitize_uiDeviceOrientation
};
