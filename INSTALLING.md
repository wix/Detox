> detox

# Adding e2e tests to your project with detox

* [React Native projects](#react-native-project)
* [Pure native projects](#pure-native-project)

<br>

## React Native project

### Testing your project in Debug (default)

#### Step 1: Modify your package.json

* add detox to the `devDependencies` section of package.json:
  * run `npm install detox --save-dev`
  * run `npm install detox-server --save-dev`
* add to the `scripts` section of package.json:
```json
"scripts": {
    "e2e": "mocha e2e --opts ./e2e/mocha.opts"
  }
```
* add to the `detox` section of package.json:
```json
"detox": {
    "session": {
      "server": "ws://localhost:8099",
      "sessionId": "example"
    },
    "ios-simulator": {
      "app": "ios/build/Build/Products/Debug-iphonesimulator/yourproject.app",
      "device": "iPhone 6s, iOS 9.3"
    }
  }
```
> Note: replace "yourproject" above with your Product name from Xcode

* the resulting package.json should look something like [this](rn-example/package.json)

#### Step 2: Add the native dependencies to your iOS project

* open your iOS project in Xcode (normally in `ios/yourproject.xcodeproj`)
* on the left pane, right click on the `Libraries` folder - `Add Files to "project"...`, then select `../node_modules/detox/ios/Detox.xcodeproj`
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
  * the resulting AppDelegate.m should look something like [this](rn-example/ios/example/AppDelegate.m)

#### Step 3: Prepare the e2e folder for your tests

* create an `e2e` folder in your project root and open it
* create `mocha.opts` file with this [content](rn-example/e2e/mocha.opts)
* create `init.js` file with this [content](rn-example/e2e/init.js)
* create your first test! `myFirstTest.spec.js` with content similar to [this](rn-example/e2e/example.spec.js)

#### Step 4: Build and run your project

* make sure you're in your project root folder
* make sure you don't have any running RN packagers
* build your project by running `react-native run-ios`
* if everything is ok, you'll see the app in the simulator - you can close the simulator after
* the successful build results should be in `ios/build/Build/Products/Debug-iphonesimulator`
* if you have build problems, see [troubleshooting](#troubleshooting-build-problems)

> Note: if you build your project in a different way, it's ok, just make sure build results are found where specified in package.json (detox > ios-simulator > app)

#### Step 5: Run your tests by following [these instructions](RUNNING.md)

### Testing your project in Release

Make sure you've followed the Debug instructions first, then proceed

#### Step 1: Create a Release scheme

* open your iOS project in Xcode (normally in `ios/yourproject.xcodeproj`)
* open menu `Product` - `Scheme` - `Manage Schemes...` - choose the main scheme for your project and click `Edit...` - click `Duplicate Scheme`
* rename the new scheme to `Release`, under `Info` - set `Build Configuration` to `Release`, remove the checkbox from `Debug executable`

#### Step 2: Modify package.json and build your project

* in the `detox` section of package.json, modify `app` to Release:
```json
    "ios-simulator": {
      "app": "ios/build/Build/Products/Release-iphonesimulator/yourproject.app",
      "device": "iPhone 6s, iOS 9.3"
    }
```
> Note: replace "yourproject" above with your Product name from Xcode

* make sure you're in your project root folder
* build your project by running `react-native run-ios --scheme "Release"`
* if everything is ok, you'll see the app in the simulator - you can close the simulator after
* the successful build results should be in `ios/build/Build/Products/Release-iphonesimulator`
* if you have build problems, see [troubleshooting](#troubleshooting-build-problems)

> Note: if you build your project in a different way, it's ok, just make sure the "Release" scheme build results are found where specified in package.json (detox > ios-simulator > app)

#### Step 3: Run your tests by following [these instructions](RUNNING.md)

<br>

## Pure native project

### Testing your project in Debug (default)

#### Step 1: Create a package.json
Apparently, your project is not a node of npm (Node.js isn't necessary for a pure native project).
<br>In order to use Detox, you should create a `package.json` file.
* Go to your project root directory.
* Create a folder named `ios` (Not necessary, just for your arrangement)
* Move the content of your root directory to this folder.
* Outside the `ios` folder, create a file named `package.json`.
* copy this to your `package.json` (edit variables like `name`):
```json
{
  "name": "native-example",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "e2e": "mocha e2e --opts ./e2e/mocha.opts"
  },
  "devDependencies": {
    "detox": "latest",
    "detox-server": "latest"
  },
  "detox": {
    "session": {
      "server": "ws://localhost:8099",
      "sessionId": "example"
    },
    "ios-simulator": {
      "app": "ios/build/products/Debug-iphonesimulator/NativeExample.app",
      "device": "iPhone 6s, iOS 9.3"
    }
  }
}
```
  > Note: replace "NativeExample" from detox => ios-simulator => app with your Product name from Xcode
* Run `npm install`

#### Step 2: Copying the build output to your project
* Open your Xcode project.
* In the Project-Navigator, click your top project.
* On the left, choose your main target and go to `Build Phases`
* Click on the top left `+` and choose `New Run Script Phase`
* Make sure the shell is `/bin/sh` and copy this script:
  ```shell
  cd ${SRCROOT}
  if [ ! -d "build" ]; then
      mkdir build
  fi
  cp -rf ${BUILT_PRODUCTS_DIR}/../ /${SRCROOT}/build/products
  ```
  > Note: now, when you build your project, the built products will be copied to your ios/build/products dir. Now in your `package.json` file, `detox => ios-simulator => app` should be the path to the executable (`.app`) that is generated by the script above.

#### Step 3: Add the native dependencies to your iOS project

* open your iOS project in Xcode (normally in `ios/yourproject.xcodeproj`)
* on the left pane, right click on the `Libraries` folder - `Add Files to "project"...`, then select `../node_modules/detox/ios/Detox.xcodeproj`
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
  * the resulting AppDelegate.m should look something like [this](rn-example/ios/example/AppDelegate.m)

#### Step 4: Prepare the e2e folder for your tests

* create an `e2e` folder in your project root and open it
* create `mocha.opts` file with this [content](rn-example/e2e/mocha.opts)
* create `init.js` file with this [content](rn-example/e2e/init.js)
* create your first test! `myFirstTest.spec.js` with content similar to [this](rn-example/e2e/example.spec.js)

#### Step 5: Build your project
* Build your project with `cmd+b`.

#### Step 5: Run your tests by following [these instructions](RUNNING.md)

### Testing your project in Release
Coming soon...

<br>

## Troubleshooting build problems

* if you get build problems, delete the following folders (since EarlGrey downloads them on build):
  * `node_modules/detox/ios/EarlGrey/OCHamcrest.framework`
  * `node_modules/detox/ios/EarlGrey/fishhook`
  * `node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock`
