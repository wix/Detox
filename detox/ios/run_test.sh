#!/bin/bash -e

if [ $# -lt 2 ]; then
    echo "Usage: run_test <simulator_identifier> -- [other args]"
    exit -1
fi

TEMPLATE_TEST_RUNNER=TestRunnerProduct
TESTRUN_FILE_NAME=DetoxTestRunner.xctestrun
TEMP_TEST_RUNNER=$(mktemp -d)
TESTRUN="$TESTRUN_FILE_NAME"
#Copy the entire testing bundle because Xcode needs to have the test runner app in the same path as the testrun file itself
cp -fR "$TEMPLATE_TEST_RUNNER"/* "$TEMP_TEST_RUNNER"

cd "$TEMP_TEST_RUNNER"

#Remove previous command line arguments
/usr/libexec/PlistBuddy -c "Delete DetoxTestRunner:CommandLineArguments" "$TESTRUN" || true
#Add an empty array
/usr/libexec/PlistBuddy -c "Add DetoxTestRunner:CommandLineArguments array" "$TESTRUN"

SIMULATOR_ID=$1
# SIMULATOR_ID="67CE96F9-6FF2-468D-9C38-96EEBDC7139E"

#Shift to remove the simulator identifier and --
shift 2

#Add script arguments as launch arguments of the test runner app
for i in $*; do
  /usr/libexec/PlistBuddy -c "Add DetoxTestRunner:CommandLineArguments: string '$i'" "$TESTRUN"
done

xcodebuild -destination "platform=iOS Simulator,id=$SIMULATOR_ID" test-without-building -xctestrun "$TESTRUN"

rm -fr "$TEMP_TEST_RUNNER"