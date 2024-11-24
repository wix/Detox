#!/bin/bash -e

echo "agents:"
echo "  queue: 'mac-m2-mobile-debug'"
echo "steps:"
cat .buildkite/jobs/pipeline.ios_rn_73.yml
cat .buildkite/jobs/pipeline.ios_rn_71.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_73.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_71.yml
cat .buildkite/jobs/pipeline.android_rn_73.yml
cat .buildkite/jobs/pipeline.android_rn_71.yml
cat .buildkite/jobs/pipeline.android_demo_app_rn_73.yml
cat .buildkite/pipeline.post_processing.yml
