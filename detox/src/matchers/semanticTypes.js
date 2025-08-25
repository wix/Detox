/**
 * Semantic type mappings for cross-platform component matching
 */

// Shared class mappings for aliases
const ACTIVITY_INDICATOR_CLASSES = {
  ios: ['UIActivityIndicatorView'],
  android: ['android.widget.ProgressBar', 'androidx.core.widget.ContentLoadingProgressBar']
};

const SEMANTIC_TYPE_MAPPINGS = {
  // Images
  'image': {
    ios: ['RCTImageView', 'UIImageView'],
    android: ['android.widget.ImageView', 'com.facebook.react.views.image.ReactImageView']
  },

  // Input fields
  'input-field': {
    ios: ['RCTTextInputView', 'RCTMultilineTextInputView', 'UITextField', 'UITextView'],
    android: ['android.widget.EditText', 'com.facebook.react.views.textinput.ReactEditText']
  },

  // Text elements
  'text': {
    ios: ['RCTText', 'RCTParagraphComponentView', 'UILabel'],
    android: ['android.widget.TextView', 'com.facebook.react.views.text.ReactTextView']
  },

  // Button elements
  'button': {
    ios: ['UIButton', 'RCTTouchableOpacity', 'RCTTouchableHighlight', 'RCTTouchableWithoutFeedback'],
    android: ['android.widget.Button', 'android.widget.ImageButton']
  },

  // Scroll containers - The UITableView inherits from scrollview so it could also show up here...
  'scrollview': {
    ios: ['RCTScrollView', 'UIScrollView'],
    android: ['android.widget.ScrollView', 'androidx.core.widget.NestedScrollView', 'com.facebook.react.views.scroll.ReactScrollView']
  },

  // Lists
  'list': {
    ios: ['UITableView', 'UICollectionView', 'RCTScrollView'],
    android: ['android.widget.ListView', 'androidx.recyclerview.widget.RecyclerView', 'com.facebook.react.views.scroll.ReactScrollView']
  },

  // Switches/Toggles
  'switch': {
    ios: ['UISwitch'],
    android: ['android.widget.Switch', 'androidx.appcompat.widget.SwitchCompat', 'com.facebook.react.views.switchview.ReactSwitch']
  },

  // Sliders
  'slider': {
    ios: ['UISlider'],
    android: ['android.widget.SeekBar']
  },

  // Picker/Selector
  'picker': {
    ios: ['UIPickerView'],
    android: ['android.widget.Spinner', 'androidx.appcompat.widget.AppCompatSpinner']
  },

  // Activity indicators/Progress
  'activity-indicator': ACTIVITY_INDICATOR_CLASSES,

  // Progress (alias for activity-indicator)
  'progress': ACTIVITY_INDICATOR_CLASSES
};

/**
 * Get platform-specific class names for a semantic type
 * @param {string} semanticType - The semantic type (e.g., 'image', 'input-field')
 * @param {string} platform - The platform ('ios' or 'android')
 * @returns {string[]} Array of class names for the platform
 */
function getClasses(semanticType, platform) {
  const mapping = SEMANTIC_TYPE_MAPPINGS[semanticType];
  if (!mapping) {
    throw new Error(`Unknown semantic type: ${semanticType}. Available types: ${Object.keys(SEMANTIC_TYPE_MAPPINGS).join(', ')}`);
  }

  const classNames = mapping[platform];
  if (!classNames) {
    throw new Error(`Platform ${platform} not supported for semantic type ${semanticType}`);
  }

  return classNames;
}

/**
 * Get all available semantic types
 * @returns {string[]} Array of available semantic type names
 */
function getTypes() {
  return Object.keys(SEMANTIC_TYPE_MAPPINGS);
}

function includes(value) {
  return getTypes().includes(value);
}

module.exports = {
  SEMANTIC_TYPE_MAPPINGS,
  getClasses,
  getTypes,
  includes,
};
