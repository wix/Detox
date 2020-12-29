# Running Locally

If your app is ready and does not require any active development, you can write your tests using this workflow and run them locally on your machine. This is convenient for developing your test suite without actively developing your app.

This is the basic workflow. It takes your app executable and runs Detox tests against it.

## Step 1: Build Your App

Detox is going to need the executable for your app. This means we need to build it first. We're going to use the Detox command line tools to build the app. During the installation, we've specified the actual build command line inside `package.json` under the `detox` configuration section.

Build the app by typing in terminal inside your project root:

```sh
detox build
```

## Step 2: Run Detox Tests

Type the following inside your project root:

```sh
detox test
```

This will use Detox to find the app executable we've built in step 1, install it on a simulator and run Detox tests against it.

**Note:** If you have multiple configurations, you will need to specify the configuration to test.