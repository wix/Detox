echo 'Building Android Wrapper app from Appium...'
appPath="app/build/outputs/apk/debug/app-debug.apk"
cd ../android/wrapperApp
./gradlew assembleDebug
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ];
then
    echo 'Android Wrapper app build failed'
    exit 1
else
    echo "Android Wrapper app built successfully and located at: $(pwd)/${appPath}"
fi
