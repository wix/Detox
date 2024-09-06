# Adding test ID's to your components

:::info Note

This guide was written primarily for React Native apps, but it can be generalized for testing any app, including native apps.

:::

While [view-element matching](../api/matchers.md) can be done in numerous ways, it is always the best idea to match based on something unique and decoupled, as it ensures that the test code is clear, stable and sustainable over time.

We recommend assigning unique test ID's to the elements you're aiming to interact with in your tests, and preferring matching based on those rather than on anything else. Test ID's are the least likely to change over time (compared with raw text, for example), and are locale-agnostic. Furthermore, utilizing unique test ID's across the app not only simplifies the identification and interaction with specific elements but also enhances code navigability, making it easier to locate elements when traversing the codebase.

In React Native applications, `View` components have a dedicated [test ID property](https://reactnative.dev/docs/view#testid) that can be utilized:

```jsx
<View>
  <TouchableOpacity testID="Onboarding.Next_button">
    <Text>Next</Text>
  </TouchableOpacity>
</View>
```

For native apps, test ID's can be assigned by setting a value for the following properties:

- **iOS:** [`accessibilityIdentifier`](https://developer.apple.com/documentation/uikit/uiaccessibilityidentification/1623132-accessibilityidentifier)
- **Android:** Default [viewTag](https://developer.android.com/reference/android/view/View#tags)

## Pass testID to your native components

Passing a `testID` to your custom component props has no effect until you forward it down to a native component like `<View />` or `<TouchableOpacity />`
that implements rendering it as an accessibility identifier in the native component hierarchy:

![Pass testID to native component](../img/test-id/passTestID.png)

For example, you have `<YourCustomComponent />` and you pass a `testID` to it:

```jsx title="YourScreen.jsx"
function YourScreen() {
  return (
    <YourCustomComponent testID="YourCustomComponent" />
  );
}
```

Make sure that your implementation passes `testID` to some React Native component that supports it:

```jsx title="YourCustomComponent.jsx"
function YourCustomComponent(props) {
  return (
// highlight-next-line
    <View testID={props.testID}>
      <Text>Some text</Text>
    </View>
  );
}
```

### Child elements

If your component has several useful child elements, it is even a better idea to assign them some derived test IDs, e.g.:

```jsx title="YourCustomComponent.jsx"
function YourCustomComponent(props) {
  return (
// highlight-next-line
    <View testID={props.testID}>
      <Text testID={`${props.testID}.label`}>Some text</Text>
    </View>
  );
}
```

That way, you could refer to specific elements in Detox tests via the most basic and least ambiguous `by.id` matchers, e.g.:

```js
expect(element(by.id('YourCustomComponent'))).toBeVisible();
expect(element(by.id('YourCustomComponent.label'))).toHaveText('Some text');
```

### Repetitive components

It is highly not recommended to use non-unique `testID`, e.g. when your components get rendered in any sort of repeater or virtualized list:

```jsx title="YourScreen.jsx"
const ITEMS = [
  { title: 'First Item' },
  { title: 'Second Item' },
  { title: 'Third Item' },
];

function YourScreen() {
  const renderItem = ({ item }) => (
// highlight-next-line
    <YourCustomComponent testID={'listItem'} label={item.title} />
  );

  return (
      <FlatList
        data={ITEMS}
        renderItem={renderItem}
      />
  );
}
```

This would be a violation of accessibility guidelines and unnecessary complication for your test matchers.
You’d also have to use extra matchers and `.atIndex` clarification:

```js
expect(element(by.id('listItem')).atIndex(2)).toHaveText('Third Item');
```

Instead, you could generate a unique `testID` for every list item with the `index` property:

```jsx
  const renderItem = ({ item, index }) => (
    <YourCustomComponent testID={`listItem.${index + 1}`} label={item.title} />
  );
```

That way, your assertion would become simpler and more deterministic:

```js
expect(element(by.id('listItem.3'))).toHaveText('Third Item');
```

![testID for repetitive components](../img/test-id/repetitiveComponentTestID.png)

## Finding your test ID

:::note

Incorrect or absent `testID` is a common cause for test failure.
If your test can't find your `testID` and you can't see it either using tools described below, that usually means you haven't passed it down to this component.
Make sure you keep forwarding it down until it reaches a native component.

:::

To make sure your `testID` is indeed rendered in your app, you can use such tools as MacOS' built-in [accessibility inspector](https://developer.apple.com/documentation/accessibility/inspecting-the-accessibility-of-screens) for iOS, and [Detox Layout-inspector](https://github.com/wix-incubator/detox-inspector) (setup required) for Android.

## Test ID naming - Best practices

Test ID's work best when they are unique, simple and concise. Here are our recommendations regarding what rules to follow in terms of naming.

### Use a consistent naming system

Decide upon a system by which test ID's are named, and stick with it.

1. Use a consistent naming convention. An `ITEM_NAME_ALL_CAPS` convention and an `ItemNameUpperCamelCase` are both ok, but **don't use them either intermittently nor in conjunction:**

   - `SITE_LIST_ROOT` & `SITE_LIST_ITEM_1` - :white\_check\_mark:
   - `SITE_LIST_ROOT` & `SiteList_Item1` - :x:
   - `SITE_LIST_Item1` - :x:
1. Consistently apply notations for special items. For example:
   - A `_ROOT` postfix for screen-root or list-root items (e.g. `SITE_LIST_ROOT`)
   - A `_BTN` for buttons / touchable CTA elements
1. Apply consistent prefixes as categories in order to introduce a top-level context to the test ID, distinguishing it from similar ones in various places in the app. The name of the associated screen can be useful in that sense. For example: `EDIT_PROFILE_SCREEN.DONE_BTN` is better than just `DONE_BTN` for a button that is inside a user profile editing screen. Also, things such as `NAV_TABS.`, `TOP_TABS.` and `SIDE_MENU.` can be used as good context providers.
1. As explained in the section on passing test ID's to _child_ elements, drill down to the details of elements via a _chain of contexts_. Given the parent element-group of an element (for example, a card in a feed), use its own test ID as a prefix for the sub-items (e.g. an options "meatballs" / "kebab" CTA or an _edit_ button). For example:
   - `SITE_LIST_ITEM1` ⇒
     - `SITE_LIST_ITEM1.OPTIONS`
     - `SITE_LIST_ITEM1.EDIT_BTN`
     - `SITE_LIST_ITEM1.TITLE`
1. In a large-scale, multi-module environment, apply a consistent module identifier as the module's test ID's prefix. For example:
   - `AUTH.LOGIN_SCREEN.EDIT_PASSWORD` - the `AUTH.` prefix suggests that were are under the context of a module handling Authentication matters.

:::tip

Don't hesitate to articulate a well defined conventions manifest that all teams should adhere to.

:::

### Use simple names

Stick to simple alpha-numeric characters, and simple separators. When it comes to test ID's, there's usually no reason to use special characters or emojis.

In addition, use test ID that clearly describe the associated element, but are also concise. For example:

- `SITE_LIST_ROOT` - :white\_check\_mark:
- `MAIN_SITE_LIST_WRAPPER_ELEMENT` - :x:
- `SITE_LIST@ITEM$1` - :x:

### Dissociate test ID names

Make sure the names you give test ID's are completely decoupled and dissociated from everything else in the system. In particular -

:::warning Attention

By all means, **never utilize the element's text / label in the naming of a test ID!**
Namely, a test ID should never use `text` or `label` props passed to a React Native component.

:::

There are at least 2 reasons why this is a very important rule:

1. Alternation of test ID's can lead to broken tests (test-ID based matchers become obsolete), and on-screen text can change frequently.
1. In apps supporting multiple languages, the on-screen text is likely to be different in each language. You want the same test code to be compatible with any language set into the test device, and you therefore need it have as little awareness to it as possible. Using test ID's is the best means to keep it that way.

### Examples

Based on the `ALL_CAPS` convention, here is an example of a screen which test ID's illustrate the principles of this discussion:

![Test ID: Naming example](../img/test-id/naming-example.png)
