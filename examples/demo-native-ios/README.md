> detox

# Pure Native iOS Demo Project

## Requirements

* make sure you have Xcode installed (tested with v8.1-8.2)
* iPhone 7 Plus simulator is installed
* make sure you have node installed (`brew install node`, node 8.3.0 and up is prefered, for native async-await support)

### Step 1: Npm install
* Make sure you're in folder `examples/demo-native-ios`
* Run `npm install`

### Step 2: Build the Demo Project
* Build the demo project
 
 ```sh
 detox build --configuration ios.sim.release
 ```
 
### Step 3: Test
* Run tests on the demo project
 
 ```sh
 detox test --configuration ios.sim.release
 ```
 This action will open a new simulator and run the tests on it.
