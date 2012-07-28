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

extra_opts="VALID_ARCHS=i386"

xcodebuild -target SocketRocket -arch i386 -configuration $CONFIGURATION -sdk iphonesimulator clean $extra_opts
xcodebuild -target SRWebSocketTests -arch i386 -configuration $CONFIGURATION -sdk iphonesimulator clean build TEST_AFTER_BUILD=YES $extra_opts

kill $CHILD_PID
