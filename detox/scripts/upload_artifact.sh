#!/bin/bash -e

export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$AWS_ACCESS_SECRET

DATE=`date '+%Y-%m-%d_%H-%M-%S'`
ARTIFACTS_NAME="artifacts_${TRAVIS_BUILD_ID}_${DATE}.tar.gz"

tar cvzf ${ARTIFACTS_NAME} ./detox/test/artifacts/

aws s3 cp ${ARTIFACTS_NAME} s3://detox-artifacts/
