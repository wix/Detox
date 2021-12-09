## Generation

This part of the repository aims to automate the adaption of the underlying testing frameworks.
For now, it only covers `EarlGrey`’s `GREYActions`.

We chose to check the generated files into version control to have them available as documentation.

To correlate changes to the generation with changes in the generated code, please make sure to run the build before every commit.

### Development

- `npm install`
- `npm run build` builds every file specified in the `index.js`
- `npm test`

### Testing

- We test with integration level tests by having a fixture Objective-C file which we generate and import before the tests.
- We only add unit tests for code that is used in production, e.g. helper functions.
- We then test against this file to ensure that the code generation result works with the specified interface.
- We decided to base our tests around snapshot tests with the goal to spot mistakes in the return values of the functions without over-specification.
- If you add functionality that affects the API surface of detox, please also make sure to include [End to End tests for it](../detox/test/e2e).

### Resources

Parsing, ASTs, and code generation are hard topics but don’t worry; we got your back.
Here are some resources that might come in handy:

- [astexplorer](https://astexplorer.net): Allows you to understand Abstract Syntax Trees by showing you code and the resulting AST side-by-side.
- [Babel Handbook](https://github.com/thejameskyle/babel-handbook):
- [babel-types](https://github.com/babel/babel/tree/master/packages/babel-types): A builder library for ASTs.
- [babel-template](https://github.com/babel/babel/tree/master/packages/babel-template): A useful tool we do not use yet for generating bigger ASTs with less code by the usage of string interpolation.
- [regex101](https://regex101.com): You might need to extract parts of a string; This tool helps you to quickly build the right Regular Expression for the job.
