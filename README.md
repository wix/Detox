# detox

Graybox E2E tests and automation library for mobile

## Development still in progress!

<img src="http://i.imgur.com/O2ZzrKG.gif">

## Wanna see it in action??

#### Step 1: Run the server

1. git clone the repo at http://github.com/wix/detox-server
2. open the `detox-server` folder
3. `npm install`
4. run the server with `npm start`
5. you should see `server listening on localhost:8099...`

#### Step 2: Run the example iOS project in the simulator

##### Build detox

1. git clone the repo at http://github.com/wix/detox
2. open the `detox` folder
3. `npm install`
4. `npm run build`

##### Build the example project

1. open the `detox/example` folder
2. `npm install`
3. make sure you don't have any running RN packagers
4. build the example iOS project by running `react-native run-ios`
5. the successful build results should be in `detox/example/ios/build/Build/Products/Debug-iphonesimulator`
6. you can close the simulator opened by this action

##### If the command line build fails try the following

1. open `detox/example/ios/example.xcodeproj` in xcode
2. make sure you don't have any running RN packagers
3. run the project by pressing play
4. you should see an app in the simulator with "Welcome" and "Click Me" button, the iOS Accessibility Inspector might also show up
5. if you get weird "DerivedData" errors, change the xcode "DerivedData" setting back to default
6. if you get build problems, delete the following (since EarlGrey downloads them on build):
  * `detox/example/node_modules/detox/ios/EarlGrey/OCHamcrest.framework`
  * `detox/example/node_modules/detox/ios/EarlGrey/fishhook`
  * `detox/example/node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock`

#### Step 3: Run the e2e test

1. make sure successful build results are in `detox/example/ios/build/Build/Products/Debug-iphonesimulator`
2. open a new terminal in `detox/example` folder
3. `npm run e2e`
4. this action will open a new simulator and run the tests in it

#### Some implementation details

* We use websockets to communicate (so it should be super fast and bi-directional)
* Both the app and the tester are clients, so we need the server to proxy between them
* We are relying on EarlGrey as our gray-box native library for iOS (espresso for Android later on)
* The JS tester controls EarlGrey by remote using a strange JSON protocol
* Instead of wrapping the zillion API calls EarlGrey supports, we implemented a reflection mechanism
* So the JS tester in low level actually invokes the native methods.. freaky
* We've abstracted this away in favor of an protractor-like api, see `detox/example/e2e/example.spec.js`
* See everything EarlGrey supports [here](https://github.com/google/EarlGrey/blob/master/docs/api.md) and in this [cheatsheet](https://github.com/google/EarlGrey/blob/master/docs/cheatsheet/cheatsheet.pdf)
* In the future we'll use [fbsimctl](https://github.com/facebook/FBSimulatorControl) to control the simulator from the test, restart the app, etc

#### Roadmap

* Cleaner code and refactoring once we have the basic architecture figured out
* Improve separation of test start and test end in the native detox test runner
* Maybe move entire mechanism to XCTestCase (instead of pure app code like now)
