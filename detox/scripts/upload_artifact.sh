#!/bin/bash

DATE=`date '+%Y-%m-%d_%H-%M-%S'`

pack() {
  BASE_NAME=$1
  ARTIFACTS_DIR=$2
  CONTEXT=$3

  if [ $CI ]; then
    ARTIFACTS_NAME="${BASE_NAME}_${BUILDKITE_BUILD_NUMBER}_${CONTEXT}_${DATE}.tar.gz"
  else
    ARTIFACTS_NAME="${BASE_NAME}_${TRAVIS_BUILD_ID}_${CONTEXT}_${DATE}.tar.gz"
  fi

  if [ -d "$ARTIFACTS_DIR" ]; then
    echo "Packing ${BASE_NAME}... (${CONTEXT})"
    tar cvzf "${ARTIFACTS_NAME}" ${ARTIFACTS_DIR}
  fi
}

cd "$(dirname "$0")/.."
pack artifacts "detox/test/artifacts" "detoxtest"
pack artifacts "examples/demo-react-native/artifacts" "rnexample"
pack artifacts "examples/demo-react-native-jest/artifacts" "rnexamplejest"
pack allure "detox/test/allure-report" "allure-e2e"
pack allure "detox/allure-report" "allure-unit"
