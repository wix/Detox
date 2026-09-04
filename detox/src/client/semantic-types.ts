/**
 * Semantic type mappings for cross-platform component matching.
 *
 * Port of Detox 20 `src/matchers/semanticTypes.js`, whole table included:
 * `by.type()` resolves through `getClasses` exactly as v20 does, so the
 * predicate trees it emits stay identical. The Android half is kept verbatim
 * (unread on iOS today) so Android parity can inherit it later.
 */

interface PlatformClassGroup {
  include: string[];
  exclude: string[];
}

type PlatformClasses = ReadonlyArray<string | PlatformClassGroup>;

interface SemanticTypeMapping {
  ios: PlatformClasses;
  android: PlatformClasses;
}

// Shared by 'activity-indicator' and 'progress' below.
const ACTIVITY_INDICATOR_CLASSES: SemanticTypeMapping = {
  ios: ['UIActivityIndicatorView'],
  android: [
    {
      include: ['android.widget.ProgressBar', 'androidx.core.widget.ContentLoadingProgressBar'],
      exclude: ['android.widget.AbsSeekBar'],
    },
  ],
};

const SEMANTIC_TYPE_MAPPINGS: Readonly<Record<string, SemanticTypeMapping>> = {
  'image': {
    ios: ['RCTImageView', 'RCTImageComponentView', 'UIImageView'],
    android: ['android.widget.ImageView', 'com.facebook.react.views.image.ReactImageView'],
  },

  'input-field': {
    ios: ['RCTTextInputView', 'RCTMultilineTextInputView', 'UITextField', 'UITextView'],
    android: ['android.widget.EditText', 'com.facebook.react.views.textinput.ReactEditText'],
  },

  // Old and new RN architecture classes both included.
  'text': {
    ios: ['RCTText', 'RCTParagraphComponentView', 'UILabel'],
    android: [
      {
        include: ['android.widget.TextView', 'com.facebook.react.views.text.ReactTextView'],
        exclude: ['android.widget.EditText', 'android.widget.Button'],
      },
    ],
  },

  // Old and new RN architecture classes both included.
  'button': {
    ios: ['UIButton', 'RCTTouchableOpacity', 'RCTTouchableHighlight', 'RCTTouchableWithoutFeedback'],
    android: ['android.widget.Button', 'android.widget.ImageButton'],
  },

  // UITableView is technically a UIScrollView subclass too, but is listed
  // only under 'list' below.
  'scrollview': {
    ios: ['RCTScrollView', 'RCTScrollViewComponentView', 'UIScrollView'],
    android: ['android.widget.ScrollView', 'androidx.core.widget.NestedScrollView', 'com.facebook.react.views.scroll.ReactScrollView'],
  },

  'list': {
    ios: ['UITableView', 'UICollectionView', 'RCTScrollView'],
    android: ['android.widget.ListView', 'androidx.recyclerview.widget.RecyclerView', 'com.facebook.react.views.scroll.ReactScrollView'],
  },

  'switch': {
    ios: ['UISwitch'],
    android: ['android.widget.Switch', 'androidx.appcompat.widget.SwitchCompat', 'com.facebook.react.views.switchview.ReactSwitch'],
  },

  'slider': {
    ios: ['UISlider'],
    android: ['android.widget.SeekBar'],
  },

  'picker': {
    ios: ['UIPickerView'],
    android: ['android.widget.Spinner', 'androidx.appcompat.widget.AppCompatSpinner'],
  },

  'activity-indicator': ACTIVITY_INDICATOR_CLASSES,
  'progress': ACTIVITY_INDICATOR_CLASSES,
};

export interface SemanticClassDescriptor {
  className: string;
  excludes: string[];
}

/**
 * @issue DTX-3000: an unknown type is its own class name with no exclusions.
 */
export function getClasses(semanticType: string, platform: 'ios' | 'android'): SemanticClassDescriptor[] {
  // `hasOwn`, not a bare lookup: `by.type` takes arbitrary user strings, and a
  // prototype key (e.g. `'constructor'`) would otherwise reach a non-mapping
  // value and crash untyped. The own-key check sends such strings through the
  // literal-class fallback instead.
  if (!Object.hasOwn(SEMANTIC_TYPE_MAPPINGS, semanticType)) {
    return [{ className: semanticType, excludes: [] }];
  }
  const mapping = SEMANTIC_TYPE_MAPPINGS[semanticType];

  const classNames = mapping[platform];

  return classNames.flatMap((item): SemanticClassDescriptor | SemanticClassDescriptor[] => {
    if (typeof item === 'string') {
      return { className: item, excludes: [] };
    }
    return item.include.map((className) => ({
      className,
      excludes: item.exclude,
    }));
  });
}
