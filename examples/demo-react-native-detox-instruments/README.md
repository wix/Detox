## React Native Demo Project

**IMPORTANT:** Get your environment properly set up, as explained in our [contribution guide](../../docs/Guide.Contributing.md).

### To test Release build of your app

#### \[Release] Step 1: Build

Build the demo project:

```sh
detox build --configuration ios.sim.release
```

#### \[Release] Step 2: Test

Run tests on the demo project:

```sh
detox test --configuration ios.sim.release
```

This action will open a new simulator and run the tests on it.

### To test Debug build of your app

#### \[Debug] Step 1: Build

Build the demo project:

```sh
detox build --configuration ios.sim.debug
```

#### \[Debug] Step 2: Test

1. Start react-native packager:

   ```sh
   npm run start
   ```

1. Run tests on the demo project:

   ```sh
   detox test --configuration ios.sim.debug
   ```

   This action will open a new simulator and run the tests on it.
