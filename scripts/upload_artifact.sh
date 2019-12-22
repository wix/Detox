#!/bin/bash -e

export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$AWS_ACCESS_SECRET

DATE=`date '+%Y-%m-%d_%H-%M-%S'`

upload_artifacts() {
  ARTIFACTS_DIR=$1
  CONTEXT=$2

  if [ $JENKINS_CI ]; then
    ARTIFACTS_NAME="artifacts_${CONTEXT}_${BUILD_ID}_${DATE}.tar.gz"
  else
    ARTIFACTS_NAME="artifacts_${CONTEXT}_${TRAVIS_BUILD_ID}_${DATE}.tar.gz"
  fi

  if [ -d "$ARTIFACTS_DIR" ]; then
    echo "Packing artifacts..."
    tar cvzf "${ARTIFACTS_NAME}" ./detox/test/artifacts/

    if [ $JENKINS_CI ]; then
        echo "Upload: Jenkins will upload using built-in plugin"
    else
    echo "Uploading artifacts..."
        aws s3 cp "${ARTIFACTS_NAME}" s3://detox-artifacts/ --region=us-east-1
    fi

    echo "The artifacts archive is available for download at:"
    echo "https://detox-artifacts.s3.amazonaws.com/${ARTIFACTS_NAME}"
  fi
}

upload_artifacts "detox/test/artifacts" "detoxtest"
upload_artifacts "examples/demo-react-native/artifacts" "rnexample"
upload_artifacts "examples/demo-react-native-jest/artifacts" "rnexamplejest"
