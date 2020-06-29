# Setting Up an iOS Environment

This guide sums up the tools required for an environment for running automated UI tests using iOS simulators (using Detox, in particular).

## Prerequisites

Running Detox (on iOS) requires the following:

* Mac with macOS (at least macOS High Sierra 10.13.6)

* Xcode 10.2+ with Xcode command line tools.
  Xcode can be installed from the App Store, or the online [Apple developers page](https://developer.apple.com/download/more/) (requires a valid Apple ID to login).

> Tip: Verify Xcode command line tools is installed by typing `gcc -v` in terminal (shows a popup if not installed)

## Dependencies

#### Install the latest version of [Homebrew](http://brew.sh)

Homebrew is a package manager for macOS, we'll need it to install other command line tools.

To ensure everything needed for Homebrew tool installation is installed, run

```sh
xcode-select --install
```

> Tip: Verify it works by typing in `brew -h` in a terminal to output list of available commands

#### Install [applesimutils](https://github.com/wix/AppleSimulatorUtils)

A collection of utils for Apple simulators, Detox uses it to communicate with the simulator.

```sh
brew tap wix/brew
brew install applesimutils
```

> Tip: Verify it works by typing in `applesimutils` in a terminal to output the tool help screen

