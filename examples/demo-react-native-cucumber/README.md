> detox

# React Native Cucumber Integration

This integration is mainly tested against android. But there shouldn't be any problem with ios also.

## Requirements

* Make sure you have Xcode or Android Studio installed based on your requirements
* make sure you have node installed (`brew install node`, node 8.3.0 and up is required for native async-await support, otherwise you'll have to babel the tests).
* Make sure you have react-native dependencies installed:
   * react-native-cli is installed (`npm install -g react-native-cli`)
   * watchman is installed (`brew install watchman`)

### Step 1: Npm install

* Make sure you're in folder `examples/demo-react-native-cucumber`.
* Run `yarn`.

## To test Release build of your app
### Step 2: Build 
* Build the demo project
 
 ```sh
 detox build --configuration android.emu.release
 ```
 
### Step 3: Test 
* Run tests on the demo project via cucumber command.
 
 ```sh
 node_modules/.bin/cucumber-js ./e2e/features --require-module @babel/register --configuration android.emu.release
 ```

 This action will open a new simulator and run the tests on it.

 Any arguments which you would have wanted to pass it to detox directly, you can continue to pass it as an argument to `cucumber-js` like how we have passed `--configuration` and detox will read it internally.


## To test Debug build of your app
### Step 2: Build 
* Build the demo project
 
 ```sh
 detox build --configuration android.emu.debug
 ```
 
### Step 3: Test 

 * start react-native packager
 
  ```sh
 npm run start
 ```
 * Run tests on the demo project
 
 ```sh
 node_modules/.bin/cucumber-js ./e2e/features --require-module @babel/register --configuration android.emu.debug
 ```
 This action will open a new simulator and run the tests on it.