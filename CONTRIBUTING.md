> detox

# Contributing to detox

##### Clone detox and submodules

```sh
git clone git@github.com:wix/detox.git
cd detox
git submodule update --init --recursive
```
(this makes sure all git submodule dependencies are properly checked out)


##### Install `node` v7.6 or higher (to support async-await natively)

```
brew install node
```

##### Install global node libraries `lerna` and `react-native-cli`

```sh
npm install -g lerna
npm install -g react-native-cli
```

For all the internal projects (detox, detox-server, detox-cli, demos, test) `lerna` will create symbolic links in `node_modules` instead of `npm` copying the content of the projects. This way, any change you do on any code is there immediatly, no need to update node modules, or copy files between projects.

install `fbsimctl` 

```sh
brew tap facebook/fb
brew install fbsimctl --HEAD
```

install `xcpretty`

```sh
gem install xcpretty
```

### Building

```sh
lerna run build
```

### Testing

```sh
lerna run test
```

Detox JS code is 100% test covered and is set to break the build if covrage gets below, make sure you run unit tests locally before pushing using `lerna run test`

Alternativley, to JS-only tests, in `detox/detox` directory, run: 

```sh
npm run unit
-or-
npm run unit:watch
```

#### How to read the coverage report
After running the tests, jest will create a coverage report.

```sh
cd detox/detox
open coverage/lcov-report/index.html
```

