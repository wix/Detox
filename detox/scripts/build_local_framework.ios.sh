#!/bin/bash -e

# Ensure Xcode is installed or print a warning message and return.
xcodebuild -version &>/dev/null || { echo "WARNING: Xcode is not installed on this machine. Skipping iOS framework build phase"; exit 0; }

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
    if [ ! -d "${detoxFrameworkPath}" ]; then
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
