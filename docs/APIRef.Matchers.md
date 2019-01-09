---
id: APIRef.Matchers
title: Matchers
---

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
<TouchableOpacity testID={'tap_me'}>
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
Find an element by `accessibilityLabel` on iOS, or by `contentDescription` on Android.

```js
await element(by.label('Welcome'));
```

#### `by.type(nativeViewType)`
Find an element by native view type. **View types differ between iOS and Android.**

on iOS:

```js
await element(by.type('RCTImageView'));
```

on Android, provide the class canonical name:

```js
await element(by.type('android.widget.ImageView'));
```

#### `by.traits([traits])`
Find an element with an [accessibility trait](https://developer.apple.com/documentation/uikit/accessibility/uiaccessibility/accessibility_traits). (iOS only)

```js
await element(by.traits(['button']));
```

#### Advanced
##### Multiple matchers

```js
await element(by.id('uniqueId').and(by.text('some text')));
```

##### Match by id and by parent id

```js
await element(by.id('child').withAncestor(by.id('parent')));

```
##### Match by id and by child id

```js
await element(by.id('parent').withDescendant(by.id('child')));
```

###### Example
- To find the view with the id `child`  

	```jsx 
	<View testID='grandparent' style={{padding: 8, backgroundColor: 'red', marginBottom: 10}}>
	  <View testID='parent' style={{padding: 8, backgroundColor: 'green'}}>
	    <View testID='child' style={{padding: 8, backgroundColor: 'blue'}}>
	      <View testID='grandchild' style={{padding: 8, backgroundColor: 'purple'}} />
	    </View>
	  </View>
	</View>
	```
	
	Use: 
	
	```js
	// any of the following will work
	await element(by.id('child'));
	await element(by.id('child').withAncestor(by.id('parent')));
	await element(by.id('child').withDescendant(by.id('grandchild')));
	```

#### Dealing with multiple elements matching the same matcher
When a matcher matches multiple views, there are three possible solutions:

1. Use multiple matchers to narrow down the matched results.
2. Add unique identifiers (testIDs) to the view which need to matched.<br>
A common use-case, is adding identifiers to list items. testIDs for FlatList items can be assigned dynamically, by passing `index` in [`renderItem({item, index})`](https://facebook.github.io/react-native/docs/flatlist.html#renderitem) and using it in the component's render function.      

	FlatList `renderItem` function:
	
	```jsx
	renderItem({item, index}) {
	  return (
	       <CustomComponent
	         index={index}
	         ...
	       />
	  );
	}
	```
	`CustomComponent`'s `render` function:

	```jsx
	render() {
	  return (
	    <View>
	      testID={'listitem' + this.props.index}
	      ...
	    </View>
	  );
	}
	```
3. Select a matched view from the matched view list using `atIndex`

	```js
	await element(by.text('Product')).atIndex(2);
	```
**Usage of `atIndex` is not recommended!**, since the order of matched views can not be guaranteed by the system. Recyclable views in [UITableView](https://developer.apple.com/documentation/uikit/uitableview) / [UICollectionView](https://developer.apple.com/documentation/uikit/uicollectionview) / [RecyclerView](https://developer.android.com/guide/topics/ui/layout/recyclerview) or any custom view may even change during scroll, while views are being recycled with new data. 
	React Native FlatList items are being traversed in different ways on the different platforms, causing `atIndex` to return the **opposite indexes on iOS than what it does on Android.**


##### TIP: Finding the back button on iOS 

on iOS 11:

```js
await element(by.traits(['button']).and(by.label('Back')));
```

on iOS 10:

```js
await element(by.type('_UIModernBarButton').and(by.label('Back')));
```
