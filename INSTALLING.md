> detox

## Adding E2E Tests to Your Project with Detox

#### Step 0: Remove Previous Detox Integration

If you have integrated with Detox in the past, you will need to clean your project before integrating with current Detox version.

* Under Frameworks, remove "Detox.framework" from your project.
* In your AppDelegate.m, remove any Detox code, such as calls to `detoxConditionalInit()`.

#### Step 1: Prerequisites

Detox uses [Node.js](https://nodejs.org/) for its operation. Node manages dependencies through a file called `package.json`. You can read more information in the [official documentation](https://docs.npmjs.com/files/package.json).

* Install the latest version of `brew` from [here](http://brew.sh).
* If you haven't already, install Node.js by running `brew update && brew install node`.
* If you do not have a `package.json` file in the root folder of your project, create one by running `echo "{}" > package.json`.

By default, Xcode uses a randomized hidden path for outputting project build artifacts, called Derived Data. For ease of use, it is recommended to change the project build path to a more convenient path.

* With your project opened in Xcode, select menu `File` ► `Project Settings...`. Click on the `Advanced...` button, select `Custom` and from the drop-down menu, select `Relative to Workspace`.
 * Build artifacts will now be created in a `Build` folder next to your `xcodeproj` project.

#### Step 2: Create or Modify Your `package.json` for Detox

* Add `detox` and `detox-server` to the `devDependencies` section of `package.json`:
  * Run `npm install detox --save-dev`.
  * Run `npm install detox-server --save-dev`.
* Add to the `scripts` section of `package.json`:
```json
"scripts": {
    "e2e": "./node_modules/.bin/mocha e2e --opts ./e2e/mocha.opts"
  }
```
* Add a `detox` section to `package.json`:
```json
"detox": {
    "session": {
      "server": "ws://localhost:8099",
      "sessionId": "YourProject"
    },
    "ios-simulator": {
      "app": "ios/Build/Products/Debug_Detox-iphonesimulator/YourProject.app",
      "device": "iPhone 7, iOS 10.1"
    }
  }
```
> Note: replace `YourProject` above with your Product name from Xcode. Set the `app` path to the correct build path of your `.app` product, relative to the `package.json` file.

* The resulting `package.json` should look something like [this](demo-react-native/package.json).

#### Step 3: Integrate Detox in Your Project

* Make sure your Project schemes are shared. Open you project in Xcode, select menu `Product` ► `Scheme` ► `Manage Schemes...`, and check the `Shared Scheme` checkbox next to schemes that are part of the project. There is no need to do this for library schemes. Note the scheme you would like to use Detox with.
* In your root folder, run `node_modules/detox/scripts/deploy_detox.rb <Path To>/YourProject.xcodeproj`.
* Notice the new scheme(s) added in your Xcode project. If you had a `YourProject` scheme before, now there is an analogous `YourProject_Detox` scheme.

#### Step 4: Prepare the E2E Folder for Your Tests

* Create an `e2e` folder in your project root and open it.
* Create `mocha.opts` file with this [content](demo-react-native/e2e/mocha.opts).
* Create `init.js` file with this [content](demo-react-native/e2e/init.js).
* Create your first test! `myFirstTest.spec.js` with content similar to [this](demo-react-native/e2e/example.spec.js).

#### Step 5: Build Your Project

* Build your project with a newly created `_Detox` scheme:
	* Building with Xcode.
	   * Select the desired `_Detox` scheme.
	   * Build your project.
	* Building from command-line:
		* `xcodebuild -scheme YourProject_Detox -sdk iphonesimulator -derivedDataPath build`
	* Building using React Native
		* `react-native run-ios --scheme YourProject_Detox`
* If you have build problems, see [troubleshooting](#troubleshooting-build-problems).

> Note: remember to update the path for `app` in your `package.json`.

#### Step 6: Run Your Tests

* Follow [these instructions](RUNNING.md).

#### Step 7: Adding Additional Schemes

You can add additional schemes to your project normally. After making changes to 