> detox

# Adding E2E Tests to Your Project with Detox

* [React Native projects](#react-native-project)
* [Pure native projects](#pure-native-project)

<br>

## React Native Project

### Testing Your Project

#### Step 0: Remove Previous Detox Integration

* Under Frameworks, remove "Detox.framework" from your project.
* In your AppDelegate.m, remove any Detox code, such as calls to `detoxConditionalInit()`.

#### Step 1: Modify Your `package.json`

* Add detox to the `devDependencies` section of `package.json`:
  * Run `npm install detox --save-dev`.
  * Run `npm install detox-server --save-dev`.
* Add to the `scripts` section of `package.json`:
```json
"scripts": {
    "e2e": "./node_modules/.bin/mocha e2e --opts ./e2e/mocha.opts"
  }
```
* Add to the `detox` section of package.json:
```json
"detox": {
    "session": {
      "server": "ws://localhost:8099",
      "sessionId": "your-react-native-project"
    },
    "ios-simulator": {
      "app": "ios/build/Build/Products/YourProject_Detox-iphonesimulator/YourProject.app",
      "device": "iPhone 7, iOS 10.1"
    }
  }
```
> Note: replace `YourProject` above with your Product name from Xcode.

* The resulting `package.json` should look something like [this](demo-react-native/package.json).

#### Step 2: Integrate Detox in Your Project

* Make sure your Project scheme(s) are shared. Open you project in Xcode, open menu `Product` - `Scheme` - `Manage Schemes...`, and check the `Shared Scheme` checkbox next to schemes that are part of the project. There is no need to do this for library schemes. Note the scheme you used to run your project until now.
* In your root folder, run `node_modules/detox/scripts/deploy_detox.rb ios/YourProject.xcodeproj`.
* Notice the the new scheme(s) added in your Xcode project. If you had a `YourProject` scheme before, now there is an analogous `YourProject_Detox` scheme.

#### Step 3: Prepare the E2E Folder for Your Tests

* Create an `e2e` folder in your project root and open it.
* Create `mocha.opts` file with this [content](demo-react-native/e2e/mocha.opts).
* Create `init.js` file with this [content](demo-react-native/e2e/init.js).
* Create your first test! `myFirstTest.spec.js` with content similar to [this](demo-react-native/e2e/example.spec.js).

#### Step 4: Build and Run Your Project

* Make sure you're in your project root folder.
* Make sure you don't have any running RN packagers.
* Build your project by running `react-native run-ios --scheme "YourProject_Detox"`. Use the the `_Detox` variant of the scheme you use for development (usually `YourProject_Detox`).
* If the project was built successfully, you'll see the app in the simulator - you can safely close the simulator.
* The successful build results should be in `ios/build/Build/Products/YourProject_Detox-iphonesimulator`.
* If you have build problems, see [troubleshooting](#troubleshooting-build-problems).

> Note: if you build your project in a different way, make sure you specify the correct path in your `package.json` (detox > ios-simulator > app).

#### Step 5: Run Your Tests

* Follow [these instructions](RUNNING.md).

### Testing Your Project in Release

Make sure you've followed the Debug instructions first, then proceed.

#### Step 1: Create a Release Scheme

* Open your iOS project in Xcode (normally in `ios/YourProject.xcodeproj`).
* Open menu `Product` - `Scheme` - `Manage Schemes...` - choose the main scheme for your project and click `Edit...` - click `Duplicate Scheme`
* Rename the new scheme to `Release`, under `Info` - set `Build Configuration` to `Release`, remove the checkbox from `Debug executable`

#### Step 2: Reintegrate Detox with Your Modified Project

* In your root folder, run `node_modules/detox/scripts/deploy_detox.rb ios/YourProject.xcodeproj`.

#### Step 3: Modify package.json and build your project

* in the `detox` section of package.json, modify `app` to Release:
```json
    "ios-simulator": {
      "app": "ios/build/Build/Products/Release_Detox-iphonesimulator/YourProject.app",
      "device": "iPhone 6s, iOS 9.3"
    }
```
> Note: replace "YourProject" above with your Product name from Xcode.

* Make sure you are in your project root folder.
* Build your project by running `react-native run-ios --scheme "Release"`.
* If the project was built successfully, you'll see the app in the simulator - you can safely close the simulator.
* The successful build results should be in `ios/build/Build/Products/Release_Detox-iphonesimulator`.
* if you have build problems, see [troubleshooting](#troubleshooting-build-problems).

> Note: if you build your project in a different way, make sure you specify the correct path in your `package.json` (detox > ios-simulator > app).

#### Step 4: Run Your Tests

* Follow [these instructions](RUNNING.md).

<br>

## Pure native project

### Testing your project in Debug (default)

#### Step 1: Create a package.json

Your detox tests will run on node.js in JavaScript, let's create your node environment:

* install node.js on your machine (`brew install node`)
* make sure you're in your project root folder
* create folders named `ios` and `android` (or just one if it's not dual-platform)
* move the content of each native project into the applicable folder
* outside the `ios` and `android` folders, create a file named `package.json`
* place the following in package.json:
```json
{
  "name": "your-project-name",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "e2e": "./node_modules/.bin/mocha e2e --opts ./e2e/mocha.opts"
  },
  "devDependencies": {
    "detox": "latest",
    "detox-server": "latest"
  },
  "detox": {
    "session": {
      "server": "ws://localhost:8099",
      "sessionId": "your-native-project"
    },
    "ios-simulator": {
      "app": "ios/build/Products/Debug-iphonesimulator/YourProject.app",
      "device": "iPhone 6s, iOS 9.3"
    }
  }
}
```
* run `npm install`

> Note: replace "YourProject" above with your Product name from Xcode

#### Step 2: Change your project build output directory

* open your iOS project in Xcode (normally in `ios/YourProject.xcodeproj`)
* on the left pane, click on the project name on top, on the right choose the main target - `Build Phases`, then:
  * add another build phase by clicking add on top (the + icon) - `New Run Script Phase`
  * make sure the shell is `/bin/sh` and copy this script:
  ```shell
  cd ${SRCROOT}
  if [ ! -d "build" ]; then
      mkdir build
  fi
  cp -rf ${BUILT_PRODUCTS_DIR}/../ /${SRCROOT}/build/Products
  ```
> Note: now, when you build your project, the build output will also be copied to ios/build/Products (referenced by package.json)

#### Step 3: Add the native dependencies to your iOS project

* open your iOS project in Xcode (normally in `ios/YourProject.xcodeproj`)
* on the left pane, create a `Frameworks` folder and right click on it - `Add Files to "project"...`, then select `../node_modules/detox/ios/Detox.xcodeproj`
* on the left pane, click on the project name on top, on the right choose the main target - `Build Phases`, then:
  * under `Target Dependencies` - click add (the + icon) - `Detox`
  * add another build phase by clicking add on top (the + icon) - `New Copy Files Phase` - Destination `Frameworks` - click add (the + icon) - `Detox.framework`
* on the left pane, click on the project name on top, on the right choose the main target - `Build Settings`, then:
  * under `Header Search Paths` - click add (the + icon) - add the path `$(SRCROOT)/../node_modules/detox/ios` and mark as `recursive`
* on the left pane, choose `AppDelegate.m` and edit this file:
  * on top add:
  ```objc
  #import "DetoxLoader.h"
  ```
  * as the first line in `didFinishLaunchingWithOptions` add:
  ```objc
  detoxConditionalInit();
  ```
  * the resulting AppDelegate.m should look something like [this](demo-native/ios/NativeExample/AppDelegate.m)

#### Step 4: Prepare the e2e folder for your tests

* create an `e2e` folder in your project root and open it
* create `mocha.opts` file with this [content](demo-native/e2e/mocha.opts)
* create `init.js` file with this [content](demo-native/e2e/init.js)
* create your first test! `myFirstTest.spec.js` with content similar to [this](demo-native/e2e/example.spec.js)

#### Step 5: Build your project

* build your Xcode project
* if you have build problems, see [troubleshooting](#troubleshooting-build-problems)

#### Step 6: Run your tests by following [these instructions](RUNNING.md)

### Testing your project in Release

Coming soon...

<br>

## Troubleshooting build problems

* if you get build problems, delete the following folders (since EarlGrey downloads them on build):
  * `node_modules/detox/ios/EarlGrey/OCHamcrest.framework`
  * `node_modules/detox/ios/EarlGrey/fishhook`
  * `node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock`
  * you can do this automatically by running `node ./node_modules/detox/scripts/clean-build.js` from your project root (where package.json is)