# Cucumber.js Integration

:::note Community resource

This is an article generously contributed [by the community][initial PR].
Feel free to [contribute to it][Contributing] by submitting a pull request
if you find any errors or have suggestions for improvements.
If you have any questions, please get in touch with the author directly.

:::

[Cucumber] is a tool for running automated tests written in plain language.
It can be integrated with Detox to run end-to-end tests for mobile applications
if you manage [Detox Internals API] from [Cucumber.js hooks].

In your `init.js` or `init.ts` file, please import `detox/internals` on top of the file:

```js
import detox from 'detox/internals'
```

Also import the hooks we'll be using just a bit later:

```js
import { Before, BeforeAll, AfterAll, After,  ITestCaseHookParameter } from '@cucumber/cucumber'
```

Define the earliest [Cucumber.js] hook, `BeforeAll`, where you’ll [initialize][`detox.init()`] Detox and launch the app:

```js
BeforeAll({ timeout: 120 * 1000 }, async () => {
    await detox.init()
    await device.launchApp()
})
```

You must also tell Detox explicitly when [Cucumber.js] starts a test via calling [`detox.onTestStart()`] inside `Before` hook.
Otherwise, Detox won't be able to _start recording_ logs, screenshots, videos, and other artifacts:

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

The symmetrical step is to inform Detox that the current test is over via calling [`detox.onTestDone()`] inside `After` hook.
Otherwise, Detox won't be able to _save_ logs, screenshots, videos, and other artifacts:

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

After the tests are over, you should call [`detox.cleanup()`] inside `AfterAll` hook so that Detox can clean up all the resources it has allocated:

```js
AfterAll(async () => {
    await detox.cleanup();
})
```

For more information on [Cucumber.js] please check out this [documentation][Cucumber.js].

[Cucumber]: https://cucumber.io/

[Cucumber.js]: https://github.com/cucumber/cucumber-js#documentation

[Cucumber.js hooks]: https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/hooks.md

[Initial PR]: https://github.com/wix/Detox/pull/3858

[Detox Internals API]: ../api/internals.mdx

[`detox.init()`]: ../api/internals.mdx#initoptions-promise

[`detox.cleanup()`]: ../api/internals.mdx#cleanup-promise

[`detox.onTestStart()`]: ../api/internals.mdx#onteststartevent-promise

[`detox.onTestDone()`]: ../api/internals.mdx#ontestdoneevent-promise

[Contributing]: ../contributing.md
