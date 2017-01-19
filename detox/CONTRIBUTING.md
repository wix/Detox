> detox

# Library

This README is only relevant if you're interested in contributing to detox core itself. If you're just using detox to run tests on your projects, take a look at the README in the root folder.

## Install

### Install command line tools

```sh
npm install -g lerna
npm install -g react-native-cli
```

For all the internal projects (detox, detox-server, demos, test) `lerna` will create symbolic links in `node_modules` instead of `npm` copying the content of the projects. This way, any change you do on any code is there immediatly, no need to update node modules, or copy files between projects.

#### Update git submodules 
On project root directory

```sh
git submodule update --init --recursive`
```
(this makes sure all git submodule dependencies are properly checked out)

#### lerna bootstrap (instead of the multiple `npm install`s we did previosuly)

```sh
lerna bootsrap
```

## Run Tests

* make sure you're in folder `detox/detox`
* run `npm run test-clean`
* run `npm run test-install`
* run `npm run test`
  * `npm run test --debug` (for tests only on a debug app)
  * `npm run test --release` (for tests only on a release app)

## Before You Publish

* make sure you've ran the tests and they all pass
* run `npm run build`
* run `npm publish`

## Developing detox and maintaining your sanity

First, follow the instructions above until the tests pass. Run the tests after every change you make to verify you didn't break anything. Doing `test-install` after every change will drive you insane, so here are some tips to minimize wait time between changes you make:

 * if you change detox library JS code (stuff under `detox/detox/src`)
   * run `npm run test`
 * if you change detox library native code (stuff under `detox/detox/ios`)
   * run `npm run test-update-native`
   * run `npm run test`
 * if you change the e2e tests (stuff under `detox/detox/test/e2e`)
   * no need to do anything special
   * run `npm run test`
 * if you change the test RN app (stuff under `detox/detox/test`)
   * for debug
     * no need to do anything special
     * run `npm run test --debug`
   * for release
     * run `npm run test-install`
     * run `npm run test --release`