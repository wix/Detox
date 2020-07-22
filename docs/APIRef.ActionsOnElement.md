# Actions

Detox uses [matchers](APIRef.Matchers.md) to find UI elements in your app and actions to simulate user interaction with those elements.

Use [expectations](APIRef.Expect.md) to verify element states.

## Methods

- [`.tap()`](#tappoint)
- [`.multiTap()`](#multitaptimes)
- [`.longPress()`](#longpressduration)
- [`.swipe()`](#swipedirection-speed-percentage)
- [`.pinch()`](#pinchscale-speed-angle--ios-only) **iOS only**
- [`.scroll()`](#scrolloffset-direction-startpositionxnan-startpositionynan)
  - [`whileElement()`](#whileelementelement)
- [`.scrollTo()`](#scrolltoedge)
- [`.typeText()`](#typetexttext)
- [`.replaceText()`](#replacetexttext)
- [`.clearText()`](#cleartext)
- [`.tapReturnKey()`](#tapreturnkey)
- [`.tapBackspaceKey()`](#tapbackspacekey)
- [`.setColumnToValue()`](#setcolumntovaluecolumn-value--ios-only) **iOS only**
- [`.setDatePickerDate()`](#setdatepickerdatedatestring-dateformat--ios-only) **iOS only**
- [`.adjustSliderToPosition()`](#adjustslidertopositionnormalizedposition--ios-only) **iOS only**
- [`.getAttributes()`](#getAttributes--ios-only) **iOS only**
- [`.takeScreenshot()`](#takescreenshot-android-only) **Android only**

### `tap(point)`

Simulates a tap on the element at the specified point, or at element's activation point if no point is specified.

`point`—a point in the element's coordinate space (optional, valid input: object with x and y numerical values)

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

`duration`—the duration to press for, in ms (optional)

```js
await element(by.id('tappable')).longPress();
await element(by.id('tappable')).longPress(1500);
```
### `swipe(direction, speed, percentage)`

Simulates a swipe on the element with the provided options.

`direction`—the swipe's direction (valid input: `"left"`/`"right"`/`"up"`/`"down"`)
`speed`—the speed of the swipe (optional, valid input: `"fast"`/`"slow"` , default is `"fast"`)
`percentage`—the percentage of the element to swipe on (optional, valid input: [0.0, 1.0], default is 0.75)

```js
await element(by.id('scrollView')).swipe('down');
await element(by.id('scrollView')).swipe('down', 'fast');
await element(by.id('scrollView')).swipe('down', 'fast', 0.5);
```
### `pinch(scale, speed, angle)`  iOS only

Simulates a pinch on the element with the provided options.

`scale`—the scale of the pinch gesture; use a scale between 0 and 1 to zoom out, and a scale greater than 1 to zoom in; the system makes a best effort to accommodate the requested scale, taking into account the element's dimensions (valid input: (0.0, inf])
`speed`—the speed of the pinch (optional, valid input: `"fast"`/`"slow"` , default is `"slow"`)
`angle`—the angle of the pinch, in radians (optional, default is 0.0)

```js
await element(by.id('PinchableScrollView')).pinch(1.1); //Zooms in a little bit
await element(by.id('PinchableScrollView')).pinch(2.0); //Zooms in a lot
await element(by.id('PinchableScrollView')).pinch(0.001); //Zooms out a lot
```
### `scroll(offset, direction, startPositionX=NaN, startPositionY=NaN)`

Simulates a scroll on the element with the provided options.

`offset`—the offset to scroll, in points
`direction`—the scroll's direction (valid input: `"left"`/`"right"`/`"up"`/`"down"`)
`startPositionX`—the normalized x percentage of the element to use as scroll start point (optional, valid input: [0.0, 1.0], `NaN`—choose an optimal value automatically)
`startPositionY`—the normalized y percentage of the element to use as scroll start point (optional, valid input: [0.0, 1.0], `NaN`—choose an optimal value automatically)

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

On iOS, any element can be typed into, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol.

`text`—the text to type (valid input: string)

```js
await element(by.id('textField')).typeText('passcode');
```

### `replaceText(text)`

Replaces the element's text with the specified text, without using the system's builtin keyboard or typing behavior. **Note**, that using this method is faster than using [`.typeText()`](#typetexttext), but may not trigger all text input callbacks, causing an undefined state in your app.

On iOS, any element's text can be replaced, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol.

`text`—the text to replace with (valid input: string)

```js
await element(by.id('textField')).replaceText('passcode again');
```

### `clearText()`
Simulates clearing the text of the element, using the system's builtin keyboard and typing behavior.

On iOS, any element's text can be cleared, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol.

```js
await element(by.id('textField')).clearText();
```

### `tapReturnKey()`
Simulates tapping of the return key into the element, using the system's builtin keyboard and typing behavior.

On iOS, any element can be sent return key input, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol.

```js
await element(by.id('textField')).tapReturnKey();
```

### `tapBackspaceKey()`

Simulates tapping of the backspace key into the element, using the system's builtin keyboard and typing behavior.

On iOS, any element can be sent backspace key input, as long as it can become first responder and conforms to the [`UITextInput`](https://developer.apple.com/documentation/uikit/uitextinput) protocol.

```js
await element(by.id('textField')).tapBackspaceKey();
```
### `setColumnToValue(column, value)`  iOS only

Sets the element's specified column to the specified value, using the system's picker view APIs.

Values accepted by this method are strings only, and the system will do its best to match complex picker view cells to the string.

This function does not support date pickers. Use [`.setDatePickerDate()`](#setdatepickerdatedatestring-dateformat--ios-only) instead.

`column`—the element's column to set (valid input: number, 0 and above)
`value`—the string value to set (valid input: string)

```js
await element(by.id('pickerView')).setColumnToValue(1, "6");
await element(by.id('pickerView')).setColumnToValue(2, "Hello World");
```

>  **Note:** When working with date pickers, you should always set an explicit locale when launching your app in order to prevent flakiness from different date and time styles. See [here](https://github.com/wix/Detox/blob/master/docs/APIRef.DeviceObjectAPI.md#9-launch-with-a-specific-language-ios-only) for more information.

### `setDatePickerDate(dateString, dateFormat)`  iOS only

Sets the element's date to the specified date string, parsed using the specified date format.

The specified date string is converted by the system to an [`NSDate`](https://developer.apple.com/documentation/foundation/nsdate) object, using [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/dateformatter) with the specified date format, or [`NSISO8601DateFormatter`](https://developer.apple.com/documentation/foundation/iso8601dateformatter) in case of ISO 8601 date strings. If you use JavaScript's [Date.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) or otherwise provide a valid ISO 8601 date string, set the date format to `"ISO8601"`, which is supported as a special case.

`dateString`—the date to set (valid input: valid, parsable date string)
`dateFormat`—the date format of `dateString` (valid input: `"ISO8601"` or a valid, parsable date format supported by [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/dateformatter))

```js
await element(by.id('datePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "ISO8601");
await element(by.id('datePicker')).setDatePickerDate('2019/02/06', "yyyy/MM/dd");
```

### `adjustSliderToPosition(normalizedPosition)`  iOS only

Manipulates the UI to change the displayed value of the slider element to a new value, based on a normalized position.

`normalizedPosition`—The normalized position to adjust the slider element. (valid input: [0, 1], 0 corresponds to the minimum value of the slider, and 1 corresponds to the maximum value)

```js
await element(by.id('slider')).adjustSliderToPosition(0.75);
```

### `getAttributes()`  iOS only

Returns an object, representing the attributes of the element.

Retrieved attributes are:

- `text`—the text value of the element
- `label`—the label of the element (matches `accessibilityLabel`)
- `value`—the value of the element (matches `accessibilityValue`)
- `placeholder`—the placeholder text value of the element
- `identifier`—the identifier of the element (matches `accessibilityIdentifier`)
- `enabled`—whether or not the element is enabled for user interaction
- `activationPoint`—the activation point of the element, in element coordinate space
- `normalizedActivationPoint`—the activation point of the element, in normalized percentage ([0.0, 1.0])
- `hittable`—whether the element is hittable at the activation point
- `visible`—whether the element is visible at the activation point
- `frame`—the frame of the element, in screen coordinate space
- `elementFrame`—the frame of the element, in container coordinate space
- `elementBounds`—the bounds of the element, in element coordinate space
- `safeAreaInsets`—the safe area insets of the element, in element coordinate space
- `elementSafeBounds`—the safe area bounds of the element, in element coordinate space
- `date`—the date of the element (in case the element is a date picker)
- `normalizedSliderPosition`—the normalized slider position (in case the element is a slider)

If the value for a given attribute is null or cannot be otherwise computed, the key will not be present, but empty strings may be found in the object.

If the query matches multiple elements, the attributes of all matched elements is returned as an array of objects under the `elements` key.

```js
const attributes = await element(by.text('Tap Me')).getAttributes();
jestExpect(attributes.text).toBe('Tap Me');

const multipleMatchedElements = await element(by.text('Multiple')).getAttributes();
jestExpect(multipleMatchedElements.elements.length).toBe(5);
jestExpect(multipleMatchedElements.elements[0].identifier).toBe('FirstElement');
```

### `takeScreenshot()` Android Only

Take a screenshot of the native view associated with the element in question. Useful for highly-focused visual comparison tests (i.e. comparison between elements rather than a whole screen).

Returns the path of a temporary file containing the resulted `.png` image.

```js
const bitmapPath = await element(by.id('fancy-element')).takeScreenshot();

const fs = require('fs');
const bitmapBuffer = fs.readFileSync(bitmapPath);
const snapshottedBitmapBuffer = fs.readFileSync(snapshottedBitmapPath);
if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
  throw new Error('Bitmaps differ!');
}
```

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

`direction`—the direction of the pinch gesture (valid input: `"inward"`/`"outward"`)
`speed`—the speed of the pinch (optional, valid input: `"fast"`/`"slow"` , default is `"slow"`)
`angle`—the angle of the pinch, in radians (optional, default is 0.0)

```js
await element(by.id('PinchableScrollView')).pinchWithAngle('outward', 'slow', 0);
```
