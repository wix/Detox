# Using TypeScript

:::info

This guide assumes you are using Detox's default test runner integration with Jest.
If you have a custom integration, you need to consult your test runner's documentation
on how to use TypeScript with it.

:::

It is very common among JavaScript developers to use TypeScript in their projects,
so a question arises: **how to use Detox with TypeScript?** Since Detox by default
bases on Jest, the question can be rephrased as: [how to use Jest with TypeScript?](https://jestjs.io/docs/getting-started#using-typescript).

Nevertheless, since many people ask about it, we decided to provide a guide on how to use Detox with TypeScript.

## Prerequisites

- A working Detox setup with Jest as your test runner.
- TypeScript installed in your project.

Since React Native 0.71, the default React Native project template comes with TypeScript support out of the box. However, if you have no TypeScript project, now's the time:

```bash npm2yarn
npm install --save-dev typescript
tsc --init
```

The latter command will generate a default `tsconfig.json` file, so that you can modify it to suit your needs.

:::tip

If you get an error like:

```plain text
command not found: tsc
```

You can try to:

1. `export PATH=$PATH:./node_modules/.bin` if you are using `bash` or `zsh`.
1. `set PATH=%PATH%;./node_modules/.bin` if you are using Windows Command Prompt.
1. run `npx tsc --init` instead of `tsc --init`.
1. or any other solution to run an executable from `node_modules/.bin` directory.

:::

Make sure your TypeScript compiles without errors before proceeding:

```bash
tsc # or tsc --noEmit if you don't want to generate output files
```

## Setting up Jest with TypeScript

Jest requires a few extra packages to work seamlessly with TypeScript, so let's install them:

```bash npm2yarn
npm install --save-dev ts-jest @types/jest @types/node
```

Your Jest config file at `e2e/jest.config.js` (or wherever you keep your Jest configuration) also needs a couple of tweaks:

```javascript
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
// highlight-next-line
  preset: 'ts-jest', // (1)
  rootDir: '..',
// highlight-next-line
  testMatch: ['<rootDir>/e2e/**/*.test.ts'], // (2)
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

1. The `preset` option tells Jest to use `ts-jest` to compile TypeScript files. This is the most important part of the setup.
1. Make sure you update your `testMatch` to include TypeScript files. Otherwise, you are likely to get an error like this:

   ```plain text
   No tests found, exiting with code 1
   Run with `--passWithNoTests` to exit with code 0
   In /path/to/your/project
     60 files checked.
     testMatch: /path/to/your/project/e2e/**/*.test.js - 0 matches
     testPathIgnorePatterns: /node_modules/ - 60 matches
     testRegex:  - 0 matches
   Pattern:  - 0 matches
   ```

## Writing Detox Tests in TypeScript

With the setup ready, you can now write Detox tests in TypeScript.
Change file extensions from `.js` to `.ts` where appropriate, and you’re good to go.

```typescript
// highlight-next-line
import { expect } from 'detox';

describe('Login Screen', () => {
 it('should login with correct credentials', async () => {
   const email: string = 'test@example.com';
   const password: string = 'password123';

   await element(by.id('emailInput')).typeText(email);
   await element(by.id('passwordInput')).typeText(password);
   await element(by.id('loginButton')).tap();

   expect(await element(by.id('welcomeMessage'))).toBeVisible();
 });
});
```

:::info

Pay attention at the highlighted line above, where we import `expect` from Detox. Unfortunately, there is [an unresolved clash](https://github.com/wix/Detox/issues/2610) between Jest's `expect` and Detox's `expect` when using TypeScript. This will be fixed in the future, but for now, you need to import Detox's `expect` explicitly in case you see errors like this:

```plain text
error TS2339: Property 'toBeVisible' does not exist on type 'JestMatchers<IndexableNativeElement>'.
```

:::

## Conclusion

Using Detox with TypeScript largely boils down to setting up Jest to understand TypeScript. With the power of static typing, your Detox tests can now become more robust, easier to understand, and less error-prone. Happy testing!
