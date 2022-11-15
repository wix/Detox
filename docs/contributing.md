# Contributing

<!-- markdownlint-configure-file { "header-increment": 0 } -->

This guide is about contributing to our codebase.

We don’t have any special guidelines - just some setup walk-through!

### Environment

First, complete our [Getting Started](introduction/getting-started.mdx) guide.

#### Install the monorepo management tool, `lerna`

```bash npm2yarn
npm install lerna@3.x.x --global
```

For all the internal projects (detox, detox-cli, demos, test) `lerna` will create symbolic links in `node_modules` instead of `npm` copying the content of the projects. This way, any change you do on any code is there immediately. There is no need to update node modules or copy files between projects.

#### Install common React Native dependencies

React-Native CLI:

```bash npm2yarn
npm install react-native-cli --global
```

Watchman:

```bash
brew install watchman
```

#### xcpretty

You must also have `xcpretty` installed:

```bash
gem install xcpretty
```

### Detox

#### Clone Detox and Submodules

```bash
git clone git@github.com:wix/Detox.git
cd detox
git submodule update --init --recursive
```

(this makes sure all git submodule dependencies have been properly checked out)

#### Installing and Linking Internal Projects

```bash
lerna bootstrap
```

#### Building and Testing

##### Automatically

`scripts/ci.ios.sh` and `scripts/ci.android.sh` are the scripts Detox runs in CI, they will run `lerna bootstrap`, unit tests, and E2E tests. Make sure these scripts pass before submitting a PR, this is exactly what Detox is going to run in CI.

##### Manually

The following steps can be run manually in order to build / test the various components of Detox.

###### 1. Unit Tests and Lint

```bash
lerna run test
```

Detox JS code is 100% test covered and is set to break the build if coverage gets below, so make sure you run unit tests (`lerna run test`) locally before pushing.

Alternatively, to run only the JS tests, run the following from the `detox/detox` directory:

```bash npm2yarn
npm run unit
```

or

```bash npm2yarn
npm run unit:watch
```

After running the tests, _Jest_ will create a coverage report you can examine:

```bash
cd detox
open coverage/lcov-report/index.html
```

###### 2. Running Detox E2E Coverage Tests

Detox has a suite of end-to-end tests to test its own API while developing (and for regression); We maintain a special application that is "tested" against Detox’s API, but essentially, it’s the API that is tested, not the app.

To run the tests, you must first build the native code and then run based on your target of choice (Android / iOS):

- **iOS:**

  ```bash npm2yarn
  cd detox/test
  npm run build:ios
  npm run e2e:ios
  ```

- **Android:**

  ```bash npm2yarn
  cd detox/test
  npm run build:android
  npm run e2e:android
  ```

FYI Android test project includes two flavors:

- `fromBin` - (**standard use case**) utilizes the precompiled `.aar` from `node_modules` just like a standard RN project.
- `fromSource` - compiles the project with RN sources from `node_modules`, this is useful when developing and debugging Espresso idle resource.
  [Here](https://github.com/facebook/react-native/wiki/Building-from-source#android) are the prerequisites to compiling React Native from source.

Each build can be triggered separately by running its Gradle assembling task (under `detox/test/android/`):

```bash
./gradlew assembleFromSourceDebug
```

or:

```bash
./gradlew assembleFromBinDebug
```

To run from Android Studio, React Native’s `react.gradle` script may require `node` to be in path.
On MacOS, environment variables can be exported to desktop applications by adding the following to your `.bashrc`/`.zshrc`:

```bash
launchctl setenv PATH $PATH
```

###### 3. Android Native Unit-Tests

Under `detox/android`:

```bash
./gradlew testFullRelease
```

### Detox - Example Projects

This is in fact a monorepo that also sports some example projects (for usage reference), alongside the main test project:

- `examples/demo-react-native-jest`: Demonstrate usage of Detox in a React Native app project.
- `examples/demo-native-ios`: Demonstrates usage of Detox in a pure-native iOS app.
- `examples/demo-native-android` (broken): Demonstrates usage of Detox in a pure-native Android app.
- `examples/demo-pure-native-android`: Demonstrates usage of the _pure_ [Detox-Native](https://github.com/wix/Detox/tree/master/detox-native/README.md) project
- more...

**In order to run E2E tests associated with any of these projects, refer to the [project-specific](https://github.com/wix/Detox/tree/master/examples) READMEs.**

### Detox Documentation Website

The [documentation website](https://wix.github.io/Detox) is built using [Docusaurus](https://docusaurus.io/).

To run the website locally, run the following commands:

```bash npm2yarn
cd website
npm install
npm start
```

#### Updating the Website

To update a specific page, edit the corresponding markdown file in `docs/`. To add a new page, create a new markdown file in `docs/` and add a link to it in `website/sidebars.json`.

##### Website Deployment

While changes to the website are published automatically on every commit to `master` under the `Next` version, tagging and locking docs to a specific version is done automatically on every Detox release.

In case you want to update the docs for a specific version, you can change the related files and code under `website/versioned_docs/version-<version>/` and `website/versioned_sidebars/version-<version>-sidebars.json`.

##### Update Old Versions

To update a specific version with the latest changes:

1. Remove the version from `versions.json`.
1. Run `npm run docusaurus docs:version <version>`.
