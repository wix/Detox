# Developing Your App While Writing Tests

> If your app requires active development, such as adding testID fields for tests, this is a good workflow. It allows you to work both on your app and your tests at the same time.

The main idea behind this workflow is to run your app in debug with Detox on a simulator. Once the app is up and running, it will still be connected to the React Native packager. This means that you'll be able to do JavaScript code modifications in your app codebase and press CMD+R to reload the bundle inside the Detox simulator.

## Step 1: Build Your App in Debug

Detox is going to need the executable for your app. This means we need to build it first. Since we want a build that's connected to the live React Native packager (to update bundle changes), we're going to need a *debug* build.

There are multiple ways to build your app, let's find the alternative you like best:

* **I like to build my app by clicking "Play" in Xcode** — This isn't a great approach here because using Xcode IDE to build your app will place the executable in an internal directory which path that is difficult to predict (`~/Library/Developer/Xcode/DerivedData/...`). This means we won't be able to tell Detox where to find it. Although you can change the default derivedData path by altering your Xcode settings, we encourage you to try the alternative ways to build.
  If you’d like to debug Detox with Xcode, see [Debugging In Xcode](Guide.DebuggingInXcode.md).

* **I like to build my app with `react-native run-ios`** — The official React Native command line tools provide a script to build your app from terminal. Go to your project root and type `react-native run-ios`. This will build the app in debug and place the executable in the folder `ios/build/Build/Products/Debug-iphonesimulator`. This is a great way to build because it's easy to specify this path in Detox configuration inside `package.json`. This is actually the path we specified in the getting started tutorial.

  ```sh
  react-native run-ios
  ```

* **I like to build my app with `detox build`** — During the installation instructions, we provided Detox configuration in `package.json` with a command line to build your app executable. We can execute this build command by going to the project root and typing `detox build`. Please make sure that you're using a Detox configuration that builds a debug version of your app. The default we specified in the getting started tutorial should work.

  ```sh
  detox build
  ```

> TIP: Running `react-native run-ios` will also start a simulator and install your app on it, running `detox test` later will possibly start a different simulator, so you'll find yourself with two open simulators. You can safely close the simulator started by `react-native`, everything will continue working as expected.

## Step 2: Make Sure Your React-Native Packager is Running

If you can't see a React Native packager instance running in a terminal, you can run it manually by typing:

```sh
react-native start
```

The packager instance will reload the JavaScript bundle of your app when you press CMD+R in the simulator window. This will allow you to make modifications in your app codebase.

## Step 3: Run Detox Tests

Type the following inside your project root:

```sh
detox test
```

This will use Detox to find the app executable we've built in step 1, install it on a simulator and run Detox tests against it.

## Step 4: Make Changes to Your App's Codebase as Usual

You can keep working on the JavaScript codebase of your app as usual. As long as you keep the simulator from step 3 running, you'll be able to press CMD+R inside and reload your app with the new changes.

## Step 5: Re-run Detox Tests Without Re-installing the App

You can make changes to your Detox tests as well. When you want to run your tests on the simulator, we recommed using the following command:

```sh
detox test --reuse
```

The reuse option will prevent Detox from compiling and re-installing your app again in the simulator. The tests will simply run against the current app instance currently running in the simulator. This will make the process much faster.