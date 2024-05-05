#!/bin/bash -e

echo "env:
    JAVA_HOME: /opt/openjdk/openlogic-openjdk-17.0.9+9-mac-x64/jdk-17.0.9.jdk/Contents/Home"
echo "steps:"

cat .buildkite/jobs/pipeline.ios_rn_73.yml
cat .buildkite/jobs/pipeline.ios_rn_71.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_73.yml
cat .buildkite/jobs/pipeline.ios_demo_app_rn_71.yml
cat .buildkite/jobs/pipeline.android_rn_73.yml
cat .buildkite/jobs/pipeline.android_rn_71.yml
cat .buildkite/jobs/pipeline.android_demo_app_rn_73.yml
cat .buildkite/pipeline.post_processing.yml
