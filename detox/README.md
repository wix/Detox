> detox

# Library

## Install

* make sure you're in folder `detox/detox`
* run `npm install`
* run `npm run build`

## Run Tests

* make sure you're in folder `detox/detox`
* run `npm run test-clean`
* run `npm run test-install`
* run `npm run test`
  * `npm run test --debug` (for tests only on a debug app)
  * `npm run test --release` (for tests only on a release app)

## Developing detox and maintaining your sanity

First, follow the instructions above until the tests pass. Run the tests after every change you make to verify you didn't break anything. Doing `test-install` after every change will drive you insane, so here are some tips to minimize wait time between changes you make:

 * if you change detox library JS code (stuff under `detox/detox/src`)
   * run `npm run test-update-js`
   * run `npm run test`
 * if you change detox library native code (stuff under `detox/detox/ios`)
   * run `npm run test-update-native`
   * run `npm run test`
 * if you change the e2e tests (stuff under `detox/detox/test/e2e`)
   * no need to do anything special
   * run `npm run test`
 * if you change the test RN app (stuff under `detox/detox/text`)
   * for debug
     * no need to do anything special
     * run `npm run test --debug`
   * for release
     * run `npm run test-install`
     * run `npm run test --release`
 * if you change detox-server (stuff under `detox/detox-server`)
   * run `npm run test-update-js`
   * run `npm run test`
 * if you change detox-tools (stuff under `detox/detox-tools`)
   * run `cd test ; npm install detox-tools ; cd ..`
   * for debug
     * run `npm run test --debug`
   * for release
     * run `npm run test-install`
     * run `npm run test --release`
