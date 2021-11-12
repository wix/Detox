## Setting Up an iOS Environment

This guide sums up the tools required for an environment for running automated UI tests using iOS simulators (using Detox, in particular).

### Prerequisites

Running Detox (on iOS) requires the following:

* MacOS Catalina or newer
* Xcode `v12.x` or newer (`v13` support - see [here](https://github.com/wix/Detox/issues/2895)), with Xcode command-line tools installed

  Xcode can be installed from the App Store, or downloaded [directly from Apple Developer](https://developer.apple.com/download/more/)

### Dependencies

#### Install the Latest Version of [Homebrew](http://brew.sh)

Homebrew is a package manager for macOS, used to install other command line tools.

To ensure everything needed for Homebrew tool installation is installed, run

```sh
xcode-select --install
```

#### Install [`applesimutils`](https://github.com/wix/AppleSimulatorUtils)

A collection of utils for Apple simulators, Detox uses it to query and communicate with the simulator.

```sh
brew tap wix/brew
brew install applesimutils
```

> **Note:** Make sure to periodically update your version of `applesimutils` to the latest version.
