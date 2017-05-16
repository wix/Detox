# Running on CI


Running detox on CI is not that different from running it locally. There are two main differences:

1. It is recommended to test a release build on CI, rather than a debug build, this means you will need to create a [release device configuration for detox](/docs/APIRef.Configuration.md#device-configuration)<br>
**example:**

	```json
	"detox": {
		...
	    "configurations": {
	      "ios.sim.release": {
	        "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
	        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
	        "type": "ios.simulator",
	        "name": "iPhone 7 Plus"
	      }
	    }
	  }
	```
2. Once the release configuration is done, add build and test commands to your CI script.<br> 
	Adding `--cleanup` flag to the test command will make sure detox exits cleanly by shutting down the simulator when test is over.
	
	```sh
	detox build --configuration ios.sim.release
	detox test --configuration ios.sim.release --cleanup
	```

### Running detox in Travis-CI
detox's own build is running on Travis, check out detox's [.travis.yml](/.travis.yml) file if you want to run detox tests on Travis as well.

This is a simple example configuration to get you started with detox on Travis:

```yaml
language: objective-c
osx_image: xcode8.3

branches:
  only:
  - master

env:
  global:
  - NODE_VERSION=stable

install:
- brew tap facebook/fb
- export CODE_SIGNING_REQUIRED=NO
- brew install fbsimctl --HEAD

- curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
- export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
- nvm install $NODE_VERSION
- nvm use $NODE_VERSION

- npm install -g react-native-cli
- npm install -g detox-cli

script:
- detox build --configuration ios.sim.release
- detox test --configuration ios.sim.release --cleanup


```