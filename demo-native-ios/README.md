> detox

# Pure Native Demo Project

## Requirements

* make sure you have Xcode installed (tested with v7.3)
  * iPhone 6s iOS 9.3 simulator is installed
* make sure you have node installed (`brew install node`, tested with v6.2.2)
  * npm is installed (tested with v3.9.5)

## Step 1: Install the demo project

* make sure you're in folder `detox/demo-native`
* run `npm install`

## Step 2: Run a local detox-server

* run `./node_modules/.bin/detox-server`
* you should see `server listening on localhost:8099...`

## Step 3: Build and run the demo project

* open `ios/NativeExample.xcodeproj` in Xcode and build it
* the successful build results should be in `ios/build/Products/Debug-iphonesimulator`

## Step 4: Run the e2e test

* make sure you're in folder `detox/demo-native`
* make sure successful build results are in `ios/build/Products/Debug-iphonesimulator`
* run `npm run e2e`
* this action will open a new simulator and run the tests in it
