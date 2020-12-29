# Running on CI

When your test suite is finally ready, it should be set up to run automatically on your CI server on every git push. This will alert you if new changes to the app break existing functionality.

Running Detox on CI is not that different from running it locally. There are two main differences:
- You should test a release build rather than a debug build
- Tell Detox to shut down the simulator when test is over 

## Step 1: Prepare a Release Configuration for Your App

We will need to create a [release device configuration for Detox](/docs/APIRef.Configuration.md#device-configuration) inside `package.json` under the `detox` section.

**Example:**

```json
"detox": {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 12 Pro Max"
      }
    }
  }
}
```

> TIP: Notice that the name `example` above should be replaced with your actual project name.

## Step 2: Add `build` and `test` Commands to Your CI Script

Assuming your CI is executing some sort of shell script, add the following commands that should run inside the project root:

```sh
detox build --configuration ios.sim.release
detox test --configuration ios.sim.release --cleanup
```

> **Tip:** Adding `--cleanup` to the test command will make sure detox exits cleanly by shutting down the simulator when the test is over.

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
- brew tap wix/brew
- brew install applesimutils
- curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
- export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
- nvm install $NODE_VERSION
- nvm use $NODE_VERSION
- nvm alias default $NODE_VERSION

- npm install -g react-native-cli
- npm install -g detox-cli

script:
- detox build --configuration ios.sim.release
- detox test --configuration ios.sim.release --cleanup

```

### • Running Detox on [Bitrise](https://www.bitrise.io/)

Bitrise is a popular CI service for automating React Native apps. If you are looking to get started with Bitrise, check out [this](http://blog.bitrise.io/2017/07/25/how-to-set-up-a-react-native-app-on-bitrise.html) guide.

You can run Detox on Bitrise by creating a new workflow. Below is an example of the Bitrise **.yml** file for a workflow called `tests`. 

Additionally, you can use a [webhook](http://devcenter.bitrise.io/webhooks/) on Bitrise to post the build status directly into your Slack channel.

```yml
---
format_version: 1.1.0
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
trigger_map:
- push_branch: "*"
  workflow: tests
workflows:
  _tests_setup:
    steps:
    - activate-ssh-key: {}
    - git-clone:
        inputs:
        - clone_depth: ''
        title: Git Clone Repo
    - script:
        inputs:
        - content: |-
            #!/bin/bash

            npm cache verify

            npm install
        title: Install NPM Packages
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
    - npm:
        inputs:
        - command: install -g react-native-cli
        title: Install React Native CLI
    - script:
        inputs:
        - content: |-
            #!/bin/bash

            brew tap wix/brew
            brew install applesimutils
        title: Install Detox Utils
    - script:
        inputs:
        - content: |-
            #!/bin/bash

            detox build --configuration ios.sim.release
        title: Detox - Build Release App
    - script:
        inputs:
        - content: |-
            #!/bin/bash

            detox test --configuration ios.sim.release --cleanup
        title: Detox - Run E2E Tests
  tests:
    before_run:
    - _tests_setup
    - _detox_tests
    after_run: []
```

### • Running Detox on [GitlabCI](https://docs.gitlab.com/ee/ci/README.html) - Android Only

Gitlab is also a popular git management service which also include a built-in CI system. They provide free runner up to 2000 minutes for private projects, however, the runners provided by them cannot be used to run Detox due to the lack of KVM support (in order to run Android Emulators). You can, instead, [create your own runner](https://docs.gitlab.com/ee/ci/runners/README.html) with KVM support. Some example of cloud providers offering this are: [Digital Ocean](https://www.digitalocean.com/products/droplets/), AWS (with [c5 instance types](https://aws.amazon.com/ec2/instance-types/c5/)), [Google Cloud](https://cloud.google.com/compute/docs/instances/enable-nested-virtualization-vm-instances) and [Azure](https://docs.microsoft.com/en-us/azure/virtual-machines/windows/nested-virtualization)

One example of such job can be:

```yml
detox_e2e:
  stage: test
  image: reactnativecommunity/react-native-android
  variables:
  before_script:
    - npm i -g envinfo detox-cli && envinfo
    # Increase file watcher limit, see more here: https://github.com/guard/listen/wiki/Increasing-the-amount-of-inotify-watchers#the-technical-details
    - echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf && sysctl -p
    - mkdir -p /root/.android && touch /root/.android/repositories.cfg
    # The Dockerimage provides two paths for sdkmanager and avdmanager, which the defaults are from $ANDROID_HOME/cmdline-tools
    # That is not compatible with the one that Detox is using ($ANDROID_HOME/tools/bin)
    - echo yes | $ANDROID_HOME/tools/bin/sdkmanager --channel=0 --verbose "system-images;android-27;default;x86_64"
    # Nexus 6P, API 27, XXXHDPI
    - echo no | $ANDROID_HOME/tools/bin/avdmanager --verbose create avd --force --name "Nexus6P" --package "system-images;android-27;default;x86_64" --sdcard 200M --device 11
    - adb start-server
  script:
    - npx detox build -c android.emu.release.ci
    - npx detox test -c android.emu.release.ci --headless
```
