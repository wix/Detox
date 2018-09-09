---

id: element

---

Detox uses **Matchers** to find UI `elements` in your app, **Actions** to emulate user interaction with those `elements` and **Expectations** to verify values on those `elements`.

## tap

Simulate tap on an element.

- `await element(by.id('tappable')).tap();`
  ,

## tapAtPoint

Simulate tap at a specific point on an element.<br><br>
Note: The point coordinates are relative to the matched element and the element size could changes on different devices or even when changing the device font size.

- `await element(by.id('tappable')).tapAtPoint({x:5, y:10});`
  ,

## longPress

Simulate long press on an element.

- `await element(by.id('tappable')).longPress();`
  ,

## multiTap

Simulate multiple taps on an element.

- `await element(by.id('tappable')).multiTap(3);`
  ,

## typeText

Use the builtin keyboard to type text into a text field.

- `await element(by.id('textField')).typeText('passcode');`
  ,

## replaceText

Paste text into a text field.

- `await element(by.id('textField')).replaceText('passcode again');`
