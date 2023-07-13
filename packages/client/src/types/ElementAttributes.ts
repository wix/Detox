import { Point2D } from '../common';

/** Shared element attributes between iOS and Android. */
export interface ElementAttributes {
  /**
   * Whether or not the element is enabled for user interaction.
   */
  enabled: boolean;
  /**
   * The identifier of the element. Matches accessibilityIdentifier on iOS, and the main view tag, on Android - both commonly holding the component's test ID in React Native apps.
   */
  identifier: string;
  /**
   * Whether the element is visible. On iOS, visibility is calculated for the activation point. On Android, the attribute directly holds the value returned by View.getLocalVisibleRect()).
   */
  visible: boolean;
  /**
   * The text value of any textual element.
   */
  text?: string;
  /**
   * The label of the element. Largely matches accessibilityLabel for ios, and contentDescription for android.
   * Refer to Detox's documentation (`toHaveLabel()` subsection) in order to learn about caveats associated with
   * this property in React Native apps.
   */
  label?: string;
  /**
   * The placeholder text value of the element. Matches hint on android.
   */
  placeholder?: string;
  /**
   * The value of the element, where applicable.
   * Matches accessibilityValue, on iOS.
   * For example: the position of a slider, or whether a checkbox has been marked (Android).
   */
  value?: unknown;
}

export interface IosElementAttributes extends ElementAttributes {
  /**
   * The [activation point]{@link https://developer.apple.com/documentation/objectivec/nsobject/1615179-accessibilityactivationpoint} of the element, in element coordinate space.
   */
  activationPoint: Point2D;
  /**
   * The activation point of the element, in normalized percentage ([0.0, 1.0]).
   */
  normalizedActivationPoint: Point2D;
  /**
   * Whether the element is hittable at the activation point.
   */
  hittable: boolean;
  /**
   * The frame of the element, in screen coordinate space.
   */
  frame: IosElementAttributeFrame;
  /**
   * The frame of the element, in container coordinate space.
   */
  elementFrame: IosElementAttributeFrame;
  /**
   * The bounds of the element, in element coordinate space.
   */
  elementBounds: IosElementAttributeFrame;
  /**
   * The safe area insets of the element, in element coordinate space.
   */
  safeAreaInsets: IosElementAttributeInsets;
  /**
   * The safe area bounds of the element, in element coordinate space.
   */
  elementSafeBounds: IosElementAttributeFrame;
  /**
   * The date of the element (if it is a date picker).
   */
  date?: string;
  /**
   * The normalized slider position (if it is a slider).
   */
  normalizedSliderPosition?: number;
  /**
   * The content offset (if it is a scroll view).
   */
  contentOffset?: Point2D;
  /**
   * The content inset (if it is a scroll view).
   */
  contentInset?: IosElementAttributeInsets;
  /**
   * The adjusted content inset (if it is a scroll view).
   */
  adjustedContentInset?: IosElementAttributeInsets;
  /**
   * @example "<CALayer: 0x600003f759e0>"
   */
  layer: string;
}

interface IosElementAttributeFrame {
  y: number;
  x: number;
  width: number;
  height: number;
}

interface IosElementAttributeInsets {
  right: number;
  top: number;
  left: number;
  bottom: number;
}

export interface AndroidElementAttributes extends ElementAttributes {
  /**
   * The OS visibility type associated with the element: visible, invisible or gone.
   */
  visibility: 'visible' | 'invisible' | 'gone';
  /**
   * Width of the element, in pixels.
   */
  width: number;
  /**
   * Height of the element, in pixels.
   */
  height: number;
  /**
   * Elevation of the element.
   */
  elevation: number;
  /**
   * Alpha value for the element.
   */
  alpha: number;
  /**
   * Whether the element is the one currently in focus.
   */
  focused: boolean;
  /**
   * The text size for the text element.
   */
  textSize?: number;
  /**
   * The length of the text element (character count).
   */
  length?: number;
}
