> detox

# API Reference


### Matchers

An entity that defines properties on how to locate a view within the current view hierarchy, either user properies like `id` or `text`, location in view hierarchy and other UI properties.
Views can be matched with multiple matchers.

#### View by `label`

```jsx
<View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
  <Text style={{fontSize: 25, marginBottom: 30}}>
    Welcome
  </Text>
  {this.renderTestButton('Say Hello', this.onButtonPress.bind(this, 'Hello'))}
  {this.renderTestButton('Say World', this.onButtonPress.bind(this, 'World'))}
  </View>
```

Will be matched by:

```js
await element(by.label('Welcome')))
```

#### View by `id`

```jsx 
<View testID='Grandfather883' style={{padding: 8, backgroundColor: 'red', marginBottom: 10}}>
  <View testID='Father883' style={{padding: 8, backgroundColor: 'green'}}>
    <View testID='Son883' style={{padding: 8, backgroundColor: 'blue'}}>
      <View testID='Grandson883' style={{padding: 8, backgroundColor: 'purple'}} />
    </View>
  </View>
</View>
```


Will be matched by:

```js
await element(by.id('Grandson883'))
```

```js
await element(by.id('Grandson883').withAncestor(by.id('Son883')))
```

```js
await element(by.id('Son883').withDescendant(by.id('Grandson883')))
```

#### View by `type` (native class)
Xcode can [display the native view hierarchy](https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/debugging_with_xcode/chapters/special_debugging_workflows.html), by doing so, we can find the native view type, and match by that property.

![Native Hierarchy](detox/RCTImageViewXcode.jpg)


Will be matched by:

```js
await element(by.type('RCTImageView'))
```

#### Choose from multiple elements matching the same matcher using index

```jsx
<View style={{flexDirection: 'row', marginBottom: 20}}>
  <Text testID='ProductId000' style={{margin: 10}}>Product</Text>
  <Text testID='ProductId001' style={{margin: 10}}>Product</Text>
  <Text testID='ProductId002' style={{margin: 10}}>Product</Text>
  <Text testID='ProductId003' style={{margin: 10}}>Product</Text>
</View>
```

```js
await element(by.label('Product')).atIndex(2)
```

#### Multiple matchers
When a single view property is not enough, multiple matchers can be combined

```jsx
<Text testID='UniqueId345' style={{color: 'blue', marginBottom: 20}}>ID</Text>
```

Will be matched by:

```js
await element(by.id('UniqueId345').and(by.label('ID')))
```

### Actions

An entity that interacts with the matched view, simulating user actions.

```js
await element(by.label('Tap Me')).tap();
await element(by.label('Tap Me')).longPress();
await element(by.id('UniqueId819')).multiTap(3);
await element(by.id('UniqueId937')).typeText('passcode');
await element(by.id('UniqueId937')).replaceText('passcode again');
await element(by.id('UniqueId005')).clearText();
await element(by.id('ScrollView161')).scroll(100, 'down');
await element(by.id('ScrollView161')).scroll(100, 'up');
await element(by.id('ScrollView161')).scrollTo('bottom');
await element(by.id('ScrollView161')).scrollTo('top');

// directions: 'up'/'down'/'left'/'right', speed: 'fast'/'slow'
await element(by.id('ScrollView799')).swipe('down', 'fast');
```

### Assertions

The expection entity, asserting that the matched views have certain properties: visibility, content, etc...

```js
await expect(element(by.id('UniqueId204'))).toBeVisible();
await expect(element(by.id('UniqueId205'))).toBeNotVisible();
await expect(element(by.id('UniqueId205'))).toExist();
await expect(element(by.id('RandomJunk959'))).toNotExist();
await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
await expect(element(by.id('UniqueId204'))).toHaveLabel('I contain some text');
await expect(element(by.label('I contain some text'))).toHaveId('UniqueId204');
await expect(element(by.id('UniqueId146'))).toHaveValue('0');
```

### waitFor


```js
await waitFor(element(by.id('UniqueId336'))).toExist().withTimeout(2000);
await waitFor(element(by.label('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
```


### Device control

If this is a react native app, reload react native JS bundle

```js
await device.reloadReactNative();
```

Install the app file defined in the current configuration

```js
await device.installApp();
```

Uninstall the app defined in the current configuration
```js
await device.uninstallApp();
```

### Mocking User Notifications and open From URL
The following command mock starting of the application from various sources

```js
await device.relaunchApp(params);
```

```js
await openURL(url);
```

```js
await sendUserNotification(params);

```
See the [Detailed API](https://github.com/wix/detox/wiki/Mocking-User-Notifications-and-URLs) for more information.
