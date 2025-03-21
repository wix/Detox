# How Detox Works

Detox is an end-to-end testing framework. This means it runs your app on an actual device, or a device simulator/emulator and interacts with it just like a real user would. This type of testing can give a lot of confidence in your app and help automate an otherwise tedious manual QA process.

When a Detox test executes, you actually have two different parts running side by side:

1. **The mobile app itself**, running on a device or a device simulator/emulator. A regular native-build of your app is installed and executed on the device, orchestrated by native Detox code that is built separately and installed alongside the app itself.

2. **The test suite**, running on Node.js, over a test runner like Jest. The tests are normally written in JavaScript, and utilize the JavaScript part of Detox.

The two parts are run in separate processes on your machine. It is also possible to run the two parts on different machines. Communication between the two parts takes place over the network using a web socket.

In practice, to make the communication more resilient, both parts are implemented as clients and communicate through a Detox server that acts as mediator. Having that server allows for some advantages like allowing one side to disconnect (during a simulator boot for example or app restart) without disconnecting the other side and losing its state.

## Automatic App-State Synchronization

One of Detox's key features is the automatic synchronization of test execution with the app's state. For example, consider the following super-common moment in a test scenario:

1. Node.js runs test code that effectively tells Detox to tap on the *login* button. Detox sends this tap command to the app.
2. The app receives the command, the button is pressed, and the login process begins. A secure user session is obtained from the server, and the app navigates to the home screen. The home screen fetches yet even more data from the servers and renders elements with loading animations.
3. **Detox - being a gray-box testing framework, monitors these changes in the app's state and waits for them to complete. This ensures that the test and the app's current state remain in-sync.**
4. Detox proceeds to the next action in the test code only after the app is stable (!)

Let’s deep-dive into step #2: So much UI work happens with numerous network requests performed in the background… What is the order of execution of those requests, and how long should you wait until all of them are replied to? How long should you wait until the UI is ready? For the network, it depends on which request completes first, which in turn depends on network congestion and how busy the server is. As for the UI, it depends on the specific test device / machine specs and how busy its processor is.

In the traditional black-box (rather than gray-box) testing approach, you normally deal with being blind to the app’s state by adding various `sleep()` / `waitFor()` commands throughout the test in an attempt to force order into the chaos. In step #3, **Detox eliminates the need for that malpractice, and so introduces stability into the otherwise inherently-flaky test world.**

### Operations Detox synchronizes with automatically

- **Network requests** - Detox monitors in-flight requests over the network (waiting for them to be responded).

- **Main thread (native)** - Detox monitors pending native operations on the app's main thread (main dispatch queue and main `NSOperationQueue`).

- **Layout of UI** - Detox monitors UI layout operations. There’s also special support for React Native layout which includes the Shadow Queue where [yoga](https://github.com/facebook/yoga) runs.

- **Timers** - Detox monitors timers (explicit asynchronous delays). There’s special support for JavaScript's `setTimeout`, which is monitored.

- **Animations** - Detox monitors active animations and transitions. There’s special support for React Native animations with the Animated library, and even the popular [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated).

- **React Native JavaScript thread** - Detox monitors pending operations on the JavaScript thread in RN apps.

- **React Native native-modules thread** - Detox monitors pending RN native-module actions executed on its dedicated thread.

- **React Native bridge** - In non-bridge-less apps (i.e. before RN's new-architecture), Detox monitors the React Native bridge and asynchronous messages delivered through it.

:::info

In this synchronization process, [`session.debugSynchronization`](../config/session.mdx#sessiondebugsynchronization-number) plays a significant role. This setting, enabled by default, keeps an eye on tasks that are keeping the app busy and logs the details if these actions take longer than the specified value to complete.

:::

## Architecture

Detox comprises the following components:

- [**Tester**](https://github.com/wix/Detox/tree/master/detox/src): The testing component, running in a Node.js process on the host computer, executing the test logic. The tester is also responsible for device management and artifact collection.
- **Detox native client ([iOS](https://github.com/wix/Detox/tree/master/detox/ios) & [Android](https://github.com/wix/Detox/tree/master/detox/android)):** A component that gets seamlessly integrated into the tested app on the tested device, right as Detox starts executing. It synchronizes with the app, matches user queries, executes user commands (e.g. taps, scrolls) and validates expectations.
- **[Detox mediator server](https://github.com/wix/Detox/tree/master/detox/src/server)**: A small web socket server, running in a Node.js process on the host computer, used to connect between the tester and the client. Normally, the tester starts a server on a randomized session id and an available port, and sends the session and port to the client app as a launch argument.
