#!/bin/bash -e

ORIGINAL_REPO=$(echo "$BUILDKITE_REPO" | sed 's/.*github.com\///')
PR_REPO=$(echo $BUILDKITE_PULL_REQUEST_REPO | sed 's/.*github.com\///')
echo "steps:"

[[ $PR_REPO != '' ]] && [[ $ORIGINAL_REPO != $PR_REPO ]] && echo '  - block: ":rocket: Release!"'


cat .buildkite/jobs/pipeline.ios_rn_64.yml
# cat .buildkite/jobs/pipeline.ios_rn_67.yml
# cat .buildkite/jobs/pipeline.android_rn_64.yml
# cat .buildkite/jobs/pipeline.android_rn_67.yml
# cat .buildkite/jobs/pipeline.android_demo_app_rn_67.yml
# cat .buildkite/jobs/pipeline.ios_demo_app_rn_67.yml
