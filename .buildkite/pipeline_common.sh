#!/bin/bash -e
echo "agents:"
echo "  queue: mbms-test"
echo "steps:"

cat .buildkite/jobs/pipeline.ios_rn_68.yml
cat .buildkite/jobs/pipeline.ios_rn_69.yml
cat .buildkite/jobs/pipeline.android_rn_68.yml
cat .buildkite/jobs/pipeline.android_rn_69.yml
cat .buildkite/jobs/pipeline.android_demo_app_rn_68.yml
cat .buildkite/jobs/pipeline.android_demo_app_rn_69.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_68.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_69.yml
cat .buildkite/pipeline.post_processing.yml
