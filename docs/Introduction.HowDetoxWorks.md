
# How Detox Works

Detox is an end-to-end testing framework. This means it runs your app on an actual device/simulator and interacts with it just like a real user would. This type of tests can give a lot of confidence for releasing your app and help automate a manual QA process. If you're coming from a web background, it's very similar in concept to [protractor](http://www.protractortest.org/#/).

When a detox test executes, you actually have two different parts running side by side:

* **The mobile app itself.** Usually running on a simulator. Real devices will also be supported soon. A regular native build of your app is installed and executed on the device. Your app is usually built once before the tests start running.

* **The test suite.** Running on Node.js using a test runner like Mocha. The tests are normally written in JavaScript. This part is running outside the app and communicates with the app on the device over the network using a websocket (HTTP). Because the tests are asynchronous in nature (every test line requires to access the app and wait for a response), the tests rely heavily on [async-await](https://ponyfoo.com/articles/understanding-javascript-async-await).

The two parts are usually running in separate processes on your machine. It is also possible to run the two parts on different machines. Communication between the two parts takes place over the network using a websocket.

In practice, to make the communication more resilient, both parts are implemented as clients and communicate with a detox server that acts as proxy. This allows some nice behaviors like allowing one side to disconnect (during a simulator boot for example or app restart) without disconnecting the other side and losing its state.
