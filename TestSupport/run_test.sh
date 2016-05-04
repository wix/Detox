TEST_SCENARIOS=$1
TEST_URL=$2
CONFIGURATION=$3


export SR_TEST_URL=$TEST_URL

bash TestSupport/ensure_virtualenv.sh .env

pushd TestSupport/sr-testharness/
python setup.py develop
popd

source .env/bin/activate
sr-testharness -i '' -c "$TEST_SCENARIOS" &

CHILD_PID=$!

DESTINATION="OS=9.2,name=iPhone 6s"
SDK="iphonesimulator"
SHARED_ARGS="-configuration $CONFIGURATION -sdk $SDK"

xcodebuild -scheme SocketRocketTests -destination "$DESTINATION" $SHARED_ARGS TEST_AFTER_BUILD=YES clean build
RESULT=$?

kill $CHILD_PID

exit $RESULT
