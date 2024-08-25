#!/usr/bin/env bash

set -euo pipefail

CONFIGURATION="Release"
PROJECT_NAME="DetoxXCUITestRunner"

print_usage() {
    echo "Usage: $0 <xcodeproj_path> <xcuitest_output_dir>"
    exit 1
}

setup_output_dir() {
    local output_dir="$1"
    rm -rf "${output_dir}"
    mkdir -p "${output_dir}"
}

create_temp_dir() {
    local temp_dir
    temp_dir=$(mktemp -d)
    echo "${temp_dir}"
}

build_for_simulator() {
    local xcodeproj="$1"
    local temp_dir="$2"

    env -i xcodebuild \
        -project "${xcodeproj}" \
        -scheme "${PROJECT_NAME}" \
        -UseNewBuildSystem="YES" \
        -configuration "${CONFIGURATION}" \
        -sdk iphonesimulator \
        -destination 'generic/platform=iOS Simulator' \
        -derivedDataPath "${temp_dir}" \
        build-for-testing \
        -quiet
}

process_xctestrun() {
    local temp_dir="$1"
    local output_dir="$2"

    local xctestrun_file
    xctestrun_file=$(find "${temp_dir}" -name "*.xctestrun")

    # Copy the parent directory of the .xctestrun file, which contains the .xctestrun file and its associated binaries
    cp -r "$(dirname "${xctestrun_file}")" "${output_dir}"
}

main() {
    if [ $# -ne 2 ]; then
        print_usage
    fi

    local xcodeproj="$1"
    local output_dir="$2"

    setup_output_dir "${output_dir}"
    local temp_dir
    temp_dir=$(create_temp_dir)

    # Ensure cleanup happens on script exit
    trap "[[ -d ${temp_dir} ]] && rm -rf ${temp_dir}" EXIT

    build_for_simulator "${xcodeproj}" "${temp_dir}"
    process_xctestrun "${temp_dir}" "${output_dir}"
}

main "$@"
