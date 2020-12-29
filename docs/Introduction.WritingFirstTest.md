# Writing Your First Test

This tutorial assumes you've already installed Detox successfully on a working React Native project.

## Detox Recorder

Check out [Detox Recorder](https://github.com/wix/DetoxRecorder), our tool for recording tests directly from your device.

## Step 1: Prepare a JavaScript File to Hold Your Scenario (Spec)

Every Detox test scenario is usually placed in its own JavaScript file. If you've followed the [installation tutorial](Introduction.GettingStarted.md), these files are located in `/e2e/*.spec.js` under your React Native project root. Feel free to place these files wherever you like, this directory structure is just a recommendation.

If you're using Mocha as your test runner, these files will simply be executed one by one when you run your tests.

If you've followed the installation tutorial, you should already have `firstTest.spec.js` as a placeholder to start from.

## Step 2: Decide how to Reset Your App for the Beginning of the Scenario

In order to start the scenario from a predictable app state and reset the state from any previous scenarios that may have been running, it's customary to start the scenario by restarting the app.

The fastest way to reset is by calling `await device.reloadReactNative();`. This is equivalent to pressing CMD+R in the simulator window - it will just reload the React Native bundle. You can find other alternatives that may be slower but more thorough [here](APIRef.DeviceObjectAPI.md).

Our scenario is made from multiple different test cases (`it()` clauses). We usually want to reset before each one is running. This can be accomplished by placing the reset logic inside a `beforeEach()` clause.

## Step 3: Add `testID`s to Your App to Assist in Matching Elements

Most test cases start by finding a UI element on screen (*matching*) and performing some user interaction on it (*action*). To assist in finding the correct UI element, it's recommended to mark it in some way. The best practice is to use the [`testID`](https://facebook.github.io/react-native/docs/view.html#testid) prop for this purpose. This means we'll modify the app code and add these props to various elements.

Note that not all React components support this prop. Most of the built-in native components in React Native like `View`, `Text`, `TextInput`, `Switch`, `ScrollView` have support though. If you create your own composite components, you will have to propagate this prop manually to the correct native component.

```jsx
<View>
  <TouchableOpacity testID='MyUniqueId123'>
    <Text>Some button</Text>
  </TouchableOpacity>
</View>
```

## Step 4: Match an Element and Perform an Action

Choose a method to match your element, the various alternatives are documented [here](APIRef.Matchers.md). You will most likely be relying on `testID` which means our matching code will look like `element(by.id('MyUniqueId123'))`.

Choose an action to perform on the element, the various alternatives are documented [here](APIRef.ActionsOnElement.md). If we have a button, a `tap` is probably what you're looking for, resulting in this code:

```jsx
await element(by.id('MyUniqueId123')).tap();
```

## Step 5: Set an Expectation on the Result

After performing the action, the app will most likely do something. The process might also take a little time - for example if we're logging in, there would be a server request. The great thing about detox is that you're not supposed to worry about synchronization and how much time actions take. Detox will monitor the app and continue to the next line in your test only when the app completes pending operations and becomes idle.

The most natural expectation is to verify that some UI element has eventually appeared on screen as a result. Like before, we'll need to match this element first. We can keep using `testID` for this purpose with `element(by.id('AnotherUniqueId456'))`.

The various available expectations are documented [here](APIRef.Expect.md). If we want to make sure an element is visible, we'll get:

```jsx
await expect(element(by.id('AnotherUniqueId456'))).toBeVisible();
```

Note that the visibilty matcher makes sure the element is actually visible on screen (at least 75% of it to be exact). If it appears under the fold (eg. the user has to scroll to see it), this specific matcher will fail.

## Step 6: Rinse and Repeat

Create more complicated test cases by stringing actions and expectations one after the other. Explore the rest of the API to see what other things you can do in your tests.

Add more test cases to your file by adding `it()` clauses. Add new scenarios by adding new `*.spec.js` files.

## Step 7: Run Your Tests and Make Sure They Pass

This is usually done by running `detox test` in terminal. If your test is not passing and you don't understand why, take a look at the [troubleshooting tutorial](Troubleshooting.RunningTests.md).

How do you continue from here? Read about the various recommended workflows with detox documented [here](Introduction.Workflows.md). Hopefully you'll find a workflow that makes sense moving forward and complements your development process.
