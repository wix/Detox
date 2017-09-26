# Contributing to detox

### Clone detox and submodules

```sh
git clone git@github.com:wix/detox.git
cd detox
git submodule update --init --recursive
```
(this makes sure all git submodule dependencies are properly checked out)


### Install `node` v7.6 or higher (to support async-await natively)

```
brew install node
```

### Install global node libraries `lerna` and `react-native-cli`

```sh
npm install -g lerna
npm install -g react-native-cli
```

For all the internal projects (detox, detox-server, detox-cli, demos, test) `lerna` will create symbolic links in `node_modules` instead of `npm` copying the content of the projects. This way, any change you do on any code is there immediately. There is no need to update node modules or copy files between projects.

### Install `xcpretty`

```sh
gem install xcpretty
```
### Installing

```sh
lerna bootstrap
```

### Building

```sh
lerna run build
```

### Testing

```sh
lerna run test
```

Detox JS code is 100% test covered and is set to break the build if coverage gets below, so make sure you run unit tests (`lerna run test`) locally before pushing.

Alternatively, to run only the JS tests, run the following from the `detox/detox` directory:

```sh
npm run unit
-or-
npm run unit:watch
```

#### How to read the coverage report
After running the tests, jest will create a coverage report.

```sh
cd detox
open coverage/lcov-report/index.html
```

### Running detox e2e covarage tests
Detox has a suite of e2e tests to test its own API while developing (and for regression). The way we do is is by maintaining a special application that is "tested" against detox's API, but essentially, it's the API that is tested, not the app.
To run the e2e tests, go to `detox/detox/test`

```sh
cd detox/test
```

To build the application (if you already ran `lerna run build` you're covered)

```sh
npm run build
```

To run the e2e tests, after the application was built.

```sh
npm run e2e
```

### Code Generation

We are using a code generator based on `babel` and `objective-c-parser` to generate a Javascript Interface for `EarlGrey` (the testing library we use on iOS).
This interface allows us to call Objective-C methods through the WebSocket connection directly on the testing device. 

This approach is currently limited to `GREYActions`, but we plan on extending it to cover more functionality of `EarlGrey`.
You may see the generated files under [`detox/src/ios/earlgreyapi/`](../detox/src/ios/earlgreyapi).

What happens under the hood can be seen in [`generation/`](../generation); it boils down to these steps for each input file:

1. Convert Objective-C header file in a JSON Representation
2. Build an Abstract Syntax Tree: Create Class & for each method
    1. Check if the type can be expressed simpler (`NSString *` => `NSString`)
    2. Get the type checks for the arguments
    2. Get the return value
    4. Assemble type checks and return value to complete function
3. Generate the code for the syntax tree & add helpers

If you would like to extend the code generation, please make sure to read the [`generation/README.md`](../generation#generation)