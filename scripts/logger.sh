#!/bin/bash -e

set +x

green='\033[0;32m'
yellow='\033[33m'
nocolor='\033[0m'

run_f () {
  cmd="${1}"

  echo -e "--- \"Running command ${yellow}${cmd}${nocolor}\""
  SECONDS=0

  set -x
  ($cmd)

  set +x
  duration=$SECONDS
  echo -e "${green}\t--> ${cmd} done in $(($duration / 60)) minutes and $(($duration % 60)) seconds ${nocolor}\n"
}
