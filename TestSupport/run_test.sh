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

extra_opts="VALID_ARCHS=i386 ARCH=i386"

SHARED_ARGS="-arch i386 -configuration $CONFIGURATION -sdk iphonesimulator"

xcodebuild -scheme SocketRocketTests $SHARED_ARGS TEST_AFTER_BUILD=YES  clean build $extra_opts
RESULT=$?

kill $CHILD_PID

exit $RESULT
