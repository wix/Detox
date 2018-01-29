---
id: Guide.RunningLocally
title: Running Locally
sidebar_label: Running Tests Locally
---

> If your app is ready and does not require any active development, you can write your tests using this workflow and run them locally on your machine. This is convenient for developing your test suite without actively developing your app.

This is the basic workflow. It takes your app executable and runs Detox tests against it.

<br>

## Step 1: Build your app

Detox is going to need the executable for your app. This means we need to build it first. We're going to use the Detox command line tools to build the app. During the installation, we've specified the actual build command line inside `package.json` under the `detox` configuration section.

Build the app by typing in terminal inside your project root:

```sh
detox build
```

> TIP: After build, the app executable should be found in the path specified inside `package.json` under the `detox` configuration section (`binaryPath`). That's where Detox is going to look for it.

<br>

## Step 2: Run Detox tests

Type the following inside your project root:

```sh
detox test
```

This will use Detox to find the app executable we've built in step 1, install it on a simulator and run Detox tests against it.
