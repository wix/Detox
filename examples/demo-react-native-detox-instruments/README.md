> detox

# React Native Demo Project

## Environment

### Fundamentals

**IMPORTANT:** Get your environment properly set up, as explained in our [contribution guide](../../docs/Guide.Contributing.md).

## To test Release build of your app
### Step 1: Build 
* Build the demo project
 
 ```sh
 detox build --configuration ios.sim.release
 ```
 
### Step 2: Test 
* Run tests on the demo project
 
 ```sh
 detox test --configuration ios.sim.release
 ```
 This action will open a new simulator and run the tests on it.

## To test Debug build of your app
### Step 1: Build 
* Build the demo project
 
 ```sh
 detox build --configuration ios.sim.debug
 ```
 
### Step 2: Test 

 * start react-native packager
 
  ```sh
 npm run start
 ```
 * Run tests on the demo project
 
 ```sh
 detox test --configuration ios.sim.debug
 ```
 This action will open a new simulator and run the tests on it.
