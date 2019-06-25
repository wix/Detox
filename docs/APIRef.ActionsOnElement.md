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
- [`.scroll()`](#scrollpixels-direction)
- [`.scrollTo()`](#scrolltoedge)
- [`.swipe()`](#swipedirection-speed-percentage)
- [`.setColumnToValue()`](#setcolumntovaluecolumn-value--ios-only) **iOS only**
- [`.pinchWithAngle()`](#pinchwithangledirection-speed-angle--ios-only) **iOS only**
- [`.setDatePickerDate()`](#setdatepickerdatedatestring-dateformat--ios-only) **iOS only**


### `tap()`
Simulate tap on an element.

```js
await element(by.id('tappable')).tap();
```

### `longPress(duration)`
Simulate long press on an element.
duration - long press time interval. (iOS only)

```js
await element(by.id('tappable')).longPress();
```

### `multiTap(times)`
Simulate multiple taps on an element.

```js
await element(by.id('tappable')).multiTap(3);
```
### `tapAtPoint()`
Simulate tap at a specific point on an element.

Note: The point coordinates are relative to the matched element and the element size could changes on different devices or even when changing the device font size.

```js
await element(by.id('tappable')).tapAtPoint({x:5, y:10});
```

### `tapBackspaceKey()`
Tap the backspace key on the built-in keyboard.

```js
await element(by.id('textField')).tapBackspaceKey();
```

### `tapReturnKey()`
Tap the return key on the built-in keyboard.

```js
await element(by.id('textField')).tapReturnKey();
```

### `typeText(text)`
Use the builtin keyboard to type text into a text field.

```js
await element(by.id('textField')).typeText('passcode');
```

> **Note:** Make sure to toggle the software keyboard on text fields.
>
> To do this, open the simulator, tap any text field in your app, then select **Hardware** -> **Keyboard** -> **Toggle Software Keyboard** (⌘K) to automatically toggle the builtin keyboard on each time a text field is tapped in your tests.

> **Note:** Make sure hardware keyboard is disconnected. Otherwise, Detox may fail when attempting to type text.
>
> To make sure hardware keyboard is disconnected, open the simulator from Xcode and make sure **Hardware** -> **Keyboard** -> **Connect Hardware Keyboard** is deselected (or press ⇧⌘K).

### `replaceText(text)`
Paste text into a text field.

```js
await element(by.id('textField')).replaceText('passcode again');
```

### `clearText()`
Clear text from a text field.

```js
await element(by.id('textField')).clearText();
```

### `scroll(pixels, direction, startPositionX=NaN, startPositionY=NaN)`

Scroll amount of pixels.
pixels - independent device pixels
direction - left/right/top/bottom
startPositionX - The X starting scroll position, in percentage; valid input: (0.0, 1.0), `NaN`; default: `NaN`—Choose the best value
startPositionY - The Y starting scroll position, in percentage; valid input: (0.0, 1.0), `NaN`; default: `NaN`—Choose the best value

```js
await element(by.id('scrollView')).scroll(100, 'down', NaN, 0.85);
await element(by.id('scrollView')).scroll(100, 'up');
```

### `scrollTo(edge)`

Scroll to edge.

edge - left/right/top/bottom

```js
await element(by.id('scrollView')).scrollTo('bottom');
await element(by.id('scrollView')).scrollTo('top');
```

### `swipe(direction, speed, percentage)`

direction - left/right/up/down
speed - fast/slow - default is fast
percentage - (optional) screen percentage to swipe as float

```js
await element(by.id('scrollView')).swipe('down');
await element(by.id('scrollView')).swipe('down', 'fast');
await element(by.id('scrollView')).swipe('down', 'fast', 0.5);
```
### `setColumnToValue(column, value)`  iOS only

column - date picker column index
value - string value to set in column

```js
await expect(element(by.type('UIPickerView'))).toBeVisible();
await element(by.type('UIPickerView')).setColumnToValue(1,"6");
await element(by.type('UIPickerView')).setColumnToValue(2,"34");
```

>  **Note:** When working with date pickers, you should always set an explicit locale when launching your app in order to prevent flakiness from different date and time styles. See [here](https://github.com/wix/Detox/blob/master/docs/APIRef.DeviceObjectAPI.md#9-launch-with-a-specific-language-ios-only) for more information.

### `pinchWithAngle(direction, speed, angle)`  iOS only

direction - inward/outward
speed - slow/fast - default is slow
angle - value in radiant - default is 0

```js
await expect(element(by.id('PinchableScrollView'))).toBeVisible();
await element(by.id('PinchableScrollView')).pinchWithAngle('outward', 'slow', 0);
```

### `setDatePickerDate(dateString, dateFormat)`  iOS only

dateString - string representing a date in the supplied dateFormat
dateFormat - format for the dateString supplied

```js
await expect(element(by.type('UIDatePicker'))).toBeVisible();
await element(by.type('UIDatePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "yyyy-MM-dd'T'HH:mm:ssZZZZZ");
```
