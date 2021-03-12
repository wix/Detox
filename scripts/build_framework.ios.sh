#!/bin/bash -e -x

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
    echo "Dev mode, will build from ${detoxSourcePath}"
    buildFramework "${detoxSourcePath}"
  else
    detoxSourcePath="${detoxRootPath}"/ios_src
    extractSources "${detoxSourcePath}"
    buildFramework "${detoxSourcePath}"
    rm -fr "${detoxSourcePath}"
  fi
}

function extractSources () {
  detoxSourcePath="${1}"
  echo "Extracting Detox sources..."
  mkdir -p "${detoxSourcePath}"
  tar -xjf "${detoxRootPath}"/Detox-ios-src.tbz -C "${detoxSourcePath}"
}

function buildFramework () {
  detoxSourcePath="${1}"
  echo "Building Detox.framework from ${detoxSourcePath}..."
  mkdir -p "${detoxFrameworkDirPath}"
  "${detoxRootPath}"/scripts/build_universal_framework.sh "${detoxSourcePath}"/Detox.xcodeproj "${detoxFrameworkDirPath}" &> "${detoxFrameworkDirPath}"/detox_ios.log
}

function main () {
  if [ -d "${detoxFrameworkDirPath}" ]; then
    if [ ! -d "${detoxFrameworkPath}" ]; then
      echo "${detoxFrameworkDirPath} was found, but could not find Detox.framework inside it. This means that the Detox framework build process was interrupted.
         deleting ${detoxFrameworkDirPath} and trying to rebuild."
      rm -rf "${detoxFrameworkDirPath}"
      prepareAndBuildFramework
    else
      echo "Detox.framework was previously compiled, skipping..."
    fi
  else
    prepareAndBuildFramework
  fi

  echo "Done"
}

main
