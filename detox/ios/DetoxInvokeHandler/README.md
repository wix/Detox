#Detox Invoke Handler

#Overview
**A utility library for Detox iOS Tester** (DetoxTester), implemented in Swift.

The plain JSON messages received from the Detox Server are not easily consumable by Swift code.
In order to invoke the relevant methods on the tester, the messages must be parsed and interpreted, and to be converted into the appropriate Swift types.

The primary function of this library is to interpret incoming messages and invoke the relevant methods on the tester,
utilizing protocol delegate APIs that are implemented by the tester.

##Usage
**As a low-level library, Detox Message Handler is not intended for direct use by end users.**
Instead, it serves as a crucial component within DetoxTester that manages incoming messages from the Detox Server and triggers the corresponding methods on the test target.

##Development and Testing
Detox Message Handler includes its own set of unit tests, located within the `DetoxInvokeHandlerTests` target.
To execute these tests, simply run the `DetoxInvokeHandlerTests` target in Xcode.

##Contributing
Given the low-level nature of this infrastructure project, we highly recommend consulting with the Detox team before opening any pull requests.
This ensures that any proposed changes align with the project's goals and maintain its stability.
The Detox team is always available to provide guidance and assistance when it comes to making contributions to the project.
