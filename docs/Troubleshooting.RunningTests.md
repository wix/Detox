# Failing Tests

* [Trace Mode](#trace-mode)
* [Syntax Error: Unxpected Token](#syntax-error-unxpected-token)
* [Can't Find My Component Even Though I Added a `testID` to Its Props](#cant-find-my-component-even-though-i-added-a-testid-to-its-props)
* [Test Tries to Find My Component Before It's Created](#test-tries-to-find-my-component-before-its-created)
* [Can't synchronize the test with my app](#cant-synchronize-the-test-with-my-app)
* [`detox build` or `detox test` are Failing to Run](#detox-build-or-detox-test-are-failing-to-run)
* [An Element is Not Visible](#an-element-is-not-visible)
* [Debug View Hierarchy](#debug-view-hierarchy)
* [Compare to a Working Setup](#compare-to-a-working-setup)
* [Take a Look at Past Issues](#take-a-look-at-past-issues)
* [How to Open a New Issue](#how-to-open-a-new-issue)

### Trace Mode

It's a good idea to get as much information as possible about what's going on. We can enable trace mode during tests by running our tests with:

```
detox test --loglevel trace
```


### Enable debugging of synchronization issues

See [here](https://github.com/wix/detox/blob/master/docs/Troubleshooting.Synchronization.md#identifying-which-synchronization-mechanism-causes-us-to-wait-too-much).

### Syntax Error: Unexpected Token

**Issue:** Running tests immediately throws the following error:

```js
beforeEach(async () => {
                   ^
SyntaxError: Unexpected token (
    at Object.exports.runInThisContext (vm.js:76:16)
    at Module._compile (module.js:545:28)
    at loader (/Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/babel-register/lib/node.js:144:5)
    at Object.require.extensions.(anonymous function) [as .js] (/Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/babel-register/lib/node.js:154:7)
...
child_process.js:531
    throw err;
```

**Solution:** This error means that your version of Node does not support `async-await` syntax. You should do the following:

1. Update Node to a version **8.3.0 or higher**.

### Can't Find My Component Even Though I Added a `testID` to Its Props

**Issue:** Detox fails to match a component even though it has a `testID`. Detox will throw the following error:

```
Error: Cannot find UI Element.
Exception with Assertion: {
  "Assertion Criteria" : "assertWithMatcher: matcherForSufficientlyVisible(>=0.750000)",
  "Element Matcher" : "(((respondsToSelector(accessibilityIdentifier) && accessibilityID('Welcome')) && !kindOfClass('RCTScrollView')) || (kindOfClass('UIScrollView') && ((kindOfClass('UIView') || respondsToSelector(accessibilityContainer)) && ancestorThatMatches(((respondsToSelector(accessibilityIdentifier) && accessibilityID('Welcome')) && kindOfClass('RCTScrollView'))))))",
  "Recovery Suggestion" : "Check if element exists in the UI, modify assert criteria, or adjust the matcher"
}

Error Trace: [
  {
    "Description" : "Interaction cannot continue because the desired element was not found.",
    "Domain" : "com.google.earlgrey.ElementInteractionErrorDomain",
    "Code" : "0",
    "File Name" : "GREYElementInteraction.m",
    "Function Name" : "-[GREYElementInteraction matchedElementsWithTimeout:error:]",
    "Line" : "119"
  }
]
```

**Solution:** React Native only supports the `testID` prop on the native built-in components. If you've created a custom composite component, you will have to support this prop yourself. You should probably propagate the `testID` prop to one of your rendered children (a built-in component):

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

### Test Tries to Find My Component Before It's Created

**Issue:** Due to a synchronization issue, the test tries to perform an expectation and fails because it runs the expectation too soon. Consider this example:

```js
await element(by.text('Login')).tap();
await expect(element(by.text('Welcome'))).toBeVisible();
```

In the test above, after tapping the Login button, the app performs several complex asynchronous operations until the Welcome message is displayed post-login. These can include querying a server, waiting for a response and then running an animated transition to the Welcome screen. Detox attempts to simplify your test code by synchronizing *automatically* with these asynchronous operations. What happens if for some reason the automatic synchronization doesn't work? As a result, Detox will not wait correctly until the Welcome screen appears and instead will continue immediately to the next line and try to run the expectation. Since the screen is not there yet, the test will fail.

**Solution:** When you suspect that automatic synchronization didn't work, you have a fail-safe by synchronizing manually with `waitFor`. Using `waitFor` will poll until the expectation is met. This isn't a recommended approach so please use it as a workaround and open and issue to resolve the synchronization issue.

Full documentation about `waitFor` is available [here](/docs/APIRef.waitFor.md). This is what the fixed test would look like:

```js
await element(by.text('Login')).tap();
await waitFor(element(by.text('Welcome'))).toBeVisible().withTimeout(2000);
```

### Can't synchronize the test with my app

If you suspect that the test is failing because Detox fails to synchronize the test steps with your app, take a look at this in-depth [synchronization troubleshooting tutorial](/docs/Troubleshooting.Synchronization.md).

### `detox build` or `detox test` are Failing to Run

**Issue:** Trying to run `detox build` or `detox test` throws the following error:

```
Error: Cannot determine which configuration to use. use --configuration to choose one of the following:
                  ios.sim.release,ios.sim.debug
  at Detox.initConfiguration (/Users/rotemm/git/github/detox/detox/src/Detox.js:73:13)
  at Detox.init (/Users/rotemm/git/github/detox/detox/src/Detox.js:49:16)
  at process._tickCallback (internal/process/next_tick.js:103:7)
```

**Solution:** You have configured more than one configuration in your package.json and detox cannot understand which one of them you want to run. The error will print a list of available configurations, choose one by using `--configuration` option.

Run your commands with one of these configurations, for example:

* `detox build --configuration ios.sim.debug`
* `detox test --configuration ios.sim.debug`

<hr>

**Issue:** In an attempt to run `detox test` the following error is thrown:

```
detox[4498] INFO:  [test.js] node_modules/.bin/mocha --opts e2e/mocha.opts --configuration ios.sim.release --grep :android: --invert

  error: unknown option `--configuration'
```

**Solution:** Upgrade to `detox@^12.4.0` and `mocha@^6.1.3`.
That weird error has been spotted in older versions of `mocha` (including 5.2.0)
and fixed since 6.0.0. In fact, it conceals the genuine error:

```
Error: No test files found
```

If the error appeared after running a short command like `detox test`,
please try out `detox test e2e` (in other words, append the path to your
end-to-end tests folder) - and if that fixes the error, then you deal the
bug in the question and upgrading `detox` and `mocha` should help.

Here's why you need to upgrade to `detox@12.4.0`.  In `12.1.0` there was a
premature deprecation of `"specs"` property in detox section of `package.json`.
The deprecation was revoked in `detox@12.4.0`, and since then `"specs"` property
acts as a fallback if a test folder has not been specified explicitly.

After you upgrade, you can configure the default path to your end-to-end tests folder
in `package.json` (no deprecation warnings starting from `12.4.0`), as shown below:

```diff
 {
   "detox": {
-    "specs": "",  
+    "specs": "your-e2e-tests-folder",
   }
 }
```

Please mind that if your e2e tests are located at the default path (`e2e`),
then you don't need to add `"specs"` property explicitly to `package.json`.

### An Element is Not Visible

On iOS, you may run in a situation, when one of the interactions (tap, scroll, etc.) on an element fails with an error like:

```
Test Failed: View "<RCTScrollView: 0x7f8d32296d70>" is not visible: view does not pass visibility threshold (0% visible of 75% required)
```

1. Try retriving `ui.viewhierarchy` artifact — sometimes examining the hierarchy visually can give you insights.
Add a line `"uiHierarchy": "enabled"` to your artifacts configuration in `.detoxrc.js`, like in an example here: [Artifacts Configuration](https://github.com/wix/Detox/blob/master/docs/APIRef.Configuration.md#artifacts-configuration). After a rerun, you should find
a `ui.viewhierarchy` in a folder of your failing test. Please mind that you need Xcode 12 at least to open `*.viewhierarchy` files.

2. Besides, you can rerun your iOS app with `-detoxDebugVisibility YES` launch argument (do not confuse with Detox CLI arguments). What will happen is, for each view that fails visibility, two images will be saved in your `~/Desktop` folder (e.g., `DETOX_VISIBILITY_CustomView_0x7ffe9f50df10_TEST.png`):

| Visible | Internals |
|:-------:|:---------:|
|<img alt="visible" src="https://user-images.githubusercontent.com/2270433/94178906-68872380-fea4-11ea-845c-c55c25b68c0e.png" height=480>|<img alt="internals" src="https://user-images.githubusercontent.com/2270433/94178919-6c1aaa80-fea4-11ea-8db6-64f1f4b21361.png" height=480>|

The first is supposed to show what is seen on screen. The second shows the internal buffer that Detox tests for visibility; if the pixels aren't transparent enough and less than 75% of tested region is not transparent, the view is not considered visible.

If you are developing a React Native app, then the following applies. If, for instance, you see that tapping fails due to a view with `pointerEvents="none"` obscuring your target — well, the only solutions are: either to make the obscurer a descendant of your target (instead of being a sibling), or to tap on the parent container.

If you see that your issue cannot be solved via testID replacement or a simple hierarchy rearrangment, then there's a chance this is a bug in Detox. Make sure to provide your `ui.viewhierarchy` artifact, the pictures generated with `-detoxDebugVisiblity` option and a comprehensive description of the issue backed up with cold and strong arguments.

### Debug View Hierarchy

**Issue:** I added the `testID` prop but I still can't find the view by id in my tests.

**Solution:** You can investigate the app's native view hierarchy, this might shed some light on how the app's view hierarchy is laid out.

Do the following: 

1. Start a debuggable app (not a release build) in your simulator

2. Open Xcode

3. Attach Xcode to your app's process
<img src="img/attach-to-process.jpg">

4. Press the `Debug View Hierarchy` button
<img src="img/debug-view-hierarchy.jpg">

5. This will open the hierarchy viewer, and will show a breakdown of your app's native view hierarchy. Here you can browse through the views

6. React Native testIDs are manifested as *accessibility indentifiers* in the native view hierarchy 

Let's see an example. We will find the following view in the native hierarchy:

```jsx
<TouchableOpacity onPress={this.onButtonPress.bind(this, 'ID Working')}>
  <Text testID='UniqueId345' style={{color: 'blue', marginBottom: 20}}>ID</Text>
</TouchableOpacity>
```

This is the hierarchy viewer, pointing to the native view just mentioned:

<img src="img/hierarchy-viewer.jpg">

### Compare to a Working Setup

If you feel lost, try starting from a working example for sanity.

There are multiple working examples included in this repo, such as [demo-react-native](/examples/demo-react-native).

First, install, build and make sure the tests are indeed passing. If they are, try comparing this setup with what you have.

### Take a Look at Past Issues

Before opening a new issue, search the [list of issues](https://github.com/wix/detox/issues?utf8=%E2%9C%93&q=is%3Aissue) on GitHub. There's a good chance somebody faced the same problem you are having.

### How to Open a New Issue

Before opening a new issue, please follow the entire troubleshooting guide and go over past issues.

General usage questions should be opened on Stack Overflow, where the core Detox team is active and responds to questions:
https://stackoverflow.com/questions/tagged/detox

If you believe you are seeing a Detox issue, select the correct template from the options, and make sure to fill all requested information in the template. Omitting important information will likely result in a closed issue.