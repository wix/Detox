#!/bin/bash -e

echo "steps:"

cat .buildkite/jobs/pipeline.ios_rn_72.yml
cat .buildkite/jobs/pipeline.ios_rn_70.yml
cat .buildkite/jobs/pipeline.android_rn_72.yml
cat .buildkite/jobs/pipeline.android_rn_70.yml
cat .buildkite/jobs/pipeline.android_demo_app_rn_72.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_72.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_70.yml
cat .buildkite/pipeline.post_processing.yml
