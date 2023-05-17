#!/bin/bash

DATE=`date '+%Y-%m-%d_%H-%M-%S'`
SCRIPTS_DIR=$(dirname "$0")
GENERATE_IFRAME="$(readlink -f "${SCRIPTS_DIR}/create_iframe_html.js")"

pack() {
  local BASE_NAME=$1
  local ARTIFACTS_DIR=$2
  local CONTEXT=$3

  if [ $CI ]; then
    ARTIFACTS_NAME="${BASE_NAME}_${BUILDKITE_BUILD_NUMBER}_${CONTEXT}_${DATE}.tar.gz"
  else
    ARTIFACTS_NAME="${BASE_NAME}_${TRAVIS_BUILD_ID}_${CONTEXT}_${DATE}.tar.gz"
  fi

  if [ -d "$ARTIFACTS_DIR" ]; then
    echo "Packing ${BASE_NAME}... (${CONTEXT})"
    tar cvzf "${ARTIFACTS_NAME}" ${ARTIFACTS_DIR}
  fi
}

generate_iframe() {
  node "${GENERATE_IFRAME}" "$@"
}

upload_to_surge() {
  local TIMESTAMP=$(date +%Y%m%d%H%M%S)
  local SURGE_PROJECT=$1
  local IFRAME_TITLE=$2
  local SURGE_SUBDOMAIN="${SURGE_PROJECT}-${TIMESTAMP}"
  local SURGE_DOMAIN="${SURGE_SUBDOMAIN}.surge.sh"

  if [ -d "${SURGE_PROJECT}" ]; then
    surge --domain "${SURGE_DOMAIN}" --project "${SURGE_PROJECT}" && \
    generate_iframe>>"${SURGE_SUBDOMAIN}.html" "https://${SURGE_DOMAIN}" "${IFRAME_TITLE}"
  else
    echo "Could not find directory named ${SURGE_PROJECT}."
  fi
}

generate_allure_report() {
  local ROOT_DIR=$1

  cd $ROOT_DIR
  if [ -d "allure-results" ]; then
    set -x
    allure generate && upload_to_surge allure-report "Detox Allure Report"
    set +x
  else
    echo "No allure-results found in ${ROOT_DIR}"
  fi
  cd -
}

cd "$(dirname "$0")/.."
npm -g install surge
generate_allure_report detox
generate_allure_report detox/test
pack artifacts "detox/test/artifacts" "detoxtest"
pack artifacts "examples/demo-react-native/artifacts" "rnexample"
pack artifacts "examples/demo-react-native-jest/artifacts" "rnexamplejest"
