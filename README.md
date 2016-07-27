# detox

Graybox E2E tests and automation library for mobile

## Development still in progress!

<img src="http://i.imgur.com/O2ZzrKG.gif">

## Wanna see it in action??

Open the React Native [example project](rn-example) and follow the instructions

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

##### Troubleshooting

1. open `detox/example/ios/example.xcodeproj` in xcode
2. make sure you don't have any running RN packagers
3. run the project by pressing play
4. you should see an app in the simulator with "Welcome" and "Click Me" button, the iOS Accessibility Inspector might also show up
5. if you get weird "DerivedData" errors, change the xcode "DerivedData" setting back to default
6. if you get build problems, delete the following (since EarlGrey downloads them on build):
  * `detox/example/node_modules/detox/ios/EarlGrey/OCHamcrest.framework`
  * `detox/example/node_modules/detox/ios/EarlGrey/fishhook`
  * `detox/example/node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock`
