# detox
### Example Project

## Step 1: Install the example project

* make sure you're in folder `detox/rn-example`
* run `npm install`

## Step 2: Run a local detox-server

* run `./node_modules/.bin/detox-server`
* you should see `server listening on localhost:8099...`

## Step 3: Build and run the example project

* make sure you're in folder `detox/rn-example`
* make sure you don't have any running RN packagers
* build the example iOS project by running `react-native run-ios`
* if everything is ok, you'll see the app in the simulator - you can close the simulator after
* the successful build results should be in `ios/build/Build/Products/Debug-iphonesimulator`

## Step 4: Run the e2e test

* make sure you're in folder `detox/rn-example`
* make sure the RN packager is still running
* make sure successful build results are in `ios/build/Build/Products/Debug-iphonesimulator`
* run `npm run e2e`
* this action will open a new simulator and run the tests in it
