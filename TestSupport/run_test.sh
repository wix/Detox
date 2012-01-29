export MACOSX_DEPLOYMENT_TARGET="10.7"

TEST_SCENARIOS=$1
TEST_KEY=$2
SDK=$3

export SR_TESTHARNESS_KEY=$TEST_KEY

bash TestSupport/ensure_virtualenv.sh .env

.env/bin/sr-testharness -k $TEST_KEY -i '' -c "$TEST_SCENARIOS" &

CHILD_PID=$!

xcodebuild -target SocketRocket -sdk $SDK -configuration Debug clean
xcodebuild -target SRWebSocketTests -sdk $SDK -configuration Debug clean build

kill $CHILD_PID
