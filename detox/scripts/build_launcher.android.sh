echo 'Building Android Launcher app from Appium...'
appPath="app/build/outputs/apk/debug/app-debug.apk"
cd ../android/detoxLauncher
./gradlew assembleDebug
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ];
then
    echo 'Android Launcher app build failed' && exit 1
else
    echo "Android Launcher app built successfully and located at: $(pwd)/${appPath}"
fi
