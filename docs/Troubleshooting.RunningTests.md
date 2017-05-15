# Troubleshooting: Running Tests

#### Here we'll try to cover solutions for common issues when running detox tests.

## 1. `Syntax Error: Unxpected Token (`

**Issue:** running tests immediately throw error

```js
beforeEach(async () => {
                   ^
SyntaxError: Unexpected token (
    at Object.exports.runInThisContext (vm.js:76:16)
    at Module._compile (module.js:545:28)
    at loader (/Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/babel-register/lib/node.js:144:5)
    at Object.require.extensions.(anonymous function) [as .js] (/Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/babel-register/lib/node.js:154:7)
    at Module.load (module.js:490:32)
    at tryModuleLoad (module.js:449:12)
    at Function.Module._load (module.js:441:3)
    at Module.require (module.js:500:17)
    at require (internal/module.js:20:19)
    at /Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/mocha/lib/mocha.js:230:27
    at Array.forEach (native)
    at Mocha.loadFiles (/Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/mocha/lib/mocha.js:227:14)
    at Mocha.run (/Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/mocha/lib/mocha.js:495:10)
    at Object.<anonymous> (/Users/builduser/buildAgent/work/34eee2d16ef6c34b/node_modules/mocha/bin/_mocha:460:18)
    at Module._compile (module.js:573:32)
    at Object.Module._extensions..js (module.js:582:10)
    at Module.load (module.js:490:32)
    at tryModuleLoad (module.js:449:12)
    at Function.Module._load (module.js:441:3)
    at Module.runMain (module.js:607:10)
    at run (bootstrap_node.js:382:7)
    at startup (bootstrap_node.js:137:9)
    at bootstrap_node.js:497:3
child_process.js:531
    throw err;
```
**Solution:**

This error means that your version of Node can not understand the async-await syntax. You should do one of the two:

1. Update Node to a version **higher than 7.6.0**, this versions will provide native support for async-await, and will spare the need to babel the test code (**recommended**, as it will save babel setup boilerplate, and make it easier to debug you tests).
2. If you can't use newer version of Node, you'll need to babel your test code, read more about it [here](https://babeljs.io/)

## 2. Can't find my component even though I added `testID` to its props

**Issue:** detox fails finding a component even though it has a testID. Detox will throw the following error:

```json
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


**Solution:**:  React Native only handles `testID`s of its builtin components, if you created a custom component, you will have to pass the testID prop into the underlying builtin component.

Choose which builtin component in your custom component hierarchy will inherit the testID:

```jsx
export class CustomComponent extends Component {

  render() {
    return (
      <TouchableComponent testID={this.props.testID} onPress={props.onPress}>
        <View style={[styles.wrapper, props.style]}>
          <Text style={styles.text}>{props.children}</Text>
        </View>
      </TouchableComponent>
    );
  }
}
```

Then you can add testID to your component, react native will now pass this testID when it renders the view.

```js
render() {
	return <CustomComponent testID="someId"/>
}
```



## 3. `detox build`/`detox test` are failing to run

**Issue:** Trying to run `detox build` or `detox test` throw the following error:

```js
Error: Cannot determine which configuration to use. use --configuration to choose one of the following:
                  ios.sim.release,ios.sim.debug
  at Detox.initConfiguration (/Users/rotemm/git/github/detox/detox/src/Detox.js:73:13)
  at Detox.init (/Users/rotemm/git/github/detox/detox/src/Detox.js:49:16)
  at process._tickCallback (internal/process/next_tick.js:103:7)
```

**Solution:** You have configured more than one configuration in your package.json, and detox can not understand which one of them you want to run.  The error will print a list of available configurations, choose one by using `--configuration` option.

Run your commands with one of these configrations:

`detox build --configration ios.sim.debug`<br>
`detox test --configration ios.sim.debug`


## 4. Debug view hierarchy

**Issue:** I went over issue #2, and I still can't find view by id in my tests.

**Solution:** You can investigate the application's native view hierarchy, this might help shedding some light on how the app's view hierarchy is laid out.

you would need to do the following: 

1. Start a debuggable application (not a release build) in your simulator.
2. Open Xcode
3. Attach you Xcode you your application's process.
<img src="img/attach-to-process.jpg">
4. Press the `Debug View Hierarchy` button.
<img src="img/debug-view-hierarchy.jpg">
5. This will open the hierarchy viewer, and will show a breakdown of your app's native view hierarchy. Here you can browse through the views.
6. React Native testIDs are convereted to accessibility indentifiers in the native view hierarchy. We will now try to find the following view in the native hierarchy.

```js
<TouchableOpacity onPress={this.onButtonPress.bind(this, 'ID Working')}>
	<Text testID='UniqueId345' style={{color: 'blue', marginBottom: 20}}>ID</Text>
</TouchableOpacity>
```

This is the hierarchy viewer, pointing at the view we just mentioned above.
<img src="img/hierarchy-viewer.jpg">