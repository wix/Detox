# Getting Started

This is a step-by-step guide to help you add detox to your project.

You can also go through this [short guide](https://medium.com/@bogomolnyelad/how-to-test-your-react-native-app-like-a-real-user-ecfc72e9b6bc)

If you used previous detox version, follow the [migration guide](../MIGRATION.md).

### Prerequisites
Running detox on iOS apps requires the following:

1. Mac with macOS (at least macOS El Capitan 10.11)
2. Xcode 8.2 with Xcode command line tools 

### Step 1: Installing dependencies

#### Install the latest version of [`Homebrew`](http://brew.sh)
Homebrew is a package manager for macOS, we'll need it to install other command line tools.

**Verify it works:** `brew -h` should print list of available commands.

#### Install [Node.js](https://nodejs.org/en/)
This is a JavaScript runtime detox will run on. **Install Node 7.6.0 and above for native async-await support**
	
 ```sh
 brew update && brew install node 
 ```

**Verify it works:** `node -v` should print current node version, make sure its higher than 7.6.0.

#### Install [`fbsimctl`](https://github.com/facebook/FBSimulatorControl/tree/master/fbsimctl)
This library helps detox manage and automate iOS Simulators.

 ```sh 
 brew tap facebook/fb
 export CODE_SIGNING_REQUIRED=NO && brew install fbsimctl --HEAD
 ```
	 
**Verify it works:** `fbsimctl list` should print list of available simulators.
	 
#### Install `detox-cli`
To make it easier to access detox command line tools.
 	`detox-cli` package should be installed globally, enabling usage of detox command line tools outside of your npm scripts.

  ```sh
  npm install -g detox-cli
  ```
**Verify it works:** `detox -h` should print list of available commands.

### Step 2: Add detox

* Install detox:

	```sh
	npm install detox --save-dev
	```

* Install mocha: 

	```sh
	npm install mocha --save-dev
	``` 

* Add this detox property to your `package.json` file: <br> 

	
	```json
	"detox": {
	  "configurations": {
	      "ios.sim.debug": {
	        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
	        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
	        "type": "ios.simulator",
	        "name": "iPhone 7"
	      }
	    } 
	  }
	```
*  In the detox property you just copied, switch `example` with your project name. <br>
In `"binaryPath"`: `example.app` should be `<your_project_name>.app`. <br>
In `"build"`: `example.xcodeproj` should be `<your_project_name>.xcodeproj` and 
`-scheme example` should be <br> `-scheme <your_project_name>`.
<br>

To test a release version, make sure to replace 'Debug' with 'Release' in the binaryPath and build properties.
For full configuration options see the **options** section below.
	

### Step 3: Create your first test (using mocha test runner)
##### Automatically:

```sh
detox init
```

##### Manually:

* Create an `e2e` folder in your project root.
* Create `mocha.opts` file with this [content](examples/demo-react-native/e2e/mocha.opts).
* Create `init.js` file with this [content](examples/demo-react-native/e2e/init.js).
* Create your first test! `myFirstTest.spec.js` with content similar to [this](examples/demo-react-native/e2e/example.spec.js).

### Step 4: Build your app and run detox tests
By using the `detox` command line tool, you can build and test your project easily.

* Build your app:

	```sh
	detox build
	```

* Test your app:

	```sh
	detox test
	```

That's it! Your first failing detox test! Next, we'll go over usage and how to make this test pass.