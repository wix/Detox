# Workflows

There are multiple recommended ways to work with Detox and make it a part of your development process. Choose the best workflow for your needs:

* [Running Tests Locally on Your Machine](Guide.RunningLocally.md) — If your app is ready and does not require any active development, you can write your tests using this workflow and run them locally on your machine. This is convenient for developing your test suite without actively developing your app.

* [Developing Your App While Writing Tests](Guide.DevelopingWhileWritingTests.md) — If your app requires active development, such as adding [testID](https://facebook.github.io/react-native/docs/view.html#testid) fields for tests, this is a good workflow. It allows you to work both on your app and your tests at the same time.

* [Running Tests on CI (like Travis)](Guide.RunningOnCI.md) — When your test suite is finally ready, it should be set up to run automatically on your CI server on every git push. This will alert you if new changes to the app break existing functionality.

* [Debugging Apps in Xcode During a Test](Guide.DebuggingInXcode.md) — Advanced users might need to natively debug their app inside Xcode during a Detox test. This is mostly useful for investigating weird crashes or when contributing to Detox itself.
