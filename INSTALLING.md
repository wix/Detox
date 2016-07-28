> detox

# Adding e2e tests to your project with detox

* [React Native projects](#react-native-project)
* [Pure native projects](#pure-native-project)

## React Native project

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
      "app": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "device": "iPhone 6s, iOS 9.3"
    }
  }
```
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

#### Step 4: Run your tests by following [these instructions](RUNNING.md)

## Pure native project

Instructions coming soon

<br>

## Troubleshooting build problems

* if you get weird "DerivedData" errors, change the Xcode "DerivedData" setting back to default
* if you get build problems, delete the following (since EarlGrey downloads them on build):
  * `detox/example/node_modules/detox/ios/EarlGrey/OCHamcrest.framework`
  * `detox/example/node_modules/detox/ios/EarlGrey/fishhook`
  * `detox/example/node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock`
