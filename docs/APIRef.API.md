# Usage 

```js
describe('Example', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should have welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });
  
  it('should show hello screen after tap', async () => {
    await element(by.id('hello_button')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });
  
  it('should show world screen after tap', async () => {
    await element(by.id('world_button')).tap();
    await expect(element(by.label('World!!!'))).toBeVisible();
  });
})
```

Detox uses **Matchers** to find elements in your app, **Actions** to emulate user interaction with those elements and **Assertions** to test how your app reacts.

### Matchers 
Matchers find elements in your app that match some property.

Whenever possible we recommend to match elements by id: 

```js
await element(by.id('random_id123'))
```

For other cases there is a variety of options: 

```js
// find an element by id (add a 'testID' prop to your view for this to work)
await element(by.id('tap_me'))

// find an element by text
await element(by.label('Tap Me'))

// find an element by id and by parent id
await element(by.id('Grandson883').withAncestor(by.id('Son883')))

// find an element by id and by child id
await element(by.id('Son883').withDescendant(by.id('Grandson883')))

// find an element by native view type
await element(by.type('RCTImageView'))

// multiple matchers
await element(by.id('UniqueId345').and(by.label('ID')))

// Choose from multiple elements matching the same matcher using index
await element(by.label('Product')).atIndex(2)

// find an element with an accessibility trait
await element(by.traits(['button'])
```

#### Example
To find the view with the id `Son883`  

```jsx 
<View testID='Grandfather883' style={{padding: 8, backgroundColor: 'red', marginBottom: 10}}>
  <View testID='Father883' style={{padding: 8, backgroundColor: 'green'}}>
    <View testID='Son883' style={{padding: 8, backgroundColor: 'blue'}}>
      <View testID='Grandson883' style={{padding: 8, backgroundColor: 'purple'}} />
    </View>
  </View>
</View>
```


Use:

```js
// any of the following will work
await element(by.id('Son883'))
await element(by.id('Son883').withAncestor(by.id('Father883')))
await element(by.id('Son883').withDescendant(by.id('Grandson883')))
```
**Tip**: To find the back button use: 

```js
 await element(by.traits(['button']).and(by.label('Back')))
```

A more detailed explanation on matchers can be found [here](../API.md) 

### Actions 
Actions are functions that emulate user behavior:

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

Assertions test how your app behaves:

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
Test async code with waitFor:

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
