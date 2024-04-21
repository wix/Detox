#!/bin/bash -e

# Ensure Xcode is installed or print a warning message and return.
xcodebuild -version &>/dev/null || { echo "WARNING: Xcode is not installed on this machine. Skipping iOS xctest runner build phase"; exit 0; }

detoxRootPath="$(dirname "$(dirname "$0")")"
detoxVersion=`node -p "require('${detoxRootPath}/package.json').version"`

sha1=`(echo "${detoxVersion}" && xcodebuild -version) | shasum | awk '{print $1}' #"${2}"`
detoxXctestRunnerDirPath="$HOME/Library/Detox/ios/xcuitest-runner/${sha1}"

function prepareAndBuildXctestRunner () {
  if [ -d "$detoxRootPath"/ios ]; then
    detoxSourcePath="${detoxRootPath}"/ios
    echo "Dev mode, building XCUITest runner from ${detoxSourcePath}"
    buildXctestRunner "${detoxSourcePath}"
  else
    extractXctestRunner
  fi
}

function extractXctestRunner () {
  echo "Extracting Detox XCUITest runner..."
  mkdir -p "${detoxXctestRunnerDirPath}"
  tar -xjf "${detoxRootPath}"/Detox-ios-xcuitest.tbz -C "${detoxXctestRunnerDirPath}"
}

function buildXctestRunner () {
  detoxSourcePath="${1}"
  echo "Building XCUITest runner from ${detoxSourcePath} into ${detoxXctestRunnerDirPath}"
  mkdir -p "${detoxXctestRunnerDirPath}"
  logPath="${detoxXctestRunnerDirPath}"/detox_ios_xcuitest.log
  echo "Build log: ${logPath}"
  echo -n "" > "${logPath}"
  "${detoxRootPath}"/scripts/build_xcuitest.ios.sh "${detoxSourcePath}"/DetoxXCUITestRunner/DetoxXCUITestRunner.xcodeproj "${detoxXctestRunnerDirPath}" &> "${logPath}" || {
    echo -e "#################################\nError building DetoxXCUITestRunner.xctestrun:\n----------------------------------\n"
    cat "${logPath}"
    echo "#################################"
    exit 1
  }
}

function main () {
  if [ ! -d "${detoxXctestRunnerDirPath}" ]; then
    prepareAndBuildXctestRunner
  else
    echo "XCUITest-runner exists, skipping..."
  fi

  echo "Done"
}

main
