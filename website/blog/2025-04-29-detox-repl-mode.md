---
authors:
  - noomorph
tags: [debugging, repl, feature]
---

# Detox REPL Mode: A New Way to Debug Your Tests

Today I'm excited to announce a new feature that will make debugging your Detox tests significantly easier: **REPL Mode**.

## What is REPL Mode?

REPL stands for Read-Eval-Print Loop, and it's a powerful interactive programming environment that lets you execute commands one at a time and see their results immediately. If you've ever used the Node.js console or browser developer tools, you're already familiar with the concept.

With Detox REPL Mode, you can now pause your test execution at any point and interactively explore your app's state, try different Detox commands, and debug issues without having to restart your tests repeatedly.

## How to Use REPL Mode

There are several ways to activate REPL Mode in your Detox tests:

### Using the CLI Flag

The simplest way is to add the `--repl` flag when running your tests:

```bash
detox test --repl -c ios.sim.debug e2e/login.test.js
```

### Programmatic Activation

You can also call `detox.REPL()` directly in your test code to enter REPL mode at a specific point:

```js
describe('Login flow', () => {
  it('should log in successfully', async () => {
    await device.launchApp();
    await element(by.id('email')).typeText('user@example.com');
    
    // Something's not working? Let's debug it!
    await detox.REPL();
    
    // Continue with the test after exiting REPL
  });
});
```

### Auto Mode for Failed Tests

One of my favorite features is the ability to automatically enter REPL mode when a test fails:

```bash
detox test --repl=auto -c ios.sim.debug
```

This is incredibly useful for CI environments where you want to investigate failures without having to manually add REPL calls to your tests.

## What Can You Do in REPL Mode?

Once in REPL mode, you have access to:

- All Detox globals (`device`, `element`, `by`, etc.)
- Standard Node.js REPL commands (`.help`, `.break`, `.clear`, `.exit`)
- Special Detox commands like `.dumpxml` to print the current view hierarchy

You can execute any Detox commands interactively, which makes it perfect for:

- Exploring element hierarchies
- Testing different selectors
- Trying out different interaction sequences
- Debugging timing issues

## Adding Custom Context

A particularly powerful feature is the ability to pass custom objects to the REPL context:

```js
const screenDriver = {
  login: async (username, password) => {
    await element(by.id('email')).typeText(username);
    await element(by.id('password')).typeText(password);
    await element(by.id('loginButton')).tap();
  }
};

await detox.REPL({
  screenDriver,
  testUser: { username: 'test@example.com', password: 'password123' }
});
```

In the REPL session, you can then use these objects:

```
detox> screenDriver.login(testUser.username, testUser.password)
// Executes the login function
```

This is especially useful for teams that use the Page Object Model or similar patterns, as it allows you to leverage your existing abstractions during debugging.

## Integration with Detox Pilot

If you have [Detox Pilot](https://wix.github.io/Detox/docs/pilot/testing-with-pilot) configured, you can use the `.ai` command in REPL mode to execute natural language commands:

```
detox> .ai Tap on the login button
```

This combines the power of interactive debugging with the simplicity of natural language commands.

## Why We Built This

As Detox tests grow more complex, the traditional debugging approaches (console.logs, step-by-step debugging with breakpoints) can become cumbersome. We wanted to provide a more flexible and interactive way to debug tests, especially for those tricky scenarios that are hard to reproduce.

REPL mode was designed to reduce the debugging feedback loop and make it easier to experiment with different approaches without having to restart your tests from scratch each time.

## Future Plans

This is just the beginning for REPL mode. We're planning to add more specialized commands and integrations to make debugging even more efficient. We're also exploring ways to make the REPL experience more visual, potentially integrating with device screenshots and UI inspection tools.

## Try It Today

REPL mode is available starting from the latest version of Detox. Give it a try and let us know what you think! We're always looking for feedback to improve the debugging experience.

To exit REPL mode, simply press Ctrl+C or type `.exit`.

Happy debugging!
