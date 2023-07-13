import { Point2D } from '../common';
import { AndroidElementAttributes, IosElementAttributes } from './ElementAttributes';

export interface IndexableNativeElement extends NativeElement {
  /**
   * Choose from multiple elements matching the same matcher using index
   * @example await element(by.text('Product')).atIndex(2).tap();
   */
  atIndex(index: number): NativeElement;
}

export interface NativeElement extends NativeElementActions {
}

interface NativeElementActions {
  /**
   * Simulate tap on an element
   * @param point relative coordinates to the matched element (the element size could changes on different devices or even when changing the device font size)
   * @example await element(by.id('tappable')).tap();
   * @example await element(by.id('tappable')).tap({ x:5, y:10 });
   */
  tap(point?: Point2D): Promise<void>;

  /**
   * Simulate long press on an element
   * @param duration (iOS only) custom press duration time, in milliseconds. Optional (default is 1000ms).
   * @example await element(by.id('tappable')).longPress();
   */
  longPress(duration?: number): Promise<void>;

  /**
   * Simulate long press on an element and then drag it to the position of the target element. (iOS Only)
   * @example await element(by.id('draggable')).longPressAndDrag(2000, NaN, NaN, element(by.id('target')), NaN, NaN, 'fast', 0);
   */
  longPressAndDrag(duration: number, normalizedPositionX: number, normalizedPositionY: number, targetElement: NativeElement,
                   normalizedTargetPositionX: number, normalizedTargetPositionY: number, speed: Speed, holdDuration: number): Promise<void>;

  /**
   * Simulate multiple taps on an element.
   * @param times number of times to tap
   * @example await element(by.id('tappable')).multiTap(3);
   */
  multiTap(times: number): Promise<void>;

  /**
   * Simulate tap at a specific point on an element.
   * Note: The point coordinates are relative to the matched element and the element size could changes on different devices or even when changing the device font size.
   * @example await element(by.id('tappable')).tapAtPoint({ x:5, y:10 });
   * @deprecated Use `.tap()` instead.
   */
  tapAtPoint(point: Point2D): Promise<void>;

  /**
   * Use the builtin keyboard to type text into a text field.
   * @example await element(by.id('textField')).typeText('passcode');
   */
  typeText(text: string): Promise<void>;

  /**
   * Paste text into a text field.
   * @example await element(by.id('textField')).replaceText('passcode again');
   */
  replaceText(text: string): Promise<void>;

  /**
   * Clear text from a text field.
   * @example await element(by.id('textField')).clearText();
   */
  clearText(): Promise<void>;

  /**
   * Taps the backspace key on the built-in keyboard.
   * @example await element(by.id('textField')).tapBackspaceKey();
   */
  tapBackspaceKey(): Promise<void>;

  /**
   * Taps the return key on the built-in keyboard.
   * @example await element(by.id('textField')).tapReturnKey();
   */
  tapReturnKey(): Promise<void>;

  /**
   * Scrolls a given amount of pixels in the provided direction, starting from the provided start positions.
   * @param pixels - independent device pixels
   * @param direction - left/right/up/down
   * @param startPositionX - the X starting scroll position, in percentage; valid input: `[0.0, 1.0]`, `NaN`; default: `NaN`—choose the best value automatically
   * @param startPositionY - the Y starting scroll position, in percentage; valid input: `[0.0, 1.0]`, `NaN`; default: `NaN`—choose the best value automatically
   * @example await element(by.id('scrollView')).scroll(100, 'down', NaN, 0.85);
   * @example await element(by.id('scrollView')).scroll(100, 'up');
   */
  scroll(
    pixels: number,
    direction: Direction,
    startPositionX?: number,
    startPositionY?: number
  ): Promise<void>;

  /**
   * Scroll to index.
   * @example await element(by.id('scrollView')).scrollToIndex(10);
   */
  scrollToIndex(
    index: Number
  ): Promise<void>;

  /**
   * Scroll to edge.
   * @example await element(by.id('scrollView')).scrollTo('bottom');
   * @example await element(by.id('scrollView')).scrollTo('top');
   */
  scrollTo(edge: Direction): Promise<void>;

  /**
   * Adjust slider to position.
   * @example await element(by.id('slider')).adjustSliderToPosition(0.75);
   */
  adjustSliderToPosition(newPosition: number): Promise<void>;

  /**
   * Swipes in the provided direction at the provided speed, started from percentage.
   * @param speed default: `fast`
   * @param percentage screen percentage to swipe; valid input: `[0.0, 1.0]`
   * @param optional normalizedStartingPointX X coordinate of swipe starting point, relative to the view width; valid input: `[0.0, 1.0]`
   * @param normalizedStartingPointY Y coordinate of swipe starting point, relative to the view height; valid input: `[0.0, 1.0]`
   * @example await element(by.id('scrollView')).swipe('down');
   * @example await element(by.id('scrollView')).swipe('down', 'fast');
   * @example await element(by.id('scrollView')).swipe('down', 'fast', 0.5);
   * @example await element(by.id('scrollView')).swipe('down', 'fast', 0.5, 0.2);
   * @example await element(by.id('scrollView')).swipe('down', 'fast', 0.5, 0.2, 0.5);
   */
  swipe(direction: Direction, speed?: Speed, percentage?: number, normalizedStartingPointX?: number, normalizedStartingPointY?: number): Promise<void>;

  /**
   * Sets a picker view’s column to the given value. This function supports both date pickers and general picker views. (iOS Only)
   * Note: When working with date pickers, you should always set an explicit locale when launching your app in order to prevent flakiness from different date and time styles.
   * See [here](https://wix.github.io/Detox/docs/api/device-object-api#9-launch-with-a-specific-language-ios-only) for more information.
   *
   * @param column number of datepicker column (starts from 0)
   * @param value string value in set column (must be correct)
   * @example
   * await expect(element(by.type('UIPickerView'))).toBeVisible();
   * await element(by.type('UIPickerView')).setColumnToValue(1,"6");
   * await element(by.type('UIPickerView')).setColumnToValue(2,"34");
   */
  setColumnToValue(column: number, value: string): Promise<void>;

  /**
   * Sets the date of a date-picker according to the specified date-string and format.
   * @param dateString Textual representation of a date (e.g. '2023/01/01'). Should be in coherence with the format specified by `dateFormat`.
   * @param dateFormat Format of `dateString`: Generally either 'ISO8601' or an explicitly specified format (e.g. 'yyyy/MM/dd'); It should
   *      follow the rules of NSDateFormatter for iOS and DateTimeFormatter for Android.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
   * @example
   * await element(by.id('datePicker')).setDatePickerDate('2023-01-01T00:00:00Z', 'ISO8601');
   * await element(by.id('datePicker')).setDatePickerDate(new Date().toISOString(), 'ISO8601');
   * await element(by.id('datePicker')).setDatePickerDate('2023/01/01', 'yyyy/MM/dd');
   */
  setDatePickerDate(dateString: string, dateFormat: string): Promise<void>;

  /**
   * Triggers a given [accessibility action]{@link https://reactnative.dev/docs/accessibility#accessibility-actions}.
   * @param actionName - name of the accessibility action
   * @example await element(by.id('view')).performAccessibilityAction('activate');
   */
  performAccessibilityAction(actionName: string): Promise<void>

  /**
   * Pinches in the given direction with speed and angle. (iOS only)
   * @param angle value in radiant, default is `0`
   * @example
   * await expect(element(by.id('PinchableScrollView'))).toBeVisible();
   * await element(by.id('PinchableScrollView')).pinchWithAngle('outward', 'slow', 0);
   * @deprecated Use `.pinch()` instead.
   */
  pinchWithAngle(direction: PinchDirection, speed: Speed, angle: number): Promise<void>;

  /**
   * Pinches with the given scale, speed, and angle. (iOS only)
   * @param speed default is `fast`
   * @param angle value in radiant, default is `0`
   * @example
   * await element(by.id('PinchableScrollView')).pinch(1.1);
   * await element(by.id('PinchableScrollView')).pinch(2.0);
   * await element(by.id('PinchableScrollView')).pinch(0.001);
   */
  pinch(scale: number, speed?: Speed, angle?: number): Promise<void>;

  /**
   * Takes a screenshot of the element and schedules putting it in the artifacts folder upon completion of the current test.
   * For more information, see {@link https://wix.github.io/Detox/docs/api/screenshots#element-level-screenshots}
   * @param {string} name for the screenshot artifact
   * @returns {Promise<string>} a temporary path to the screenshot.
   * @example
   * test('Menu items should have logout', async () => {
   *   const imagePath = await element(by.id('menuRoot')).takeScreenshot('tap on menu');
   *   // The temporary path will remain valid until the test completion.
   *   // Afterwards, the screenshot will be moved, e.g.:
   *   // * on success, to: <artifacts-location>/✓ Menu items should have Logout/tap on menu.png
   *   // * on failure, to: <artifacts-location>/✗ Menu items should have Logout/tap on menu.png
   * });
   */
  takeScreenshot(name: string): Promise<string>;

  /**
   * Gets the native (OS-dependent) attributes of the element.
   * For more information, see {@link https://wix.github.io/Detox/docs/api/actions-on-element/#getattributes}
   *
   * @example
   * test('Get the attributes for my text element', async () => {
   *    const attributes = await element(by.id('myText')).getAttributes()
   *    const jestExpect = require('expect');
   *    // 'visible' attribute available on both iOS and Android
   *    jestExpect(attributes.visible).toBe(true);
   *    // 'activationPoint' attribute available on iOS only
   *    jestExpect(attributes.activationPoint.x).toHaveValue(50);
   *    // 'width' attribute available on Android only
   *    jestExpect(attributes.width).toHaveValue(100);
   * })
   */
  getAttributes(): Promise<IosElementAttributes | AndroidElementAttributes | { elements: IosElementAttributes[]; }>;
}

type Direction = 'left' | 'right' | 'top' | 'bottom' | 'up' | 'down';

type PinchDirection = 'outward' | 'inward'

type Speed = 'fast' | 'slow';
