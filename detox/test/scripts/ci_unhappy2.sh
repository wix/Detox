#!/usr/bin/env bash

platform=$1

DETOX_UNHAPPY_APPLESIMUTILS=`which applesimutils` \
DETOX_UNHAPPY_EMULATOR=`$ANDROID_SDK_ROOT/emulator/emulator` \
DETOX_UNHAPPY_GMSAAS=`which gmsaas` \
PATH="e2e-unhappy/device-boot-issues/bin:$PATH" \
npm run "e2e:$platform" -- -H e2e-unhappy/device-boot-issues/*.test.js
