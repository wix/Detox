#!/bin/bash -e

# Ensure Xcode is installed or print a warning message and return.
xcodebuild -version &>/dev/null || { echo "WARNING: Xcode is not installed on this machine. Skipping iOS framework build phase"; exit 0; }

detoxRootPath="$(dirname "$(dirname "$0")")"
detoxVersion=`node -p "require('${detoxRootPath}/package.json').version"`

sha1=`(echo "${detoxVersion}" && xcodebuild -version) | shasum | awk '{print $1}' #"${2}"`
detoxFrameworkDirPath="$HOME/Library/Detox/ios/${sha1}"
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
  echo "Extracting Detox framework..."
  mkdir -p "${detoxFrameworkDirPath}"
  tar -xjf "${detoxRootPath}"/Detox-ios.tbz -C "${detoxFrameworkDirPath}"
}

function buildFramework () {
  detoxSourcePath="${1}"
  echo "Building Detox.framework from ${detoxSourcePath} into ${detoxFrameworkDirPath}"
  mkdir -p "${detoxFrameworkDirPath}"
  logPath="${detoxFrameworkDirPath}"/detox_ios.log
  echo "Build log: ${logPath}"
  echo -n "" > "${logPath}"
  "${detoxRootPath}"/scripts/build_universal_framework.sh "${detoxSourcePath}"/Detox.xcodeproj "${detoxFrameworkDirPath}" &> "${logPath}" || {
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
