#!/bin/bash -e

export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$AWS_ACCESS_SECRET
export PATH=$HOME/.local/bin:$PATH

DATE=`date '+%Y-%m-%d_%H-%M-%S'`
ARTIFACTS_NAME="artifacts_${TRAVIS_BUILD_ID}_${DATE}.tar.gz"

if [ -d "detox/test/artifacts" ]; then
  tar cvzf ${ARTIFACTS_NAME} ./detox/test/artifacts/
  # pip install --user awscli
  aws s3 cp ${ARTIFACTS_NAME} s3://detox-artifacts/
fi
