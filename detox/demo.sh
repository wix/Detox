#!/usr/bin/env bash

function handler {
  echo -e "\nDemo stopped with code $1 and signal $2\n"
  exit 0
}

trap 'handler $? SIGINT' SIGINT
trap 'handler $? SIGTERM' SIGTERM
trap 'handler $? EXIT' EXIT

echo "Demo started $(date)"

while true; do
  echo "Still running $(date)"
  sleep 1
done
