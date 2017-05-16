# Troubleshooting Detox Installation

* [Can't install fbsimctl](#cant-install-fbsimctl)
* [No simulators found](#no-simulators-found)

<br>

### Can't install fbsimctl

[fbsimctl](https://github.com/facebook/FBSimulatorControl) is an open source tool by Facebook for controlling iOS simulators from the command line with greater flexibility than Apple's own command line solution. This is a 3rd party tool that is normally installed with `brew`. Installation with `brew` actually takes the current master from GitHub and builds it on your machine using Xcode command line tools. This process is somewhat fragile and might fail.

The best way to troubleshoot fbsimctl installation is to search for similar issues. This tool has been available for quite some time and has a loyal following. Start by searching the [GitHub issues](https://github.com/facebook/FBSimulatorControl/issues?utf8=%E2%9C%93&q=is%3Aissue) of the project. If you're certain the problem is with fbsimctl itself, please open a new issue in its [GitHub page](https://github.com/facebook/FBSimulatorControl).

Sometimes the problem is with `brew` itself. There are a number of common troubleshooting steps to fix common `brew` issues, you can find them [here](https://github.com/Homebrew/brew/blob/master/docs/Troubleshooting.md). Another official list of common issues is available [here](http://docs.brew.sh/Common-Issues.html). Once your `brew` is back in order, remove fbsimctl with `brew remove fbsimctl` and try installing it again.

<br>

### No simulators found

In order to run tests on a simulator, you need to have simulator images installed on your machine. This process is performed by Xcode itself. You can list all available simulators using fbsimctl by typing `fbsimctl list` in terminal.

If you're missing a simulator, make sure Xcode is installed and use it to download the simulator. Take a look at the Preferences screen, some screenshots can be seen [here](http://stackoverflow.com/questions/33738113/how-to-install-ios-9-1-simulator-in-xcode-version-7-1-1-7b1005).

Once the desired simulator is installed and returned by `fbsimctl list`, double check its name in the list and make sure this name is found in the `detox` configuraton entry in `package.json`. The reference for the configuration options is available [here](APIRef.Configuration.md).
