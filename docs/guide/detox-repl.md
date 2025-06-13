# Debugging with Detox REPL

:::caution Important

REPL mode is currently only supported when using **Jest** as the test runner.

:::

Detox provides an interactive Read-Eval-Print Loop (REPL) that allows you to debug tests in real time. It’s particularly useful when exploring app state, running Detox commands manually, or diagnosing failing tests.

## How to activate REPL

REPL is only available when you pass one of the following CLI flags to [`detox test`](../cli/test.md) command:

- `--repl=auto`

  This mode enables **automatic entry into REPL** whenever a test or lifecycle hook fails — in addition to supporting manual `detox.REPL()` calls.

- `--repl`

  Use this mode when you want **manual control**. You must explicitly call `await detox.REPL()` inside your test or lifecycle hooks (e.g. `beforeEach`, `afterEach`, etc.). Detox will pause execution and open an interactive REPL prompt at that point.

  ```ts
  it('should debug manually', async () => {
    await device.launchApp();
    await element(by.id('login')).tap();

    // Pause here for live debugging
    await detox.REPL();

    // Resume test after exiting REPL
  });
  ```

:::tip Technical Note

When you pass `--repl` CLI argument, you disable advanced terminal features which are normally interfering with interactive input. This step is essential for the REPL to function correctly — without it, interactive commands will be ignored, and you'll see a warning message instead.

:::

## Adding Custom Scope

You can expose additional helpers or variables inside the REPL context:

```ts
await detox.REPL({
  utils,
  testUser,
  delay: (ms) => new Promise(res => setTimeout(res, ms)),
});
```

When you enter the REPL, you will be able to access given variables directly, e.g.:

```text
detox> await utils.login(testUser)
detox> await delay(1000)
```

## Using REPL

Once inside, you can:

- Run Detox commands, e.g.: `await element(by.id('foo')).tap()`
- Use `.dumpxml` to inspect view hierarchy
- Use `.pilot` to run natural language commands (requires [Detox Pilot](../pilot/testing-with-pilot.md))
- Use Node.js REPL commands like `.exit`, `.help`, `.editor`, `.save`, etc.

```text
.detox> .help
.break     Sometimes you get stuck, this gets you out
.clear     Alias for .break
.dumpxml   Print view hierarchy XML
.editor    Enter editor mode
.exit      Exit the REPL
.help      Print this help message
.load      Load JS from a file into the REPL session
.pilot     Execute natural language command (e.g. .pilot Tap on login button)
.save      Save all evaluated commands in this REPL session to a file
```

To exit the REPL, either type `.exit` or press `Ctrl+C` twice.

## See also

- [Detox Pilot](../pilot/testing-with-pilot.md)
- [Node.js REPL API](https://nodejs.org/api/repl.html)
