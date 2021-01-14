# How Detox Works

Detox is an end-to-end testing framework. This means it runs your app on an actual device/simulator and interacts with it just like a real user would. This type of testing can give a lot of confidence in your app and help automate a manual QA process.

When a Detox test executes, you actually have two different parts running side by side:

* **The mobile app itself**, usually running on a simulator/emulator. A regular native build of your app is installed and executed on the device. Your app is usually built once before the tests start running.

* **The test suite**, running on Node.js, using a test runner like Jest. The tests are normally written in JavaScript. Because the tests are asynchronous in nature (every test line requires to access the app and wait for a response), the tests rely heavily on [async-await](https://ponyfoo.com/articles/understanding-javascript-async-await).

The two parts are usually running in separate processes on your machine. It is also possible to run the two parts on different machines. Communication between the two parts takes place over the network using a web socket.

In practice, to make the communication more resilient, both parts are implemented as clients and communicate with a Detox server that acts as proxy. This allows some nice behaviors like allowing one side to disconnect (during a simulator boot for example or app restart) without disconnecting the other side and losing its state.

### How Detox Automatically Synchronizes With Your App

One of the key features of Detox is its ability to automatically synchronize the test execution with your app. The most annoying aspect of end-to-end tests is flakiness—tests sometimes fail without anything changing. Flakiness happens because tests are nondeterministic. Every time a test is running, things take place in a slightly different order inside your app. 

Consider a scenario where the app is making multiple network requests at the same time. What is the order of execution? It depends on which request completes first. This is an external concern depending on network congestion and how busy the server is.

The traditional method of dealing with flakiness is adding various `sleep()`/`waitFor()` commands throughout the test in an attempt to force a certain execution order. This is a bad practice, riddled with fragile magic values that often change if the machine running the tests becomes faster or slower.

Detox tries to eliminate flakiness by automatically synchronizing your tests with the app. A test cannot continue to the next command until the app becomes idle. Detox monitors your app very closely in order to know when it's idle. It tracks several asynchronous operations and waits until they complete. This includes:

* Keeping track of all network requests that are currently in-flight and waiting until they complete
* Keeping track of pending animations and waiting until they complete
* Keeping track of timers and waiting until they expire or are cancelled
* Keeping track of the React Native operations

### Architecture

Detox is comprised of the following components:

- [**Tester**](https://github.com/wix/Detox/tree/master/detox/src): the tested component, running in a Node.js process, executing the test logic. The tester is also responsible for device management and artifact collection.
- **Detox client ([iOS](https://github.com/wix/Detox/tree/master/detox/ios) & [Android](https://github.com/wix/Detox/tree/master/detox/android)):** a framework, embedded in the tested app, which synchronizes with the app, matches user queries, executes user commands and validates expectations.
- **[Detox server](https://github.com/wix/Detox/tree/master/detox/src/server)**: A small web socket server, running in a Node.js process, used to connect between the tester and the client. Normally, the tester starts a server on a randomized session id and an available port, and sends the session and port to the client app as a launch argument.