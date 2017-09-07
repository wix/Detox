# Running Tests on CI (Travis or Bitrise)

> When your test suite is finally ready, it should be set up to run automatically on your CI server on every git push. This will alert you if new changes to the app break existing functionality.

Running detox on CI is not that different from running it locally. There are two main differences:
1. We will test a release build rather than a debug build
2. We will tell Detox to shut down the simulator when test is over 

<br>

## Step 1: Prepare a release configuration for your app

We will need to create a [release device configuration for Detox](/docs/APIRef.Configuration.md#device-configuration) inside `package.json` under the `detox` section.

**Example:**

```json
"detox": {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
      "type": "ios.simulator",
      "name": "iPhone 7"
    }
  }
}
```

> TIP: Notice that the name `example` above should be replaced with your actual project name.

<br>

## Step 2: Add build and test commands to your CI script

Assuming your CI is executing some sort of shell script, add the following commands that should run inside the project root:

```sh
detox build --configuration ios.sim.release
detox test --configuration ios.sim.release --cleanup
```

> TIP: Adding `--cleanup` to the test command will make sure detox exits cleanly by shutting down the simulator when the test is over.

<br>

## Appendix

### • Running Detox on [Travis CI](https://travis-ci.org/)

Detox's own build is running on Travis, check out Detox's [.travis.yml](/.travis.yml) file to see how it's done.

This is a simple example configuration to get you started with Detox on Travis:

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

### • Running Detox on [Bitrise](https://www.bitrise.io/)

Bitrise is a popular CI service for automating React Native apps. If you are looking to get started with Bitrise, check out [this](http://blog.bitrise.io/2017/07/25/how-to-set-up-a-react-native-app-on-bitrise.html) guide.

You can run Detox on Bitrise by adding a `tests` workflow. Here's what the Bitrise **.yml** file looks like for doing so:

```yml
---
format_version: 1.1.0
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
workflows:
  _tests_setup:
    steps:
    - activate-ssh-key: {}
    - git-clone:
        inputs:
        - clone_depth: ''
    - script@1.1.4:
        inputs:
        - content: |-
            #!/bin/bash
            npm cache verify
            npm install
        title: Install Packages
    before_run: 
    after_run: 
  _detox_tests:
    before_run: []
    after_run: []
    steps:
    - npm:
        inputs:
        - command: install -g detox-cli
        title: Install Detox CLI
    - npm@0.9.0:
        inputs:
        - command: install -g react-native-cli
        title: Install React Native CLI
    - script:
        inputs:
        - content: |-
            #!/bin/bash
            brew tap facebook/fb
            export CODE_SIGNING_REQUIRED=NO
            brew install fbsimctl
            brew tap wix/brew
            brew install applesimutils --HEAD
        title: Install Detox Utils
    - script@1.1.4:
        title: Start Packager in Background
        inputs:
        - content: |-
            #!/bin/bash
            npm run start &
    - script:
        inputs:
        - content: |-
            #!/bin/bash
            detox build --configuration ios.sim.release
        title: Build Detox app
    - script:
        inputs:
        - content: |-
            #!/bin/bash
            detox test --configuration ios.sim.release
        - is_debug: 'yes'
        title: Run Detox Integration Tests
  tests:
    before_run:
    - _tests_setup
    - _detox_tests
    steps:
    - slack@2.6.2:
        inputs:
        - webhook_url: ##SLACK_WEBHOOK_URL
        - channel: "#builds"
        - from_username_on_error: Bitrise CI - Tests Shall Not Pass!!
        - from_username: Bitrise CI - Integration & Unit Tests Passing
        - message: |-
            *Build succeeded*: $BITRISE_GIT_MESSAGE
            *Branch*: $BITRISE_GIT_BRANCH

            Fuck it! Ship it!
        - message_on_error: |-
            *Build failed*: $BITRISE_GIT_MESSAGE
            *Branch*: $BITRISE_GIT_BRANCH

            _I believe in you!! Please try again._
        - emoji: ":shipit:"
        - emoji_on_error: ":bug:"
```
