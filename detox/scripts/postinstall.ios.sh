#!/bin/bash

echo "###############################"
echo "Extracting Detox.framework..."

if [ -f Detox.src.tbz ]; then
  tar -xjf Detox.src.tbz
  rm -f Detox.src.tbz
fi
echo "###############################"