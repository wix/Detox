# Installation

### No Simulators Found

In order to run tests on a simulator, you need to have simulator images installed on your machine. This process is performed by Xcode itself. You can list all available simulators using simctl by typing `xcrun simctl list` in terminal.

If you're missing a simulator, make sure Xcode is installed and use it to download the simulator. Take a look at the Preferences screen, some screenshots can be seen [here](http://stackoverflow.com/questions/33738113/how-to-install-ios-9-1-simulator-in-xcode-version-7-1-1-7b1005).

Once the desired simulator is installed and returned by `xcrun simctl list`, double check its name in the list and make sure this name is found in the `detox` configuraton entry in `package.json`. The reference for the configuration options is available [here](APIRef.Configuration.md).
