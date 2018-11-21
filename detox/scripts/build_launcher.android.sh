echo 'Building Android Launcher app for Appium...'

detoxRootPath="$(dirname "$(dirname "$0")")"
appPath="app/build/outputs/apk/debug/app-debug.apk"

cd ${detoxRootPath}/android/detoxLauncher
./gradlew assembleDebug

pwd
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ];
then
    echo 'Android Launcher app build failed' && exit 1
else
    echo "Android Launcher app built successfully and located at: $(pwd)/${appPath}"
fi
