/**
 * Semantic type mappings for cross-platform component matching
 */

// Shared class mappings for aliases
const ACTIVITY_INDICATOR_CLASSES = {
  ios: ['UIActivityIndicatorView'],
  android: [
    {
      include: ['android.widget.ProgressBar', 'androidx.core.widget.ContentLoadingProgressBar'],
      exclude: ['android.widget.AbsSeekBar']
    }
  ]
};

const SEMANTIC_TYPE_MAPPINGS = {
  // Images
  'image': {
    ios: ['RCTImageView', 'RCTImageComponentView', 'UIImageView'],
    android: ['android.widget.ImageView', 'com.facebook.react.views.image.ReactImageView']
  },

  // Input fields
  'input-field': {
    ios: ['RCTTextInputView', 'RCTMultilineTextInputView', 'UITextField', 'UITextView'],
    android: ['android.widget.EditText', 'com.facebook.react.views.textinput.ReactEditText']
  },

  // Text elements (includes both old and new arch classes)
  'text': {
    ios: ['RCTText', 'RCTParagraphComponentView', 'UILabel'],
    android: [
      {
        include: ['android.widget.TextView', 'com.facebook.react.views.text.ReactTextView'],
        exclude: ['android.widget.EditText', 'android.widget.Button']
      }
    ]
  },

  // Button elements (includes both old and new arch classes)
  'button': {
    ios: ['UIButton', 'RCTTouchableOpacity', 'RCTTouchableHighlight', 'RCTTouchableWithoutFeedback'],
    android: ['android.widget.Button', 'android.widget.ImageButton']
  },

  // Scroll containers - The UITableView inherits from scrollview so it could also show up here...
  'scrollview': {
    ios: ['RCTScrollView', 'RCTScrollViewComponentView', 'UIScrollView'],
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
 * @returns {Array<string|object>} Array of class names or matcher objects for the platform
 */
function getClasses(semanticType, platform) {
  const mapping = SEMANTIC_TYPE_MAPPINGS[semanticType];
  if (!mapping) {
    return [{ className: semanticType, excludes: [] }];
  }

  const classNames = mapping[platform];
  if (!classNames) {
    throw new Error(`Platform ${platform} not supported for semantic type ${semanticType}`);
  }

  return classNames.map(item => {
    if (typeof item === 'string') {
      return { className: item, excludes: [] };
    } else if (item.include && item.exclude) {
      if (Array.isArray(item.include)) {
        return item.include.map(className => ({
          className,
          excludes: item.exclude
        }));
      } else {
        return {
          className: item.include,
          excludes: item.exclude
        };
      }
    }
    return { className: item, excludes: [] };
  }).flat();
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
