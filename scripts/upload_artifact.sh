#!/bin/bash

DATE=`date '+%Y-%m-%d_%H-%M-%S'`

upload_artifacts() {
  ARTIFACTS_DIR=$1
  CONTEXT=$2

  if [ $CI ]; then
    ARTIFACTS_NAME="artifacts_${BUILDKITE_BUILD_NUMBER}_${CONTEXT}_${DATE}.tar.gz"
  else
    ARTIFACTS_NAME="artifacts_${TRAVIS_BUILD_ID}_${CONTEXT}_${DATE}.tar.gz"
  fi

  if [ -d "$ARTIFACTS_DIR" ]; then
    echo "Packing artifacts... (${CONTEXT})"
    tar cvzf "${ARTIFACTS_NAME}" ${ARTIFACTS_DIR}
  fi
}

upload_artifacts "detox/test/artifacts" "detoxtest"
upload_artifacts "examples/demo-react-native/artifacts" "rnexample"
upload_artifacts "examples/demo-react-native-jest/artifacts" "rnexamplejest"
