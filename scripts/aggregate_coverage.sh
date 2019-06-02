#!/usr/bin/env bash

if [ -d aggregated-coverage ]; then
  npm install --no-save --no-package-lock "lcov-result-merger@3.x.x" "coveralls@3.x.x"

  rm -f "aggregated-coverage/merged.lcov"
  {
    for lcov in aggregated-coverage/**/*.lcov; do
      echo "Forcing relative paths in: $lcov"
      sed -i 's/^SF:.*\(detox-[a-z]\+-[0-9\-]\+-[a-z]\+\)\//SF:/g' $lcov
    done

    echo "Merging LCOV files"
    node_modules/.bin/lcov-result-merger 'aggregated-coverage/**/*.lcov' "aggregated-coverage/merged.lcov"
  } && {
    echo "Uploading to coveralls"
    cat "aggregated-coverage/merged.lcov" | node_modules/.bin/coveralls
  } || {
    echo "Failed to aggregate the test coverage, skipping."
  }
else
  echo "Aggregated coverage directory was not found, skipping."
fi
