#!/bin/bash -e

echo "steps:"

# Android is disabled on the v21 alpha branch.
# cat .buildkite/jobs/pipeline.android_demo_app_rn_85_2.yml
# cat .buildkite/jobs/pipeline.android_rn_77.yml
# cat .buildkite/jobs/pipeline.android_rn_84.yml
# cat .buildkite/jobs/pipeline.android_rn_85_2.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_85_2.yml
cat .buildkite/jobs/pipeline.ios_rn_77.yml
cat .buildkite/jobs/pipeline.ios_rn_84.yml
cat .buildkite/jobs/pipeline.ios_rn_85_2.yml
cat .buildkite/pipeline.post_processing.yml
