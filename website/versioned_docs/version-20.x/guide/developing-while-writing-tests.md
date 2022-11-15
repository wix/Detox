# Developing Your App While Writing Tests

<!-- markdownlint-configure-file { "header-increment": 0 } -->

> If your app requires active development, such as adding testID fields for tests, this is a good workflow. It allows you to work both on your app and your tests at the same time.

The main idea behind this workflow is to run your app in debug with Detox on a simulator. Once the app is up and running, it will still be connected to the React Native packager. This means that you’ll be able to do JavaScript code modifications in your app codebase and press CMD+R to reload the bundle inside the Detox simulator.

### Step 1: Build Your App in Debug

Detox is going to need the executable for your app. This means we need to build it first.
Since we want a build that’s connected to the live React Native packager (to update bundle changes),
we’re going to need a _debug_ build:

```bash
detox build -c ios.sim.debug # or android.emu.debug
```

Check out [Introduction > Building with Detox](../introduction/project-setup.mdx) for more details.

### Step 2: Make Sure Your React-Native Packager is Running

If you can’t see a React Native packager instance running in a terminal, you can run it manually by typing:

```bash
npx react-native start
```

The packager instance will reload the JavaScript bundle of your app when you press CMD+R in the simulator window.
This will allow you to make modifications in your app codebase.

### Step 3: Run Detox Tests

Type the following inside your project root:

```bash
detox test -c ios.sim.debug # or android.emu.debug
```

This will use Detox to find the app executable we’ve built in step 1, install it on the device and run Detox tests against it.

### Step 4: Make Changes to Your App’s Codebase as Usual

You can keep working on the JavaScript codebase of your app as usual.
As long as you keep the simulator from step 3 running, you’ll be able to press CMD+R inside and reload your app with the new changes.

### Step 5: Re-run Detox Tests Without Re-installing the App

You can make changes to your Detox tests as well. When you want to re-run your tests on the device,
we recommend adding `--reuse` flag to save your time when running the tests.

```bash
detox test -c ios.sim.debug --reuse # or android.emu.debug
```

By default, Detox re-installs the app before picking every next test suite which is redundant in this situation
since your app code changes are delivered via network with React Native packager, and the app binary itself does
not change.

You should not use this option if you made native code changes or if your app relies on local ("disk") storage.
