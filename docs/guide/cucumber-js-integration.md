# Cucumber.js Integration

Cucumber is a tool for running automated tests written in plain language. It works well with detox.

When you are working with cucumber, you have to manage a few of detox apis from cucumber [hooks](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/hooks.md)

In your `init.js` or `init.ts` file, Please import `detox/internals` on top of the file

```js
import detox from 'detox/internals'
```

and let's suppose you want to use these hooks

```js
import { Before, BeforeAll, AfterAll, After,  ITestCaseHookParameter } from '@cucumber/cucumber'
```

At the start of the file you should start with the first thing that will be run in cucumber which is `BeforeAll` and inside we should initialize everything you need before the test start like `detox.init()` and `detox.launchApp()`

```js
BeforeAll({ timeout: 120 * 1000 }, async () => {
    await detox.init()
    await device.launchApp()
})
```
We also have to explicitly tell cucumber what do you want to do before each case and let the detox know that cucumber has started the test with `detox.onTestStart`. If you don't put this in, the screenshots and video artifacts won't be saved(If you send screenshot/video to capture test when it's started).

```js
Before(async (message: ITestCaseHookParameter) => {
    const { pickle } = message
    await detox.onTestStart({
        title: pickle.uri,
        fullName: pickle.name,
        status: 'running',
    })
})
```

You should then followed by things you want to do after each test and let the detox that the test is done. If you don't put this in, the screenshot and video artifacts won't be saved(If you send screenshot/video to capture test when it's done).

```js
After(async (message: ITestCaseHookParameter) => {
    const { pickle, result } = message
    await detox.onTestDone({
        title: pickle.uri,
        fullName: pickle.name,
        status: result ? 'passed' : 'failed',
    })
})
```

You should then finish the set up with things you want to do after all the test is done. For example clean everything up with `detox.cleanup()`

```js
AfterAll(async () => {
    await detox.cleanup()
})
```

For more information on cucumber.js please check out this [documentation](https://github.com/cucumber/cucumber-js#documentation)
