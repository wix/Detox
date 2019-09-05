# Actions on Element

Detox uses **Matchers** to find UI `elements` in your app, **Actions** to emulate user interaction with those `elements` and **Expectations** to verify values on those `elements`.


## Actions
Actions are functions that emulate user behavior. They are being performed on matched elements.

### Methods

- [`.tap()`](#tap)
- [`.longPress()`](#longpress)
- [`.multiTap()`](#multitaptimes)
- [`.tapAtPoint()`](#tapatpoint)
- [`.tapBackspaceKey()`](#tapbackspacekey)
- [`.tapReturnKey()`](#tapreturnkey)
- [`.typeText()`](#typetexttext)
- [`.replaceText()`](#replacetexttext)
- [`.clearText()`](#cleartext)
- [`.scroll()`](#scrollpixels-direction-startpositionxnan-startpositionynan)
- [`.scrollTo()`](#scrolltoedge)
- [`.swipe()`](#swipedirection-speed-percentage)
- [`.setColumnToValue()`](#setcolumntovaluecolumn-value--ios-only) **iOS only**
- [`.pinchWithAngle()`](#pinchwithangledirection-speed-angle--ios-only) **iOS only**
- [`.setDatePickerDate()`](#setdatepickerdatedatestring-dateformat--ios-only) **iOS only**


### `tap()`
Simulates a tap on an element.

```js
await element(by.id('tappable')).tap();
```

### `longPress(duration)`
Simulates a long press on an element.
duration - long press time interval. (iOS only)

```js
await element(by.id('tappable')).longPress();
```

### `multiTap(times)`
Simulates multiple taps on an element.

```js
await element(by.id('tappable')).multiTap(3);
```
### `tapAtPoint()`
Simulates a tap at a specific point on an element.

Note: The point coordinates are relative to the matched element and the element size could changes on different devices or even when changing the device font size.

```js
await element(by.id('tappable')).tapAtPoint({x:5, y:10});
```

### `tapBackspaceKey()`
Taps the backspace key on the built-in keyboard.

```js
await element(by.id('textField')).tapBackspaceKey();
```

### `tapReturnKey()`
Taps the return key on the built-in keyboard.

```js
await element(by.id('textField')).tapReturnKey();
```

### `typeText(text)`
Uses the builtin keyboard to type text into a text field.

```js
await element(by.id('textField')).typeText('passcode');
```

### `replaceText(text)`

Pastes text into a text field.

```js
await element(by.id('textField')).replaceText('passcode again');
```

### `clearText()`
Clears text from a text field.

```js
await element(by.id('textField')).clearText();
```

### `scroll(pixels, direction, startPositionX=NaN, startPositionY=NaN)`

Scrolls a given amount of pixels in the provided direction, starting from the provided start positions.
pixels - independent device pixels
direction - left/right/up/down
startPositionX - the X starting scroll position, in percentage; valid input: [0.0, 1.0], `NaN`; default: `NaN`—choose the best value automatically
startPositionY - the Y starting scroll position, in percentage; valid input: [0.0, 1.0], `NaN`; default: `NaN`—choose the best value automatically

```js
await element(by.id('scrollView')).scroll(100, 'down', NaN, 0.85);
await element(by.id('scrollView')).scroll(100, 'up');
```

### `scrollTo(edge)`

Scrolls to the provided edge.

edge - left/right/top/bottom

```js
await element(by.id('scrollView')).scrollTo('bottom');
await element(by.id('scrollView')).scrollTo('top');
```

### `swipe(direction, speed, percentage)`

Swipes in the provided direction at the provided speed, started from percentage.

direction - left/right/up/down
speed - fast/slow - default is fast
percentage - (optional) screen percentage to swipe; valid input: [0.0, 1.0]

```js
await element(by.id('scrollView')).swipe('down');
await element(by.id('scrollView')).swipe('down', 'fast');
await element(by.id('scrollView')).swipe('down', 'fast', 0.5);
```
### `setColumnToValue(column, value)`  iOS only

Sets a picker view’s column to the given value. This function supports both date pickers and general picker views.

column - date picker column index
value - string value to set in column

```js
await expect(element(by.id('pickerView'))).toBeVisible();
await element(by.id('pickerView')).setColumnToValue(1,"6");
await element(by.id('pickerView')).setColumnToValue(2,"34");
```

>  **Note:** When working with date pickers, you should always set an explicit locale when launching your app in order to prevent flakiness from different date and time styles. See [here](https://github.com/wix/Detox/blob/master/docs/APIRef.DeviceObjectAPI.md#9-launch-with-a-specific-language-ios-only) for more information.

### `setDatePickerDate(dateString, dateFormat)`  iOS only

Sets the date of a date picker to a date generated from the provided string and date format.

dateString - string representing a date in the supplied dateFormat
dateFormat - format for the dateString supplied

```js
await expect(element(by.id('datePicker'))).toBeVisible();
await element(by.id('datePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "yyyy-MM-dd'T'HH:mm:ssZZZZZ");
```

### `pinchWithAngle(direction, speed, angle)`  iOS only

Pinches in the given direction with speed and angle.

direction - inward/outward
speed - slow/fast - default is slow
angle - value in radiant - default is 0

```js
await expect(element(by.id('PinchableScrollView'))).toBeVisible();
await element(by.id('PinchableScrollView')).pinchWithAngle('outward', 'slow', 0);
```
