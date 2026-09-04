#!/bin/bash -e

# Xcode is required to build. Without it this is a refusal, not a silent skip:
# a caller who asked for a framework build and got exit 0 would go on to a
# `launchApp` that cannot instrument anything. `postinstall` checks for Xcode
# itself and skips this script entirely, so an install still finishes; setting
# DETOX_DISABLE_POSTINSTALL turns the refusal back into a skip for anyone who
# wants the old behaviour.
if ! xcodebuild -version &>/dev/null; then
  if [ -n "${DETOX_DISABLE_POSTINSTALL:-}" ]; then
    echo "Xcode is not installed and DETOX_DISABLE_POSTINSTALL is set, skipping the XCUITest runner build."
    exit 0
  fi
  echo "error: Xcode is not installed on this machine, so the XCUITest runner cannot be built." >&2
  echo "       Install Xcode and run this again, or set DETOX_DISABLE_POSTINSTALL=1 to skip it." >&2
  exit 1
fi

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
  # Outside the output dir on purpose: build_xcuitest.ios.sh wipes that dir first,
  # and the error handler below has to be able to read the log afterwards.
  logPath="${detoxXctestRunnerDirPath}.log"
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
  if [ -d "${detoxXctestRunnerDirPath}" ]; then
    if [ -z "$(find "${detoxXctestRunnerDirPath}" -name '*.xctestrun' -print -quit)" ]; then
      echo "${detoxXctestRunnerDirPath} was found, but could not find an .xctestrun inside it. This means that the XCUITest runner build process was interrupted.
         deleting ${detoxXctestRunnerDirPath} and trying to rebuild."
      rm -rf "${detoxXctestRunnerDirPath}"
      prepareAndBuildXctestRunner
    else
      echo "XCUITest-runner exists, skipping..."
    fi
  else
    prepareAndBuildXctestRunner
  fi

  echo "Done"
}

main
