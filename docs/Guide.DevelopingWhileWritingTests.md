# Developing Your App While Writing Tests

Detox can (and should) be integrated with the development workflow.<br>
This guide will go over the recommended workflow of developing alongside writing tests.

### 1. Build a debug configuration of your app (more about building your app [here](/docs/APIRef.Configuration.md#build-configuration))

```sh
react-native run-ios
```

If you prefer working from Xcode, you will need to set the output path for the built app file, since the defalt is set to build the app to a directory external to the project `~/Library/Developer/Xcode/DerivedData`. Although you can change the default derivedData path, we encourge using the supplied command line tools (either `react-native run-ios` or `detox build`).

  
>NOTE: running `react-native run-ios` / running from Xcode will start a simulator and install your app on it, running `detox test` will also start possibly a different simulator, so you'll find yourself with two open simulators. You can safely close the simulator started by react-native, everything will continue working as expected.

### 2. Make sure your react-native packager is running

### 3. Once the app is compiled you can start running detox tests

```sh
detox test
```

If you only make changes in your JS code, the packager will take care of updating your bundle, using ⌘ + R will reload the bundle in your app, so you won't need to compile and install your application over and over again. **When the app is already installed on your device**, you can use `--reuse` flag for faster runs, this will keep the installed application on the device between tests.

```sh
detox test --reuse
```


