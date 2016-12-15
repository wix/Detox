> detox

# React Native Demo Project

## Requirements

* Make sure you have Xcode installed.
* Make sure you have node and npm installed.
* Make sure you have react-native dependencies installed:
   * react-native-cli is installed (`npm install -g react-native-cli`)
   * watchman is installed (`brew install watchman`)

## Step 1: Install the Demo Project

* Make sure you're in folder `detox/demo-react-native`.
* Run `npm install`.

## Step 2: Run a Local `detox-server`

* Run `./node_modules/.bin/detox-server`.
* You should see `server listening on localhost:8099...`.

## Step 3: Build and Run the Demo Project

* Make sure you're in folder `detox/demo-react-native`
* Build the project demo project:
  * `export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme "example Release_Detox" -derivedDataPath ios/build -sdk iphonesimulator`
* The successful build results should be in `ios/build/Build/Products/Release_Detox-iphonesimulator`.

## Step 4: Run the e2e test

* Make sure you're in folder `detox/demo-react-native`.
* Run an RN packager instance.
* Run `npm run e2e`.
* This action will open a new simulator and run the tests in it.
