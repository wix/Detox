# Dealing with Element Matching Issues

The preferred matching technique is always matching based on test ID's.

React Native only supports the `testID` prop on the native built-in components. If you’ve created a custom composite component, you will have to support this prop yourself. You should probably propagate the `testID` prop to one of your rendered children (a built-in component):

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

Now, adding `testID` to your composite component should work:

```jsx
render() {
  return <MyCompositeComponent testID='MyUniqueId123' />;
}
```

## Debug View Hierarchy

You can also investigate the app’s native view hierarchy, this might shed some light on how the app’s view hierarchy is laid out and therefore why an element matching doesn't work (perhaps a test ID should be used, or the matcher should be improved).

On iOS, one way this can be done is by using `xcode`. Do the following:

1. Start a debuggable app (not a release build) in your simulator
1. Open Xcode
1. Attach Xcode to your app’s process
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

There are other techniques for doing this with xcode, and also on Android -- coming soon!
