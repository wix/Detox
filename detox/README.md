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
* from now on, if you update code and want to re-run:
  * if you update JS, run `npm run test-update-js`
  * if you update native, run `npm run test-update-native`
    * if you have build issues run `npm run test-clean` and then `npm run test-install`
  * run `npm run test`
