/**
 * Semantic type mappings for cross-platform component matching
 */

const SEMANTIC_TYPE_MAPPINGS = {
  // Images
  'image': {
    ios: ['RCTImageView', 'UIImageView'],
    android: ['android.widget.ImageView', 'com.facebook.react.views.image.ReactImageView']
  },

  // Input fields
  'input-field': {
    ios: ['RCTTextInput', 'RCTMultilineTextInput', 'UITextField', 'UITextView'],
    android: ['android.widget.EditText', 'com.facebook.react.views.textinput.ReactEditText']
  },

  // Text elements
  'text': {
    ios: ['RCTText', 'UILabel'],
    android: ['android.widget.TextView', 'com.facebook.react.views.text.ReactTextView']
  },

  // Button elements
  'button': {
    ios: ['RCTButton', 'UIButton'],
    android: ['android.widget.Button', 'com.facebook.react.views.view.ReactViewGroup']
  },

  // Scroll containers
  'scrollview': {
    ios: ['RCTScrollView', 'UIScrollView'],
    android: ['android.widget.ScrollView', 'androidx.core.widget.NestedScrollView', 'com.facebook.react.views.scroll.ReactScrollView']
  },

  // Lists
  'list': {
    ios: ['RCTFlatList', 'UITableView', 'UICollectionView'],
    android: ['android.widget.ListView', 'androidx.recyclerview.widget.RecyclerView', 'com.facebook.react.views.scroll.ReactScrollView']
  },

  // Switches/Toggles
  'switch': {
    ios: ['RCTSwitch', 'UISwitch'],
    android: ['android.widget.Switch', 'androidx.appcompat.widget.SwitchCompat', 'com.facebook.react.views.switchview.ReactSwitch']
  },

  // Sliders
  'slider': {
    ios: ['RCTSlider', 'UISlider'],
    android: ['android.widget.SeekBar', 'com.facebook.react.views.slider.ReactSlider']
  },

  // Picker/Selector
  'picker': {
    ios: ['RCTPicker', 'UIPickerView'],
    android: ['android.widget.Spinner', 'com.facebook.react.views.picker.ReactPickerManager']
  },

  // Activity indicators/Progress
  'activity-indicator': {
    ios: ['RCTActivityIndicatorView', 'UIActivityIndicatorView'],
    android: ['android.widget.ProgressBar', 'com.facebook.react.views.progressbar.ReactProgressBarViewManager']
  }
};

/**
 * Get platform-specific class names for a semantic type
 * @param {string} semanticType - The semantic type (e.g., 'image', 'input-field')
 * @param {string} platform - The platform ('ios' or 'android')
 * @returns {string[]} Array of class names for the platform
 */
function getClassNamesForSemanticType(semanticType, platform) {
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
function getAvailableSemanticTypes() {
  return Object.keys(SEMANTIC_TYPE_MAPPINGS);
}

module.exports = {
  SEMANTIC_TYPE_MAPPINGS,
  getClassNamesForSemanticType,
  getAvailableSemanticTypes
};   