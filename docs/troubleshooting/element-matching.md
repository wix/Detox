# Dealing with Element Matching Issues

The preferred element-matching technique in Detox tests is by using **test ID's**.

In React Native, the `testID` prop is only supported on **built-in native components**. If you’ve created a **custom composite component**, you’ll need to manually pass the `testID` down to a native child component. The most common approach is to propagate it to one of the rendered children that are **native** components (such as `View`, `Text`, or `TouchableOpacity`):

```jsx
export class MyCompositeComponent extends Component {
  render() {
    return (
      <TouchableOpacity testID={this.props.testID}>
        <View>
          <Text>Something something</Text>
        </View>
      </TouchableOpacity>
    );
  }
}
```

Now, when adding a `testID` to your composite component, it will be correctly applied:

```jsx
render() {
  return <MyCompositeComponent testID='MyUniqueId123' />;
}
```

:::tip

For more info about this technique and test ID's in general, read our [guide about test ID's](../guide/test-id.md).

:::

## Debug View Hierarchy

When element matching fails, inspecting the **native view hierarchy** can help diagnose the issue. This allows you to see how elements are structured in the app and determine whether a test ID is missing or the matcher needs to be improved.

On iOS, you can use `xcode` to visualize the native view hierarchy:

1. Start a debuggable app (not a release build) in your simulator
1. Open `xcode`
1. Attach `xcode` to your app’s process
   ![attach to process](../img/attach-to-process.jpg)
1. Press the `Debug View Hierarchy` button
   ![debug view hierarchy](../img/debug-view-hierarchy.jpg)
1. This will open the hierarchy viewer, and will show a breakdown of your app’s native view hierarchy. Here you can browse through the views
1. React Native testIDs are manifested as _accessibility identifiers_ in the native view hierarchy

Let’s see an example. We will find the following view in the native hierarchy:

```jsx
<TouchableOpacity onPress={this.onButtonPress.bind(this, 'ID Working')}>
  <Text testID='UniqueId345' style={{color: 'blue', marginBottom: 20}}>ID</Text>
</TouchableOpacity>
```

This is the hierarchy viewer, pointing to the native view just mentioned:

![hierarchy viewer](../img/hierarchy-viewer.jpg)

There are other techniques for doing this besides using `xcode`, and also on Android -- coming soon!
