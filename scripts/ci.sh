#!/bin/bash -e

lerna bootstrap
lerna run --ignore detox-demo*  build
lerna run --ignore detox-demo*  test

npm run e2e
#npm run release