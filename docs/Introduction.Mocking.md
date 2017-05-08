# Mocking 

Detox puts real effort in erradicating flakiness, but tests may still be flaky due to network and server issues in the tested application. Running pure UI automation may help getting even more consistent results.

To run pure UI automation, with expected requests and responses in a consistent well-timed manner, we would need to provide a mocking mechanism for our JS code.
[`react-native-repackager`](https://github.com/wix/react-native-repackager) extends the packager’s ability to override bundled files with any other file, essentially creating an easy way to mock environments in react-native.

For more information and usage instructions, [read the docs](https://github.com/wix/react-native-repackager/blob/master/README.md)