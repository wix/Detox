> detox

# React Native Demo Project

## Requirements

* Make sure you have Xcode installed (tested with Xcode 8.1).
* Make sure you have node and npm installed.
* Make sure you have react-native dependencies installed:
   * react-native-cli is installed (`npm install -g react-native-cli`)
   * watchman is installed (`brew install watchman`)

### Step 1: Install the Demo Project

* Make sure you're in folder `detox/demo-react-native`.
* Run `npm install`.

### Step 2: Run a Local `detox-server`

* Run `npm run detox-server`.
* You should see `server listening on localhost:8099...`.


## To test Release build of your app
### Step 3: Build and Run the Demo Project

* Build the project demo project: `npm run build:ios:release`
* The successful build results should be in `ios/build/Build/Products/Release-iphonesimulator`.

### Step 4: Run the e2e test

* Make sure you're in folder `detox/demo-react-native`.
* Run `npm run e2e:ios:release`.
* This action will open a new simulator and run the tests on it.

## To test Debug build of your app
### Step 3: Build and Run the Demo Project

* Build the project demo project: `npm run build:ios:debug`
* The successful build results should be in `ios/build/Build/Products/Debug-iphonesimulator`.

### Step 4: Run the e2e test

* Make sure you're in folder `detox/demo-react-native`.
* Run an RN packager instance `npm run packager`.
* Run `npm run e2e:ios:debug`.
* This action will open a new simulator and run the tests on it.
