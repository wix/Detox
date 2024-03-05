#!/usr/bin/env bash

trap 'kill $RN_PID' EXIT

PLATFORM=$1

npm start &
RN_PID=$!
sleep 2 && curl>/dev/null http://localhost:8081/index.$PLATFORM.bundle
wait $RN_PID
