#!/usr/bin/env bash

set -e

export DISABLE_JUNIT_REPORTER=1

platform=$1

echo "Running e2e test for timeout handling..."
node scripts/assert_timeout.js npm run "e2e:$platform" -- -H -o e2e-unhappy/detox-init-timeout/config.js e2e-unhappy
cp coverage/lcov.info "../../coverage/e2e-$platform-timeout-ci.lcov"

echo "Running e2e stack trace mangling test..."
runnerOutput="$(npm run "e2e:$platform" -- -H e2e-unhappy/failing-matcher.test.js 2>&1 | tee /dev/stdout)"

if grep -q "await element.*supercalifragilisticexpialidocious" <<< "$runnerOutput" ;
then
    echo "Stack trace mangling has passed OK."
    cp coverage/lcov.info "../../coverage/e2e-$platform-error-stack-mangling.lcov"
else
    echo "Stack trace mangling test has failed"
    exit 1
fi
