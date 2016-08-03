# detox

Graybox E2E tests and automation library for mobile

## Development still in progress!

<img src="http://i.imgur.com/O2ZzrKG.gif">

## Wanna see it in action??

Open the [React Native demo project](demo-react-native) and follow the instructions

Not using React Native? you now have a [pure native demo project](demo-native) too

## Wanna try it with your own project?

See the [Installing](INSTALLING.md) instructions

## Some implementation details

* We let you write your e2e tests in JS (they can even be cross-platform)
* We use websockets to communicate (so it should be super fast and bi-directional)
* Both the app and the tester are clients, so we need the server to proxy between them
* We are relying on EarlGrey as our gray-box native library for iOS (espresso for Android later on)
* The JS tester controls EarlGrey by remote using a strange JSON protocol
* Instead of wrapping the zillion API calls EarlGrey supports, we implemented a reflection mechanism
* So the JS tester in low level actually invokes the native methods.. freaky
* We've abstracted this away in favor of an protractor-like api, see [`demo-react-native/e2e/example.spec.js`](demo-react-native/e2e/example.spec.js)
* See everything EarlGrey supports [here](https://github.com/google/EarlGrey/blob/master/docs/api.md) and in this [cheatsheet](https://github.com/google/EarlGrey/blob/master/docs/cheatsheet/cheatsheet.pdf)
* We use [fbsimctl](https://github.com/facebook/FBSimulatorControl) to control the simulator from the test, restart the app, etc

#### Roadmap

* Improve errors printed during app execution (maybe show NSLog)
* Cleaner code and refactoring once we have the basic architecture figured out
* Improve separation of test start and test end in the native detox test runner
