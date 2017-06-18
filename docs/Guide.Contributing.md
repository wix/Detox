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

### Install `fbsimctl`

```sh
brew tap facebook/fb
export CODE_SIGNING_REQUIRED=NO && brew install fbsimctl --HEAD
```

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
