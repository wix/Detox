#!/bin/bash -e

# Xcode is required to build. Without it this is a refusal, not a silent skip:
# a caller who asked for a framework build and got exit 0 would go on to a
# `launchApp` that cannot instrument anything. `postinstall` checks for Xcode
# itself and skips this script entirely, so an install still finishes; setting
# DETOX_DISABLE_POSTINSTALL turns the refusal back into a skip for anyone who
# wants the old behaviour.
if ! xcodebuild -version &>/dev/null; then
  if [ -n "${DETOX_DISABLE_POSTINSTALL:-}" ]; then
    echo "Xcode is not installed and DETOX_DISABLE_POSTINSTALL is set, skipping the Detox framework build."
    exit 0
  fi
  echo "error: Xcode is not installed on this machine, so the Detox framework cannot be built." >&2
  echo "       Install Xcode and run this again, or set DETOX_DISABLE_POSTINSTALL=1 to skip it." >&2
  exit 1
fi

detoxRootPath="$(dirname "$(dirname "$0")")"
detoxVersion=`node -p "require('${detoxRootPath}/package.json').version"`

sha1=`(echo "${detoxVersion}" && xcodebuild -version) | shasum | awk '{print $1}' #"${2}"`
detoxFrameworkDirPath="$HOME/Library/Detox/ios/framework/${sha1}"
detoxFrameworkPath="${detoxFrameworkDirPath}/Detox.framework"


function prepareAndBuildFramework () {
  if [ -d "$detoxRootPath"/ios ]; then
    detoxSourcePath="${detoxRootPath}"/ios
    echo "Dev mode, building from ${detoxSourcePath}"
    buildFramework "${detoxSourcePath}"
  else
    extractFramework
  fi
}

function extractFramework () {
  local tbz="${detoxRootPath}/Detox-ios-framework.tbz"
  # A tarball packed without `yarn package:ios` has no prebuilt framework. Say
  # so and let the install finish: the framework is only needed at launch time,
  # and DETOX_IOS_FRAMEWORK_PATH can point at one built elsewhere.
  if [ ! -f "${tbz}" ]; then
    echo "WARNING: ${tbz} is missing, so no Detox.framework was installed."
    echo "         Point DETOX_IOS_FRAMEWORK_PATH at a Detox.framework/Detox binary before running tests."
    exit 0
  fi

  echo "Extracting Detox framework..."
  mkdir -p "${detoxFrameworkDirPath}"
  tar -xjf "${tbz}" -C "${detoxFrameworkDirPath}"
}

function buildFramework () {
  detoxSourcePath="${1}"
  echo "Building Detox.framework from ${detoxSourcePath} into ${detoxFrameworkDirPath}"
  mkdir -p "${detoxFrameworkDirPath}"
  # Outside the output dir on purpose: build_framework.ios.sh wipes that dir first,
  # and the error handler below has to be able to read the log afterwards.
  logPath="${detoxFrameworkDirPath}.log"
  echo "Build log: ${logPath}"
  echo -n "" > "${logPath}"
  "${detoxRootPath}"/scripts/build_framework.ios.sh "${detoxSourcePath}"/Detox.xcodeproj "${detoxFrameworkDirPath}" &> "${logPath}" || {
    echo -e "#################################\nError building Detox.framework:\n----------------------------------\n"
    cat "${logPath}"
    echo "#################################"
    exit 1
  }
}

function main () {
  if [ -d "${detoxFrameworkDirPath}" ]; then
    if [ ! -f "${detoxFrameworkPath}/Detox" ]; then
      echo "${detoxFrameworkDirPath} was found, but could not find Detox.framework inside it. This means that the Detox framework build process was interrupted.
         deleting ${detoxFrameworkDirPath} and trying to rebuild."
      rm -rf "${detoxFrameworkDirPath}"
      prepareAndBuildFramework
    else
      echo "Detox.framework exists, skipping..."
    fi
  else
    prepareAndBuildFramework
  fi

  echo "Done"
}

main
