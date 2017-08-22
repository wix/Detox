#!/bin/bash

set -e

./node_modules/.bin/prettier --write '*/!(node_modules|lib|coverage)/*/*.js'
if [ "$(git status --porcelain | wc -l)" != "0" ]; then exit 1 ; fi