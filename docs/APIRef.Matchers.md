# Matchers

Detox uses **Matchers** to find UI `elements` in your app, **Actions** to emulate user interaction with those `elements` and **Expectations** to verify values on those `elements`.


Matchers find elements in your app that match one or more properties.

**NOTE: Whenever possible we recommend to match elements `by.id`, these are more resilient to layout restructuring and text/language changes**

### Methods

- [`by.id()`](#byidid)
- [`by.text()`](#bytexttext)
- [`by.label()`](#bylabellabel)
- [`by.type()`](#bytypenativeviewtype)
- [`by.traits()`](#bytraitstraits)

- [Advanced](#advanced)


#### `by.id(id)`
`by.id` will match an id that is given to the view via [`testID`](https://facebook.github.io/react-native/docs/view.html#testid) prop.

In a React Native component add testID like so:

```js
<TouchableOpacity testID={'tap_me'}}>
...
```

Then match with `by.id`:

```js
await element(by.id('tap_me'));
```


For other cases, and only if you can't use `by.id` there is a variety of options:

#### `by.text(text)`
Find an element by text, useful for text fields, buttons.

```js
await element(by.text('Tap Me'));
```

#### `by.label(label)`
Find an element by accessibilityLabel(iOS) or contentDescription(Android), useful for text fields, buttons.

```js
await element(by.label('Welcome'));
```

#### `by.type(nativeViewType)`
Find an element by native view type.

```js
await element(by.type('RCTImageView'));
```
#### `by.traits([traits])`
Find an element with an accessibility trait. (iOS only)

```js
await element(by.traits(['button']));
```

#### Advanced
##### By id and by parent id

```js
await element(by.id('Grandson883').withAncestor(by.id('Son883')));

```
##### By id and by child id

```js
await element(by.id('Son883').withDescendant(by.id('Grandson883')));
```

###### Example
- To find the view with the id `Son883`  

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
	

##### Multiple matchers

```js
await element(by.id('UniqueId345').and(by.text('some text')));
```
##### Choose from multiple elements matching the same matcher using index

```js
await element(by.text('Product')).atIndex(2);
```

**Tip**: To find the back button on iOS use: 

```js
 await element(by.traits(['button']).and(by.label('Back')));
```
