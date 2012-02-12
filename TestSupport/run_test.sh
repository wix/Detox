export MACOSX_DEPLOYMENT_TARGET="10.7"

TEST_SCENARIOS=$1
TEST_URL=$2
CONFIGURATION=$3

export SR_TEST_URL=$TEST_URL

bash TestSupport/ensure_virtualenv.sh .env

.env/bin/sr-testharness -i '' -c "$TEST_SCENARIOS" &

CHILD_PID=$!

xcodebuild -target SocketRocket -arch i386 -configuration $CONFIGURATION -sdk iphonesimulator clean
xcodebuild -target SRWebSocketTests -arch i386 -configuration $CONFIGURATION -sdk iphonesimulator clean build 

kill $CHILD_PID
