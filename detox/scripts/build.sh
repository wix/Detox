#!/bin/bash

BABEL_ENV=test babel src -d lib
rm -f ios.tar
tar -cf ios.tar ios