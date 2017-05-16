# Developing Your App While Writing Tests


Detox can (and should) be integrated in the development workflow.<br>
This guide will go over the recommended workflow of developing alongside writing tests.

Build a debug configuration of your app (more about building your app [here](/docs/APIRef.Configuration.md#build-configuration)).

```sh
detox build

-or-

react-native run-ios
```

>NOTE: running `react-native run-ios` will start a simulator and install your app on it, running `detox test` will also start possibly a different simulator, so you'll find yourself with two open simulators. You can safely close the simulator started by react-native, everything will continue working as expected.

Once the app is compiled you can start running detox tests. 

```sh
detox test
```

If you only make changes in your JS code, the packager will take care of updating your bundle, using ⌘ + R will reload the bundle in your app, so you won't need to compile and install your application over and over again. **When the app is already installed on your device**, you can use `--reuse` flag for faster runs, this will keep the installed application on the device between tests.

```sh
detox test --reuse
```


