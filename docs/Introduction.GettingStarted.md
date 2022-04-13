---
id: getting-started
slug: introduction/getting-started
title: Getting Started
sidebar_label: Getting Started
---

## Getting Started

**Welcome to Detox!**

In this guide, we will walk you through setting Detox up in your project, one step at a time.

You will find that some steps are longer than the others: some are just one-paragraph long, while for others we have a dedicated multistep guide worked out. Bear with us - it is all necessary, and once set-up, it is easy to move forward with writing tests very rapidly.

## Step 1: Environment Setup

### Install [Node.js](https://nodejs.org/en/)

`Node.js` is the JavaScript runtime Detox will run on. **Install Node.js `v12.0` or above**.

There’s more than one way to install Node.js:

- Download from the [official download page](https://nodejs.org/en/download/)
- Use [Homebrew](https://formulae.brew.sh/formula/node)
- Use `nvm` - if you need to allow for several versions to be installed on a single machine

The simplest way is to use Homebrew:

```sh
brew install node
```

> Tip: Verify installation succeeded by typing in `node -v` in the terminal to output current node version.

### Install Detox Command Line Tools (`detox-cli`)

This package makes it easier to operate Detox from the command line. `detox-cli` should be installed globally, enabling usage of the command line tools outside your npm scripts. `detox-cli` is merely a script that passes commands through to a command line tool shipped inside `detox` package (in `node_modules/.bin/detox`).

```sh
npm install -g detox-cli
```

### Install Platform-specific Dependencies, Tools and SDKs

Depending on the platform/s you’re aiming at (iOS, Android), take the time to run through these environment setup guides:

- [Android](Introduction.AndroidDevEnv.md)
- [iOS](Introduction.iOSDevEnv.md)

## Step 2: Add Detox to Your Project

### Install the Detox Node-module

If you have a React Native project, go to its root folder (where `package.json` is found) and type the following command:

```sh
npm install detox --save-dev
```

If you have a project without Node integration (such as a native project), add the following `package.json` file to the root folder of your project:

```json
{
  "name": "<your_project_name>",
  "version": "0.0.1"
}
```

Name your project in `package.json` and then run the following command:

```sh
npm install detox --save-dev --no-package-lock
```

**You should now have Detox available in `node_modules/detox`**

> **Tip:** Remember to add the `node_modules` folder to your git ignore file (e.g. `.gitignore`).

### Set Up a Test Runner

Follow [our comprehensive guide for Jest](Guide.Jest.md).

### Apply Detox Configuration

If you’ve completed the test-runner setup successfully using `detox init`, you should have a `.detoxrc.json` file containing a skeletal configuration for Detox to use. This configuration is only half-baked and needs to be set up properly. You now need to either create or edit that file, and apply the actual configuration suitable for your specific project.

Detox scans for a configuration through multiple files. It starts from the current working directory, and runs over the following options, in this order:

1. `.detoxrc.js`
1. `.detoxrc.json`
1. `.detoxrc`
1. `detox.config.js`
1. `detox.config.json`
1. `package.json` (`"detox"` section)

If you prefer to use something other than `.detoxrc.json`—for example, would like to keep all project configs in one place—you can create a `detox` section in your `package.json`. If you otherwise prefer separating configs, all of the other options are valid.

For specific configuration options for each supported platform, see:

- [Android](Introduction.Android.md)
- [iOS](Introduction.iOS.md)

## Step 3: Build Your App and Run Detox Tests

### 1. Build Your App

Use a convenience method in Detox command line tools to build your project easily:

```sh
detox build --configuration <your configuration name>
```

> **Note:** Detox executes the build command you specified in your Detox configuration. If your build fails, make sure to provide the correct build command.

### 2. Run the Tests

Use the Detox command line tools to test your project easily:

```sh
detox test --configuration <your configuration name>
```

That’s it. Your first failing Detox test is running!

Next, we’ll go over usage and how to make this test [actually pass](Introduction.WritingFirstTest.md).
