# Actions

Detox uses [matchers](APIRef.Matchers.md) to find UI elements in your app and actions to simulate user interaction with those elements.

Use [expectations](APIRef.Expect.md) to verify element states.

## Methods

- [`.tap()`](#tappoint)
- [`.multiTap()`](#multitaptimes)
- [`.longPress()`](#longpressduration)
- [`.longPressAndDrag()`](#longpressanddragduration-normalizedpositionx-normalizedpositiony-targetelement-normalizedtargetpositionx-normalizedtargetpositiony-speed-holdduration--ios-only) **iOS only**
- [`.swipe()`](#swipedirection-speed-normalizedoffset-normalizedstartingpointx-normalizedstartingpointy)
- [`.pinch()`](#pinchscale-speed-angle--ios-only) **iOS only**
- [`.scrollToIndex()`](#scrolltoindexindex--android-only) **Android only**  
- [`.scroll()`](#scrolloffset-direction-startpositionx-startpositiony)
  - [`whileElement()`](#whileelementelement)
- [`.scrollTo()`](#scrolltoedge)
- [`.typeText()`](#typetexttext)
- [`.replaceText()`](#replacetexttext)
- [`.clearText()`](#cleartext)
- [`.tapReturnKey()`](#tapreturnkey)
- [`.tapBackspaceKey()`](#tapbackspacekey)
- [`.setColumnToValue()`](#setcolumntovaluecolumn-value--ios-only) **iOS only**
- [`.setDatePickerDate()`](#setdatepickerdatedatestring-dateformat--ios-only) **iOS only**
- [`.adjustSliderToPosition()`](#adjustslidertopositionnormalizedposition)
- [`.getAttributes()`](#getAttributes)
- [`.takeScreenshot(name)`](#takescreenshotname)

### `tap(point)`

Simulates a tap on the element at the specified point, or at element's activation point if no point is specified.

`point`—a point in the element's coordinate space (optional, valid input: object with x and y numerical values, default is `null`)

**Note:** Special care should be applied when specifying a point with this method. Elements may have different dimensions when displayed on different device screen sizes, different text sizes, etc.

```js
await element(by.id('tappable')).tap();
await element(by.id('tappable')).tap({x:5, y:10});
```
### `multiTap(times)`
Simulates multiple taps on the element at its activation point. All taps are applied as a part of the same gesture and there is no synchronization attempt between taps.

`times`—the number of taps to simulate (number, 1 and above)

```js
await element(by.id('tappable')).multiTap(3);
```
### `longPress(duration)`

Simulates a long press on the element at its activation point.

`duration`—the duration to press for, in ms (optional, default is 1000)

```js
await element(by.id('tappable')).longPress();
await element(by.id('tappable')).longPress(1500);
```

### `longPressAndDrag(duration, normalizedPositionX, normalizedPositionY, targetElement, normalizedTargetPositionX, normalizedTargetPositionY, speed, holdDuration)`  iOS only

Simulates a long press on the element and then drag it to a position of another element.

`duration` —the duration to press for, in ms (required) <br/>
`normalizedPositionX` — X coordinate of the starting point, relative to the element width (required, a number between 0.0 and 1.0, `NaN` — choose an optimal value automatically) <br/>
`normalizedPositionY` — Y coordinate of the starting point, relative to the element height (required, a number between 0.0 and 1.0, `NaN` — choose an optimal value automatically) <br/>
`targetElement`— the target element to drag to (required) <br/>
`normalizedTargetPositionX` — X coordinate of the ending point, relative to the target element width (optional, a number between 0.0 and 1.0, `NaN` — choose an optimal value automatically) <br/>
`normalizedTargetPositionY` — Y coordinate of the ending point, relative to the target element height (optional, a number between 0.0 and 1.0, `NaN` — choose an optimal value automatically) <br/>
`speed` — the speed of the drag (optional, valid input: `"fast"`/`"slow"` , default is `"fast"`) <br/>
`holdDuration` — the duration before releasing at the end, in ms (optional, default is 1000)

```js
await element(by.id('elementToDrag')).longPressAndDrag(2000, NaN, NaN, element(by.id('targetElement')), NaN, NaN);
await element(by.id('cellId_1')).longPressAndDrag(2000, 0.9, NaN, element(by.id('cellId_6')), 0.9, NaN, 'slow', 0);
```

### `swipe(direction, speed, normalizedOffset, normalizedStartingPointX, normalizedStartingPointY)`

Simulates a swipe on the element with the provided options.

`direction` — the direction of the swipe (required, valid input: `"left"`/`"right"`/`"up"`/`"down"`) <br/>
`speed` — the speed of the swipe (optional, valid input: `"fast"`/`"slow"` , default is `"fast"`) <br/>
`normalizedOffset` — swipe amount relative to the screen width/height (optional, a number between 0.0 and 1.0, default is `NaN` — choose an optimal value automatically) <br/>
`normalizedStartingPointX` — X coordinate of the swipe starting point, relative to the element width (optional, a number between 0.0 and 1.0, default is `NaN` — choose an optimal value automatically) <br/>
`normalizedStartingPointY` — Y coordinate of the swipe starting point, relative to the element height (optional, a number between 0.0 and 1.0, default is `NaN` — choose an optimal value automatically)

```js
await element(by.id('scrollView')).swipe('down');
await element(by.id('scrollView')).swipe('down', 'slow'); // set swipe speed
await element(by.id('scrollView')).swipe('down', 'fast', 0.75); // set swipe amount
await element(by.id('scrollView')).swipe('down', 'fast', NaN, 0.8); // set starting point X
await element(by.id('scrollView')).swipe('down', 'fast', NaN, NaN, 0.25); // set starting point Y
```

### `pinch(scale, speed, angle)`  iOS only

Simulates a pinch on the element with the provided options.

`scale`—the scale of the pinch gesture; use a scale between 0 and 1 to zoom out, and a scale greater than 1 to zoom in; the system makes a best effort to accommodate the requested scale, taking into account the element's dimensions (valid input: (0.0, inf]) <br/>
`speed`—the speed of the pinch (optional, valid input: `"fast"`/`"slow"` , default is `"slow"`) <br/>
`angle`—the angle of the pinch, in radians (optional, default is 0.0)

```js
await element(by.id('PinchableScrollView')).pinch(1.1); //Zooms in a little bit
await element(by.id('PinchableScrollView')).pinch(2.0); //Zooms in a lot
await element(by.id('PinchableScrollView')).pinch(0.001); //Zooms out a lot
```
### `scrollToIndex(index)`  Android only

Scrolls until it reaches the element with the provided index. This works for ReactScrollView and ReactHorizontalScrollView.

`index`—the index of the target element <br/>

```js
await element(by.id('scrollView')).scrollToIndex(0);
```
### `scroll(offset, direction, startPositionX, startPositionY)`

Simulates a scroll on the element with the provided options.

`offset`—the offset to scroll, in points <br/>
`direction`—the scroll's direction (valid input: `"left"`/`"right"`/`"up"`/`"down"`) <br/>
`startPositionX`—the normalized x percentage of the element to use as scroll start point (optional, valid input: [0.0, 1.0], `NaN`—choose an optimal value automatically, default is `NaN`) <br/>
`startPositionY`—the normalized y percentage of the element to use as scroll start point (optional, valid input: [0.0, 1.0], `NaN`—choose an optimal value automatically, default is `NaN`)

```js
await element(by.id('scrollView')).scroll(100, 'up');
await element(by.id('scrollView')).scroll(100, 'down', NaN, 0.85);
```

### `whileElement(element)`

Continuously scrolls the scroll element until the specified expectation is resolved. If the edge of the scroll element is reached while the expectation is not resolved, the operation is failed.

```js
await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
```

### `scrollTo(edge)`

Simulates a scroll to the specified edge.

`edge`—the edge to scroll to (valid input: `"left"`/`"right"`/`"top"`/`"bottom"`)

```js
await element(by.id('scrollView')).scrollTo('bottom');
await element(by.id('scrollView')).scrollTo('top');
```
### `typeText(text)`

Simulates typing of the specified text into the element, using the system's builtin keyboard and typing behavior.

On iOS, any element can be typed into, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol. Before typing the text, Detox attempts making the element the first responder, if it isn't already. If the element’s window is not key window, Detox attempts making it the key window.

`text`—the text to type (valid input: string)

```js
await element(by.id('textField')).typeText('passcode');
```

### `replaceText(text)`

Replaces the element's text with the specified text, without using the system's builtin keyboard or typing behavior. **Note**, that using this method is faster than using [`.typeText()`](#typetexttext), but may not trigger all text input callbacks, causing an undefined state in your app.

On iOS, any element's text can be replaced, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol. Before replacing the text, Detox attempts making the element the first responder, if it isn't already. If the element’s window is not key window, Detox attempts making it the key window.

`text`—the text to replace with (valid input: string)

```js
await element(by.id('textField')).replaceText('passcode again');
```

### `clearText()`
Simulates clearing the text of the element, using the system's builtin keyboard and typing behavior.

On iOS, any element's text can be cleared, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol. Before clearing the text, Detox attempts making the element the first responder, if it isn't already. If the element’s window is not key window, Detox attempts making it the key window.

```js
await element(by.id('textField')).clearText();
```

### `tapReturnKey()`
Simulates tapping on the return key into the element, using the system's builtin keyboard and typing behavior.

On iOS, any element can be sent return key input, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol. Before tapping on the return key, Detox attempts making the element the first responder, if it isn't already. If the element’s window is not key window, Detox attempts making it the key window.

```js
await element(by.id('textField')).tapReturnKey();
```

### `tapBackspaceKey()`

Simulates tapping of the backspace key into the element, using the system's builtin keyboard and typing behavior.

On iOS, any element can be sent backspace key input, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol. Before tapping on the backspace key, Detox attempts making the element the first responder, if it isn't already. If the element’s window is not key window, Detox attempts making it the key window.

```js
await element(by.id('textField')).tapBackspaceKey();
```
### `setColumnToValue(column, value)`  iOS only

Sets the element's specified column to the specified value, using the system's picker view APIs.

Values accepted by this method are strings only, and the system will do its best to match complex picker view cells to the string.

This function does not support date pickers. Use [`.setDatePickerDate()`](#setdatepickerdatedatestring-dateformat--ios-only) instead.

`column`—the element's column to set (valid input: number, 0 and above) <br/>
`value`—the string value to set (valid input: string)

```js
await element(by.id('pickerView')).setColumnToValue(1, "6");
await element(by.id('pickerView')).setColumnToValue(2, "Hello World");
```

>  **Note:** When working with date pickers, you should always set an explicit locale when launching your app in order to prevent flakiness from different date and time styles. See [here](https://github.com/wix/Detox/blob/master/docs/APIRef.DeviceObjectAPI.md#9-launch-with-a-specific-language-ios-only) for more information.

### `setDatePickerDate(dateString, dateFormat)`  iOS only

Sets the element's date to the specified date string, parsed using the specified date format.

The specified date string is converted by the system to an [`NSDate`](https://developer.apple.com/documentation/foundation/nsdate) object, using [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/dateformatter) with the specified date format, or [`NSISO8601DateFormatter`](https://developer.apple.com/documentation/foundation/iso8601dateformatter) in case of ISO 8601 date strings. If you use JavaScript's [Date.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) or otherwise provide a valid ISO 8601 date string, set the date format to `"ISO8601"`, which is supported as a special case.

`dateString`—the date to set (valid input: valid, parsable date string) <br/>
`dateFormat`—the date format of `dateString` (valid input: `"ISO8601"` or a valid, parsable date format supported by [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/dateformatter))

```js
await element(by.id('datePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "ISO8601");
await element(by.id('datePicker')).setDatePickerDate('2019/02/06', "yyyy/MM/dd");
```

### `adjustSliderToPosition(normalizedPosition)`

Manipulates the UI to change the displayed value of the slider element to a new value, based on a normalized position.

`normalizedPosition`—The normalized position to adjust the slider element. (valid input: [0, 1], 0 corresponds to the minimum value of the slider, and 1 corresponds to the maximum value)

```js
await element(by.id('slider')).adjustSliderToPosition(0.75);
```

### `getAttributes()`

Returns an object, representing various attributes of the element.

Retrieved attributes are:

- `text`: The text value of any textual element.
- `label`: The label of the element. Matches `accessibilityLabel` for ios, and `contentDescription` for android.
- `placeholder`: The placeholder text value of the element. Matches `hint` on android.
- `enabled`: Whether or not the element is enabled for user interaction.
- `identifier`: The identifier of the element. Matches `accessibilityIdentifier` on iOS, and the main view tag, on Android - both commonly **holding the component's test ID in React Native apps**.
- `visible`: whether the element is visible. On iOS, visibility is calculated for the [activation point](https://developer.apple.com/documentation/objectivec/nsobject/1615179-accessibilityactivationpoint). On Android, the attribute directly holds the value returned by [View.getLocalVisibleRect()](https://developer.android.com/reference/kotlin/android/view/View#getglobalvisiblerect)).
- `value`: the value of the element, where applicable. For example: the position of a slider, or whether a checkbox has been marked. Matches `accessibilityValue`, on iOS.

###### iOS-Only
- `activationPoint`: The [activation point](https://developer.apple.com/documentation/objectivec/nsobject/1615179-accessibilityactivationpoint) of the element, in element coordinate space.
- `normalizedActivationPoint`: The activation point of the element, in normalized percentage ([0.0, 1.0]).
- `hittable`: Whether the element is hittable at the activation point.
- `frame`: The frame of the element, in screen coordinate space.
- `elementFrame`: The frame of the element, in container coordinate space.
- `elementBounds`: The bounds of the element, in element coordinate space.
- `safeAreaInsets`: The safe area insets of the element, in element coordinate space.
- `elementSafeBounds`: The safe area bounds of the element, in element coordinate space.
- `date`: The date of the element (in case the element is a date picker).
- `normalizedSliderPosition`: The normalized slider position (in case the element is a slider).
- `contentOffset`: The content offset (in case the element is a scroll view).
- `contentInset`: The content inset (in case the element is a scroll view).
- `adjustedContentInset`: The adjusted content inset (in case the element is a scroll view).

###### Android-Only
- `visibility`: The OS visibility type associated with the element: `visible`, `invisible` or `gone`.
- `width`: Width of the element, in pixels.
- `height`: Height of the element, in pixels.
- `elevation`: Elevation of the element.
- `alpha`: Alpha value for the element.
- `focused`: Whether the element is the one currently in focus.
- `textSize`: The text size for the text element.
- `length`: The length of the text element (character count).

If the value for a given attribute is null or cannot be otherwise computed, the key will not be present, but empty strings may be found in the object.

If the query matches multiple elements, the attributes of all matched elements is returned as an array of objects under the `elements` key.

```js
const attributes = await element(by.text('Tap Me')).getAttributes();
jestExpect(attributes.text).toBe('Tap Me');

const multipleMatchedElements = await element(by.text('Multiple')).getAttributes();
jestExpect(multipleMatchedElements.elements.length).toBe(5);
jestExpect(multipleMatchedElements.elements[0].identifier).toBe('FirstElement');
```

### `takeScreenshot(name)`

Takes a screenshot of the matched element. For full details on taking screenshots with Detox, refer to the [screenshots guide](APIRef.Screenshots.md).

`name`—the name of the screenshot

## Deprecated Methods

- [`.tapAtPoint()`](#tapatpointpoint)
- [`.pinchWithAngle()`](#pinchwithangledirection-speed-angle--ios-only) **iOS only**

### `tapAtPoint(point)`

**Deprecated:** Use [`.tap()`](#tappoint) instead.

Simulates a tap at on the element at the specified point.

`point`—a point in the element's coordinate space

```js
await element(by.id('tappable')).tapAtPoint({x:5, y:10});
```

### `pinchWithAngle(direction, speed, angle)`  iOS only

**Deprecated:** Use [`.pinch()`](#pinchscale-speed-angle--ios-only) instead.

Simulates a pinch on the element with the provided options.

`direction`—the direction of the pinch gesture (valid input: `"inward"`/`"outward"`) <br/>
`speed`—the speed of the pinch (optional, valid input: `"fast"`/`"slow"` , default is `"slow"`) <br/>
`angle`—the angle of the pinch, in radians (optional, default is 0.0)

```js
await element(by.id('PinchableScrollView')).pinchWithAngle('outward', 'slow', 0);
```
