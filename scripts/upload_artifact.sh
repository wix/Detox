#!/bin/bash

DATE=`date '+%Y-%m-%d_%H-%M-%S'`

pack() {
  local BASE_NAME=$1
  local ARTIFACTS_DIR=$2
  local CONTEXT=$3

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

generate_allure_report() {
  local ROOT_DIR=$1

  cd $ROOT_DIR
  [ -d "allure-results" ] && allure generate || echo "No allure-results found."
  cd -
}

cd "$(dirname "$0")/.."
generate_allure_report detox
generate_allure_report detox/test
pack artifacts "detox/test/artifacts" "detoxtest"
pack artifacts "examples/demo-react-native/artifacts" "rnexample"
pack artifacts "examples/demo-react-native-jest/artifacts" "rnexamplejest"
pack allure "detox/test/allure-report" "allure-e2e"
pack allure "detox/allure-report" "allure-unit"
