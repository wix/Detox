#!/usr/bin/env bash

set -e

export DISABLE_JUNIT_REPORTER=1

platform=$1

echo "Running e2e test for jest-circus timeout handling..."
node scripts/assert_timeout.js npm run "e2e:$platform" -- -H -o e2e-unhappy/detox-init-timeout/jest-circus/config.js e2e-unhappy 
cp coverage/lcov.info "../../coverage/e2e-$platform-timeout-ci.lcov"

echo "Running e2e test for jest-jasmine timeout handling..."
node scripts/assert_timeout.js npm run "e2e:$platform" -- -H -o e2e-unhappy/detox-init-timeout/jest-jasmine/config.js e2e-unhappy 
cp coverage/lcov.info "../../coverage/e2e-legacy-jasmine-$platform-timeout-ci.lcov"

echo "Running early syntax error test..."
node scripts/assert_timeout.js npm run "e2e:$platform" -- -H e2e-unhappy/early-syntax-error.test.js
cp coverage/lcov.info "../../coverage/e2e-early-syntax-error-$platform-ci.lcov"

echo "Running e2e stack trace mangling test (Client.js)..."
runnerOutput="$(npm run "e2e:$platform" -- -H e2e-unhappy/failing-matcher.test.js 2>&1 | tee /dev/stdout)"

if grep -q "await.*element.*supercalifragilisticexpialidocious" <<< "$runnerOutput" ;
then
    echo "Stack trace mangling for Client.js passed OK."
    cp coverage/lcov.info "../../coverage/e2e-$platform-error-stack-client-js.lcov"
else
    echo "Stack trace mangling for Client.js test has failed"
    echo "$runnerOutput"
    exit 1
fi

echo "Running e2e stack trace mangling test (Device.js.js)..."
runnerOutput="$(npm run "e2e:$platform" -- -H e2e-unhappy/failing-device-method.test.js 2>&1 | tee /dev/stdout)"

if grep -q "await.*device.*selectApp" <<< "$runnerOutput" ;
then
    echo "Stack trace mangling for Device.js has passed OK."
    cp coverage/lcov.info "../../coverage/e2e-$platform-error-stack-device-js.lcov"
else
    echo "Stack trace mangling for Device.js test has failed"
    echo "$runnerOutput"
    exit 1
fi
