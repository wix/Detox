# detox

Graybox E2E tests and automation library for mobile

## Development still in progress!

## Wanna see it in action??

#### Step 1: Run the server

1. git clone the repo at http://github.com/wix/detox-server
2. open the `detox-server` folder
3. `npm install`
4. run the server with `npm start`
5. you should see `server listening on localhost:8099...`

#### Step 2: Run the example iOS project in the simulator

1. git clone the repo at http://github.com/wix/detox
2. open the `detox` folder
3. `npm install`
4. `npm run build`
2. open the `detox/example` folder
3. `npm install`
4. open `detox/example/ios/example.xcodeproj` in xcode
5. make sure you don't have any running RN packagers
6. run the project by pressing play
7. you should see an app in the simulator with "Welcome" and "Click Me" button, the iOS Accessibility Inspector might also show up
8. if you get weird "DerivedData" errors, change the xcode "DerivedData" setting back to default
9. if you get build problems, delete the following (since EarlGrey downloads them on build):
  * `detox/example/node_modules/detox/ios/EarlGrey/OCHamcrest.framework`
  * `detox/example/node_modules/detox/ios/EarlGrey/fishhook`
  * `detox/example/node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock`

#### Step 3: Run the e2e test

1. open a new terminal in `detox/example` folder
2. `npm run e2e`

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
