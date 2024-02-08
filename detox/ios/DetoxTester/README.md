#Detox Tester
Detox Tester is the new iOS infrastructure for Detox, introduced in Detox v21, leveraging the XCUITest framework.

Detox Tester serves as an XCUITest test runner that receives messages from the Detox Server, and executing them on the app under test.

##Overview
The tester is mainly implemented in Swift, and is intended to use XCUITest's native APIs for interacting with the app under test.
We extended the abilities of XCUITest to support Detox's features, such as resource synchronization, and compliance with React Native apps.
In order to allow this extended functionality, we are using methods that are exposed by the Detox framework, which is injected into the app under test, and implemented cross-process communication between the tester and the app under test.

##Usage
Detox Tester is not intended for direct use by end users.
Instead, it serves as a crucial component within Detox, managing incoming messages from the Detox Server and triggering the corresponding methods on the app under test using the Detox framework or XCUITest.

##Development and Testing
Detox Tester includes its own set of unit and integration tests, located within the `DetoxTesterTests` target.
To execute these tests, simply run the `DetoxTester` target in Xcode.

##Contributing
See our [Contributing Guide](https://wix.github.io/Detox/docs/contributing) for information on how to contribute to Detox.
